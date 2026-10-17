import { Types } from "mongoose";
import { calculateMarketplaceFees } from "../config/constants";
import PaymentLedger from "../models/PaymentLedger.model";
import Booking from "../models/Booking.model";
import Bid from "../models/Bid.model";
import type { MarketplaceFeeQuote } from "./pricing.service";
import { createTransaction, verifyWebhookSignature } from "../utils/rapidGateway";

export type PaymentProviderName = "rapid_gateway";

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
  metadata?: Record<string, unknown>;
  feeSnapshot?: MarketplaceFeeQuote;
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
    const currency = (params.currency || "").toUpperCase();
    if (!currency) {
      throw { statusCode: 422, code: "PAYMENT_CURRENCY_REQUIRED", message: "Checkout currency is required." };
    }

    const checkoutUrl = await createTransaction({
      amount: params.amount,
      currency,
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
      currency,
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
  metadata?: Record<string, unknown>;
  feeSnapshot?: MarketplaceFeeQuote;
}) {
  // Ledger values use the agreed checkout/booking quote, never today's rates.
  let fees: MarketplaceFeeQuote | undefined = args.feeSnapshot;
  if (!fees && args.bookingId) {
    const booking = await Booking.findById(args.bookingId).select("subtotal studentFee tutorFee tax studentTotal tutorNet feeConfig").lean();
    if (booking) fees = { subtotal: booking.subtotal, studentFee: booking.studentFee, tutorFee: booking.tutorFee,
      tax: booking.tax, studentTotal: booking.studentTotal, tutorNet: booking.tutorNet, feeConfig: booking.feeConfig };
  }
  if (!fees && args.bidId) {
    const bid = await Bid.findById(args.bidId).select("feeQuote").lean();
    if (bid?.feeQuote) fees = bid.feeQuote;
  }
  // Backwards compatibility for old transactions without an archived quote.
  if (!fees) fees = calculateMarketplaceFees(args.amount);
  const platformNet = fees.studentFee + fees.tutorFee;
  const settlementStatus: "expected" | "unsettled" = args.status === "succeeded" ? "expected" : "unsettled";
  const doc = {
    provider: paymentProvider.name,
    providerEventId: args.providerEventId,
    providerTransactionId: args.providerTransactionId,
    eventType: args.eventType,
    status: args.status,
    grossAmount: args.amount,
    currency: args.currency || "PKR",
    studentPayment: fees.studentTotal,
    studentFee: fees.studentFee,
    tutorFee: fees.tutorFee,
    tax: fees.tax,
    gatewayFee: 0,
    refundAmount: args.eventType === "payment.refunded" ? args.amount : 0,
    tutorPayable: fees.tutorNet,
    platformNet,
    settlementStatus,
    booking: args.bookingId ? new Types.ObjectId(args.bookingId) : undefined,
    bid: args.bidId ? new Types.ObjectId(args.bidId) : undefined,
    student: args.studentId ? new Types.ObjectId(args.studentId) : undefined,
    tutor: args.tutorId ? new Types.ObjectId(args.tutorId) : undefined,
    metadata: args.metadata || {},
  };

  if (args.providerEventId) {
    return PaymentLedger.findOneAndUpdate(
      { provider: paymentProvider.name, providerEventId: args.providerEventId },
      { $setOnInsert: doc },
      { upsert: true, new: true }
    );
  }

  return PaymentLedger.create(doc);
}
