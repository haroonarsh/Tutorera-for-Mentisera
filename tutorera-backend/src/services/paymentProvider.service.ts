import { Types } from "mongoose";
import { calculateMarketplaceFees } from "./pricing.service";
import PaymentLedger from "../models/PaymentLedger.model";
import { rapidpayProvider } from "./rapidpayProvider.service";

export type PaymentProviderName = "rapidpay";
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
  name: "rapidpay" as PaymentProviderName,

  async createCheckout(params: CheckoutParams): Promise<string> {
    const checkoutUrl = await rapidpayProvider.createCheckout({
      amount: params.amount,
      currency: params.currency,
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

  verifyWebhookSignature: rapidpayProvider.verifyWebhookSignature,

  normalizeWebhook(body: {
    eventId: string;
    eventType: string;
    merchantTransactionId: string;
    status: string;
    amount: number;
    currency?: string;
  }): ProviderWebhookEvent {
    return {
      provider: "rapidpay",
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
    currency: args.currency || "PKR",
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
