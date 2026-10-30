import { Types } from "mongoose";
import { calculateMarketplaceFees } from "./pricing.service";
import PaymentLedger from "../models/PaymentLedger.model";
import { rapidPayProvider } from "./rapidPayProvider.service";
import { httpError } from "../utils/httpError";
import { withCheckoutGuard } from "./checkoutGuard.service";

/** PaymentLedger.metadata is Mixed; read it without casting the document. */
function readLedgerString(metadata: unknown, key: string): string | undefined {
  if (!metadata || typeof metadata !== "object") return undefined;
  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

function readLedgerNumber(metadata: unknown, key: string): number | undefined {
  if (!metadata || typeof metadata !== "object") return undefined;
  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export type PaymentProviderName = "rapidpay";
export type LedgerProviderName = PaymentProviderName | "swich" | "manual";
export type FeeSnapshot = {
  subtotal: number; studentFee: number; tutorFee: number; tax: number;
  studentTotal: number; tutorNet: number; platformFee: number;
  gatewayFee?: number;
  feeConfig?: Record<string, unknown>;
};

export interface CheckoutSession {
  sessionId: string;
  clientSecret: string;
  publishableKey: string;
}

export interface CheckoutParams {
  amount: number;
  currency?: string;
  marketCountryCode?: string;
  customerMobileNo?: string;
  customerEmail: string;
  basketId: string;
  description: string;
  successUrl?: string;
  failureUrl?: string;
  bookingId?: string;
  bidId?: string;
  studentId?: string;
  tutorId?: string;
  feeSnapshot?: FeeSnapshot;
  metadata?: Record<string, unknown>;
}

export const paymentProvider = {
  name: "rapidpay" as PaymentProviderName,

  async createCheckout(params: CheckoutParams): Promise<CheckoutSession> {
    return withCheckoutGuard(params.basketId, (markDispatched) => paymentProvider.createCheckoutLocked(params, markDispatched));
  },

  async createCheckoutLocked(params: CheckoutParams, markDispatched: () => void): Promise<CheckoutSession> {
    const platformCurrency = (params.currency || "USD").toUpperCase();

    if (!Number.isFinite(params.amount) || params.amount <= 0) {
      throw httpError("Payment amount must be a positive number", 400, "INVALID_PAYMENT_AMOUNT");
    }

    // Idempotency guard: if a previous session for this basket is still open
    // or succeeded, block a new one. If confirmed paid, refuse. If still live,
    // the student must be shown the existing checkout URL rather than a new one.
    const previousCheckout = await PaymentLedger.findOne({ providerTransactionId: params.basketId, eventType: "checkout.created" }).sort("-createdAt");
    const previousSessionId = readLedgerString(previousCheckout?.metadata, "sessionId");
    if (previousCheckout && !previousSessionId) {
      throw httpError("The previous payment session needs review before retrying.", 409, "PAYMENT_RETRY_UNVERIFIED");
    }
    if (previousSessionId) {
      let previousStatus: string | undefined;
      try {
        previousStatus = (await rapidPayProvider.getSessionStatus(previousSessionId)).status;
      } catch {
        throw httpError("Unable to verify the previous payment session. Please try later or contact support.", 503, "PAYMENT_RETRY_UNVERIFIED");
      }
      if (previousStatus === "success") {
        throw httpError("A previous payment for this offer already went through. Refresh to confirm your booking.", 409, "PAYMENT_ALREADY_COMPLETED");
      }
      if (!["failed", "expired", "cancelled"].includes(previousStatus || "")) {
        throw httpError("The previous payment session is not safely closed. Contact support.", 409, "PAYMENT_RETRY_UNVERIFIED");
      }
    }

    markDispatched();
    const { sessionId, clientSecret, publishableKey } = await rapidPayProvider.createCheckout({
      amount: params.amount,
      currency: platformCurrency,
      marketCountryCode: params.marketCountryCode,
      reference: params.basketId,
      customerEmail: params.customerEmail,
      customerMobile: params.customerMobileNo,
    });

    const ledgerMetadata = {
      sessionId,
      clientSecret,
      publishableKey,
      platformAmount: params.amount,
      platformCurrency,
      ...(params.metadata || {}),
    };

    await recordPaymentLedger({
      providerTransactionId: params.basketId,
      eventType: "checkout.created",
      status: "pending",
      amount: params.amount,
      currency: platformCurrency,
      bookingId: params.bookingId,
      bidId: params.bidId,
      studentId: params.studentId,
      tutorId: params.tutorId,
      feeSnapshot: params.feeSnapshot,
      metadata: ledgerMetadata,
    });

    // Refresh metadata on retries so confirmCheckout always polls the latest session.
    await PaymentLedger.updateOne(
      { providerTransactionId: params.basketId, eventType: "checkout.created" },
      { $set: { metadata: ledgerMetadata, grossAmount: params.amount, currency: platformCurrency, status: "pending" } }
    );

    return { sessionId, clientSecret, publishableKey };
  },

  /**
   * Pull-based confirmation — called from the confirm endpoint hit on the
   * frontend's successUrl/failedUrl return.
   *
   * Returns amount/currency in platform terms (USD) so the caller's existing
   * integrity check against the offer/booking is unaffected.
   */
  async confirmCheckout(basketId: string): Promise<{ confirmed: boolean; sessionStatus: string; amount: number; currency: string }> {
    const ledgerEntry = await PaymentLedger.findOne({ providerTransactionId: basketId, eventType: "checkout.created" }).sort("-createdAt");
    const sessionId = readLedgerString(ledgerEntry?.metadata, "sessionId");

    if (!sessionId) {
      throw httpError("No payment session found for this transaction", 404, "PAYMENT_SESSION_MISSING");
    }

    const session = await rapidPayProvider.getSessionStatus(sessionId);
    const confirmed = session.status === "success";

    const expectedAmount = readLedgerNumber(ledgerEntry?.metadata, "platformAmount");
    const expectedCurrency = readLedgerString(ledgerEntry?.metadata, "platformCurrency");

    if (confirmed && expectedAmount !== undefined && expectedCurrency) {
      if (session.amount !== expectedAmount || session.currency.toUpperCase() !== expectedCurrency.toUpperCase()) {
        throw httpError("RapidPay session amount does not match the amount requested", 422, "RAPIDPAY_SESSION_MISMATCH");
      }
    }

    return {
      confirmed,
      sessionStatus: session.status,
      amount: ledgerEntry?.grossAmount || session.amount,
      currency: ledgerEntry?.currency || session.currency,
    };
  },
};

export async function recordPaymentLedger(args: {
  provider?: LedgerProviderName;
  providerTransactionId: string;
  providerEventId?: string;
  eventType: "checkout.created" | "payment.succeeded" | "payment.failed" | "payment.refunded" | "payout.requested" | "payout.completed" | "manual.adjustment";
  status: "pending" | "succeeded" | "failed" | "refunded" | "processing";
  amount: number;
  currency?: string;
  bookingId?: string;
  bidId?: string;
  studentId?: string;
  tutorId?: string;
  feeSnapshot?: FeeSnapshot;
  settlementStatus?: "unsettled" | "expected" | "settled" | "reconciled" | "exception";
  metadata?: Record<string, unknown>;
}) {
  const snapshot = args.feeSnapshot;
  const accounting = snapshot || await (async () => {
    const fees = await calculateMarketplaceFees(args.amount, { currency: args.currency });
    return {
      subtotal: args.amount,
      studentFee: fees.studentFee,
      tutorFee: fees.tutorFee,
      tax: fees.tax,
      studentTotal: fees.studentTotal,
      tutorNet: fees.tutorNet,
      platformFee: fees.tutorFee + fees.tax,
      gatewayFee: fees.gatewayFee,
    };
  })();
  const provider = args.provider || paymentProvider.name;
  const settlementStatus = args.settlementStatus || (args.status === "succeeded" ? "expected" : "unsettled");
  const gatewayFee = accounting.gatewayFee || 0;

  const doc = {
    provider,
    ...(args.providerEventId && { providerEventId: args.providerEventId }),
    providerTransactionId: args.providerTransactionId,
    eventType: args.eventType,
    status: args.status,
    grossAmount: args.amount,
    currency: args.currency || "USD",
    studentPayment: accounting.studentTotal,
    studentFee: accounting.studentFee,
    tutorFee: accounting.tutorFee,
    tax: accounting.tax,
    gatewayFee,
    refundAmount: args.eventType === "payment.refunded" ? args.amount : 0,
    tutorPayable: accounting.tutorNet,
    platformNet: accounting.platformFee - gatewayFee,
    settlementStatus,
    feeSnapshot: snapshot || {},
    ...(args.bookingId && { booking: new Types.ObjectId(args.bookingId) }),
    ...(args.bidId && { bid: new Types.ObjectId(args.bidId) }),
    ...(args.studentId && { student: new Types.ObjectId(args.studentId) }),
    ...(args.tutorId && { tutor: new Types.ObjectId(args.tutorId) }),
    metadata: args.metadata || {},
  };

  const filter = args.providerEventId
    ? { provider, providerEventId: args.providerEventId }
    : { providerTransactionId: args.providerTransactionId, eventType: args.eventType };

  return PaymentLedger.findOneAndUpdate(
    filter,
    { $setOnInsert: doc },
    { upsert: true, returnDocument: "after" }
  );
}
