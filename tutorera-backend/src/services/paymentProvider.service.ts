import { Types } from "mongoose";
import { calculateMarketplaceFees } from "../config/constants";
import PaymentLedger from "../models/PaymentLedger.model";
import { createTransaction, verifyWebhookSignature } from "../utils/rapidGateway";

export type PaymentProviderName = "rapid_gateway";
export type LedgerProviderName = PaymentProviderName | "manual";
export type FeeSnapshot = {
  subtotal: number; studentFee: number; tutorFee: number; tax: number;
  studentTotal: number; tutorNet: number; platformFee: number;
  feeConfig?: Record<string, unknown>;
};

export interface CheckoutParams {
  amount: number;
  currency?: string;
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

export interface ProviderWebhookEvent {
  provider: PaymentProviderName;
  eventId: string;
  eventType: string;
  merchantTransactionId: string;
  status: string;
  amount: number;
  currency: string;
}

export const paymentProvider = {
  name: "rapid_gateway" as PaymentProviderName,

  async createCheckout(params: CheckoutParams): Promise<string> {
    const currency = (params.currency || "PKR").toUpperCase();
    if (currency !== "PKR") {
      throw {
        statusCode: 409,
        message: "Checkout is not available in this market yet. Rapid Gateway currently supports PKR only.",
      };
    }

    const checkoutUrl = await createTransaction({
      amount: params.amount,
      customerMobileNo: params.customerMobileNo,
      customerEmail: params.customerEmail,
      basketId: params.basketId,
      description: params.description,
      successUrl: params.successUrl,
      failureUrl: params.failureUrl,
      checkoutUrl: params.checkoutUrl,
    });

    await recordPaymentLedger({
      providerTransactionId: params.basketId,
      eventType: "checkout.created",
      status: "pending",
      amount: params.amount,
      currency: params.currency || "PKR",
      bookingId: params.bookingId,
      bidId: params.bidId,
      studentId: params.studentId,
      tutorId: params.tutorId,
      feeSnapshot: params.feeSnapshot,
      metadata: { checkoutUrl, ...(params.metadata || {}) },
    });

    return checkoutUrl;
  },

  verifyWebhookSignature,

  normalizeWebhook(body: {
    eventId: string;
    eventType: string;
    merchantTransactionId: string;
    status: string;
    amount: number;
    currency?: string;
  }): ProviderWebhookEvent {
    return {
      provider: "rapid_gateway",
      eventId: body.eventId,
      eventType: body.eventType,
      merchantTransactionId: body.merchantTransactionId,
      status: body.status,
      amount: body.amount,
      currency: body.currency || "PKR",
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
  const fees = calculateMarketplaceFees(args.amount);
  const snapshot = args.feeSnapshot;
  const accounting = snapshot || {
    subtotal: args.amount,
    studentFee: fees.studentFee,
    tutorFee: fees.tutorFee,
    tax: fees.tax,
    studentTotal: fees.studentTotal,
    tutorNet: fees.tutorNet,
    platformFee: fees.tutorFee + fees.tax,
  };
  const provider = args.provider || paymentProvider.name;
  const settlementStatus = args.settlementStatus || (args.status === "succeeded" ? "expected" : "unsettled");
  const doc = {
    provider,
    providerEventId: args.providerEventId,
    providerTransactionId: args.providerTransactionId,
    eventType: args.eventType,
    status: args.status,
    grossAmount: args.amount,
    currency: args.currency || "PKR",
    studentPayment: accounting.studentTotal,
    studentFee: accounting.studentFee,
    tutorFee: accounting.tutorFee,
    tax: accounting.tax,
    gatewayFee: 0,
    refundAmount: args.eventType === "payment.refunded" ? args.amount : 0,
    tutorPayable: accounting.tutorNet,
    platformNet: accounting.platformFee,
    settlementStatus,
    feeSnapshot: snapshot || {},
    booking: args.bookingId ? new Types.ObjectId(args.bookingId) : undefined,
    bid: args.bidId ? new Types.ObjectId(args.bidId) : undefined,
    student: args.studentId ? new Types.ObjectId(args.studentId) : undefined,
    tutor: args.tutorId ? new Types.ObjectId(args.tutorId) : undefined,
    metadata: args.metadata || {},
  };

  if (args.providerEventId) {
    return PaymentLedger.findOneAndUpdate(
      { provider, providerEventId: args.providerEventId },
      { $setOnInsert: doc },
      { upsert: true, new: true }
    );
  }

  return PaymentLedger.create(doc);
}
