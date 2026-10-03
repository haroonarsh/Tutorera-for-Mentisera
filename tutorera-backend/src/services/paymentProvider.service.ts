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
    const { checkoutUrl, paymentSessionGuid } = await swichProvider.createCheckout({
      amount: params.amount,
      currency: params.currency,
      marketCountryCode: params.marketCountryCode,
      reference: params.basketId,
      metadata: {
        studentMobileNo: params.customerMobileNo,
        studentEmail: params.customerEmail,
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

    // paymentSessionGuid is stored here, in the ledger's metadata, because
    // it's the only durable record that exists at checkout-creation time —
    // no Booking exists yet for the BID- flow, and this ledger row is
    // looked up again later (by basketId/providerTransactionId) from the
    // new confirm-payment endpoint to retrieve it for the status-check call.
    await recordPaymentLedger({
      providerTransactionId: params.basketId,
      eventType: "checkout.created",
      status: "pending",
      amount: params.amount,
      currency: params.currency || "USD",
      bookingId: params.bookingId,
      bidId: params.bidId,
      studentId: params.studentId,
      tutorId: params.tutorId,
      feeSnapshot: params.feeSnapshot,
      metadata: { checkoutUrl, paymentSessionGuid, ...(params.metadata || {}) },
    });

    return checkoutUrl;
  },

  /**
   * Pull-based confirmation — Swich's Payment Session product has no
   * documented push webhook (unlike a webhook-based integration this
   * replaced), so this is called from a dedicated confirm endpoint hit on
   * the frontend's successURL/failedURL return, not from a webhook route.
   */
  async confirmCheckout(basketId: string): Promise<{ confirmed: boolean; sessionStatus: string; amount: number; currency: string }> {
    const ledgerEntry = await PaymentLedger.findOne({ providerTransactionId: basketId, eventType: "checkout.created" }).sort("-createdAt");
    const paymentSessionGuid = readLedgerString(ledgerEntry?.metadata, "paymentSessionGuid");
    if (!paymentSessionGuid) {
      throw httpError("No payment session found for this transaction", 404, "PAYMENT_SESSION_MISSING");
    }

    const session = await swichProvider.getPaymentSessionStatus(paymentSessionGuid);
    return {
      confirmed: session.sessionStatus === "Success",
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
    { upsert: true, new: true }
  );
}
