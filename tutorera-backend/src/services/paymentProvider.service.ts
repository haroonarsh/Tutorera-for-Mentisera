import { Types } from "mongoose";
import { calculateMarketplaceFees } from "./pricing.service";
import PaymentLedger from "../models/PaymentLedger.model";
import { swichProvider } from "./swichProvider.service";
import { httpError } from "../utils/httpError";

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

/**
 * Swich charges in PKR only (its docs: amount is "1 to 10,000,000 PKR"), but
 * the platform prices, fees and pays tutors in USD. The conversion happens
 * ONLY here, at the gateway boundary: everything in our database stays in the
 * platform currency, and the PKR figure actually charged is recorded in the
 * ledger next to the rate used, so it can be audited and verified later.
 *
 * Rounds UP to a whole rupee so rounding can never under-collect.
 */
function toGatewayAmount(amount: number, platformCurrency: string): { gatewayAmount: number; gatewayCurrency: "PKR"; fxRate: number } {
  if (platformCurrency === "PKR") return { gatewayAmount: Math.ceil(amount), gatewayCurrency: "PKR", fxRate: 1 };
  if (platformCurrency !== "USD") {
    throw httpError(`Swich checkout does not support ${platformCurrency}.`, 409, "SWICH_CURRENCY_UNSUPPORTED");
  }
  const fxRate = Number(process.env.USD_PKR_RATE);
  if (!Number.isFinite(fxRate) || fxRate <= 0) {
    // Fail closed: charging with a missing/garbage rate would mis-price real money.
    throw httpError("USD_PKR_RATE is not configured", 503, "FX_RATE_MISSING");
  }
  return { gatewayAmount: Math.ceil(amount * fxRate), gatewayCurrency: "PKR", fxRate };
}

export type PaymentProviderName = "swich";
export type LedgerProviderName = PaymentProviderName | "manual";
export type FeeSnapshot = {
  subtotal: number; studentFee: number; tutorFee: number; tax: number;
  studentTotal: number; tutorNet: number; platformFee: number;
  gatewayFee?: number;
  feeConfig?: Record<string, unknown>;
};

export interface CheckoutParams {
  amount: number;
  currency?: string;
  marketCountryCode?: string;
  customerMobileNo: string;
  customerEmail: string;
  /**
   * Payer's 13-digit CNIC, required by Swich on every payment session. Passed
   * straight through to Swich for this one request — deliberately NOT written
   * to the ledger, logs, or any model.
   */
  customerCnic?: string;
  basketId: string;
  description: string;
  successUrl: string;
  failureUrl: string;
  checkoutUrl: string;
  bookingId?: string;
  bidId?: string;
  studentId?: string;
  tutorId?: string;
  feeSnapshot?: FeeSnapshot;
  metadata?: Record<string, unknown>;
}

export const paymentProvider = {
  name: "swich" as PaymentProviderName,

  async createCheckout(params: CheckoutParams): Promise<string> {
    const platformCurrency = (params.currency || "USD").toUpperCase();
    const { gatewayAmount, gatewayCurrency, fxRate } = toGatewayAmount(params.amount, platformCurrency);

    // A retry reuses the same basket. Before opening a NEW Swich session, deal
    // with the previous one so the student can never pay for the same order
    // twice: if it already succeeded, refuse (the booking just needs
    // confirming); if it is still open, cancel it. Cancel is best-effort — an
    // expired or finished session is fine to leave alone.
    const previousCheckout = await PaymentLedger.findOne({ providerTransactionId: params.basketId, eventType: "checkout.created" }).sort("-createdAt");
    const previousGuid = readLedgerString(previousCheckout?.metadata, "paymentSessionGuid");
    if (previousGuid) {
      let previousStatus: string | undefined;
      try {
        previousStatus = (await swichProvider.getPaymentSessionStatus(previousGuid)).sessionStatus;
      } catch {
        previousStatus = undefined;
      }
      if (previousStatus === "Success") {
        throw httpError("A previous payment for this offer already went through. Refresh to confirm your booking.", 409, "PAYMENT_ALREADY_COMPLETED");
      }
      if (previousStatus === "Pending") {
        await swichProvider.cancelPaymentSession(previousGuid).catch(() => undefined);
      }
    }

    const { checkoutUrl, paymentSessionGuid, mode } = await swichProvider.createCheckout({
      amount: gatewayAmount,
      currency: gatewayCurrency,
      marketCountryCode: params.marketCountryCode,
      reference: params.basketId,
      metadata: {
        studentMobileNo: params.customerMobileNo,
        studentEmail: params.customerEmail,
        customerCnic: params.customerCnic,
        description: params.description,
        successUrl: params.successUrl,
        failureUrl: params.failureUrl,
        checkoutUrl: params.checkoutUrl,
        studentId: params.studentId,
        bookingId: params.bookingId,
        bidId: params.bidId,
        feeSnapshot: params.feeSnapshot,
      }
    });

    // Everything needed to confirm later lives on this ledger row: the
    // session GUID, and what we ASKED Swich to charge (PKR amount + the rate),
    // so confirmCheckout can verify Swich's own record against it.
    const ledgerMetadata = {
      checkoutUrl,
      paymentSessionGuid,
      checkoutMode: mode,
      gatewayAmount,
      gatewayCurrency,
      fxRate,
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

    // recordPaymentLedger only writes on INSERT ($setOnInsert). A payment
    // retry reuses the same basketId, so without this the ledger row would
    // keep the FIRST attempt's (possibly expired) session GUID and amount, and
    // confirmation would poll the wrong session. Refresh them on every
    // checkout creation.
    await PaymentLedger.updateOne(
      { providerTransactionId: params.basketId, eventType: "checkout.created" },
      { $set: { metadata: ledgerMetadata, grossAmount: params.amount, currency: platformCurrency } }
    );

    return checkoutUrl;
  },

  /**
   * Pull-based confirmation — Swich's Payment Session product has no
   * documented push webhook, so this is called from the confirm endpoint hit
   * on the frontend's successURL/failureURL return, not from a webhook route.
   *
   * Returns the amount/currency in PLATFORM terms (USD) so the caller's
   * existing integrity check against the offer/booking keeps working. Before
   * returning, it verifies Swich's own record (PKR) against what we asked it
   * to charge.
   */
  async confirmCheckout(basketId: string): Promise<{ confirmed: boolean; sessionStatus: string; amount: number; currency: string }> {
    const ledgerEntry = await PaymentLedger.findOne({ providerTransactionId: basketId, eventType: "checkout.created" }).sort("-createdAt");
    const paymentSessionGuid = readLedgerString(ledgerEntry?.metadata, "paymentSessionGuid");
    const mode = readLedgerString(ledgerEntry?.metadata, "checkoutMode");
    if (mode === "pwa" && !paymentSessionGuid) {
      // PWA settlement is callback-driven. The browser return only indicates
      // that the customer left the hosted page; it is never payment proof.
      return { confirmed: false, sessionStatus: "CallbackPending", amount: ledgerEntry?.grossAmount || 0, currency: ledgerEntry?.currency || "USD" };
    }
    if (!paymentSessionGuid) {
      throw httpError("No payment session found for this transaction", 404, "PAYMENT_SESSION_MISSING");
    }

    const session = await swichProvider.getPaymentSessionStatus(paymentSessionGuid);
    const confirmed = session.sessionStatus === "Success";

    const gatewayAmount = readLedgerNumber(ledgerEntry?.metadata, "gatewayAmount");
    const gatewayCurrency = readLedgerString(ledgerEntry?.metadata, "gatewayCurrency");

    if (gatewayAmount !== undefined && gatewayCurrency) {
      if (confirmed && (session.amount !== gatewayAmount || String(session.currency || "").toUpperCase() !== gatewayCurrency.toUpperCase())) {
        throw httpError("Swich session amount does not match the amount requested", 422, "SWICH_SESSION_MISMATCH");
      }
      return {
        confirmed,
        sessionStatus: session.sessionStatus,
        amount: ledgerEntry?.grossAmount || 0,
        currency: ledgerEntry?.currency || "USD",
      };
    }

    // Ledger rows created before the PKR conversion existed have no gateway
    // fields; keep their original behaviour.
    return {
      confirmed,
      sessionStatus: session.sessionStatus,
      amount: session.amount,
      currency: session.currency,
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