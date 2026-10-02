import { Server as SocketIOServer } from "socket.io";
import Bid from "../models/Bid.model";
import Booking from "../models/Booking.model";
import PaymentLedger from "../models/PaymentLedger.model";
import Request from "../models/Request.model";
import logger from "../config/logger";
import { finalizeBidAcceptance } from "../controllers/request.controller";
import { paymentProvider, recordPaymentLedger } from "./paymentProvider.service";
import { finalizePromoRedemption, getAppliedPromoForBasket } from "./promoCode.service";

export type SwichReconciliationResult = {
  basketId: string;
  confirmed: boolean;
  sessionStatus: string;
  finalized: boolean;
};

const RECONCILIATION_BATCH_SIZE = 25;
const MINIMUM_CHECKOUT_AGE_MS = 60_000;

/**
 * Settles a server-created Switch checkout without trusting a browser redirect.
 * The checkout ledger is the immutable server-side statement of the expected
 * amount/currency. `finalizeBidAcceptance` remains the one authoritative
 * offer-to-booking transition and is already concurrency-safe.
 */
export async function reconcileSwichCheckout(basketId: string, io?: SocketIOServer): Promise<SwichReconciliationResult> {
  const checkout = await PaymentLedger.findOne({
    provider: "swich",
    providerTransactionId: basketId,
    eventType: "checkout.created",
  }).sort("-createdAt");
  if (!checkout) {
    const error = new Error("No checkout ledger entry found") as Error & { statusCode?: number };
    error.statusCode = 404;
    throw error;
  }

  const alreadySettled = await PaymentLedger.exists({
    provider: "swich",
    providerTransactionId: basketId,
    eventType: "payment.succeeded",
    status: "succeeded",
  });
  if (alreadySettled) return { basketId, confirmed: true, sessionStatus: "Success", finalized: false };

  const result = await paymentProvider.confirmCheckout(basketId);
  if (!result.confirmed) {
    if (["Failed", "Expired", "Cancelled"].includes(result.sessionStatus)) {
      await PaymentLedger.updateOne({ _id: checkout._id, status: "pending" }, { $set: { status: "failed", "metadata.sessionStatus": result.sessionStatus } });
      await recordPaymentLedger({
        providerTransactionId: basketId,
        eventType: "payment.failed",
        status: "failed",
        amount: checkout.grossAmount,
        currency: checkout.currency,
        bookingId: checkout.booking?.toString(),
        bidId: checkout.bid?.toString(),
        studentId: checkout.student?.toString(),
        tutorId: checkout.tutor?.toString(),
        metadata: { sessionStatus: result.sessionStatus },
      });
    }
    return { basketId, confirmed: false, sessionStatus: result.sessionStatus, finalized: false };
  }

  if (result.amount !== checkout.grossAmount || result.currency.toUpperCase() !== checkout.currency.toUpperCase()) {
    await PaymentLedger.updateOne({ _id: checkout._id }, { $set: { settlementStatus: "exception", "metadata.sessionStatus": result.sessionStatus } });
    const error = new Error("Switch payment amount or currency did not match the checkout ledger") as Error & { statusCode?: number };
    error.statusCode = 422;
    throw error;
  }

  if (basketId.startsWith("BID-")) {
    const bidId = basketId.slice("BID-".length);
    const bid = await Bid.findById(bidId);
    if (!bid) throw new Error("Offer not found for checkout reconciliation");
    const request = await Request.findById(bid.request).select("student");
    if (!request) throw new Error("Tuition request not found for checkout reconciliation");

    await finalizeBidAcceptance(bidId, io);
    await recordPaymentLedger({
      providerTransactionId: basketId,
      eventType: "payment.succeeded",
      status: "succeeded",
      amount: result.amount,
      currency: result.currency,
      bidId,
      studentId: request.student.toString(),
      tutorId: bid.tutor.toString(),
      metadata: { sessionStatus: result.sessionStatus, reconciledBy: "system" },
    });
    return { basketId, confirmed: true, sessionStatus: result.sessionStatus, finalized: true };
  }

  const booking = await Booking.findById(basketId);
  if (!booking) throw new Error("Booking not found for checkout reconciliation");
  const updated = await Booking.findOneAndUpdate(
    { _id: booking._id, paymentStatus: { $ne: "confirmed" } },
    { $set: { paymentStatus: "confirmed", paymentNote: "Confirmed via Switch payment-session reconciliation" } },
    { new: true }
  );
  if (updated) {
    const promo = await getAppliedPromoForBasket(basketId);
    if (promo) {
      await finalizePromoRedemption(promo.promoCodeId, booking.student.toString(), booking._id.toString(), promo.originalAmount, promo.discountAmount)
        .catch((err) => logger.error({ err, bookingId: booking._id }, "Failed to record reconciled promo redemption"));
    }
  }
  await recordPaymentLedger({
    providerTransactionId: basketId,
    eventType: "payment.succeeded",
    status: "succeeded",
    amount: result.amount,
    currency: result.currency,
    bookingId: booking._id.toString(),
    studentId: booking.student.toString(),
    tutorId: booking.tutor.toString(),
    metadata: { sessionStatus: result.sessionStatus, reconciledBy: "system" },
  });
  return { basketId, confirmed: true, sessionStatus: result.sessionStatus, finalized: Boolean(updated) };
}

export async function processPendingSwichCheckouts(io?: SocketIOServer): Promise<{ scanned: number; settled: number; failed: number; errors: string[] }> {
  const result = { scanned: 0, settled: 0, failed: 0, errors: [] as string[] };
  const cutoff = new Date(Date.now() - MINIMUM_CHECKOUT_AGE_MS);
  const checkouts = await PaymentLedger.find({
    provider: "swich",
    eventType: "checkout.created",
    status: "pending",
    updatedAt: { $lte: cutoff },
  }).select("providerTransactionId").sort("createdAt").limit(RECONCILIATION_BATCH_SIZE).lean();

  result.scanned = checkouts.length;
  for (const checkout of checkouts) {
    try {
      const reconciliation = await reconcileSwichCheckout(checkout.providerTransactionId, io);
      if (reconciliation.confirmed) result.settled += 1;
    } catch (error: any) {
      result.failed += 1;
      result.errors.push(`${checkout.providerTransactionId}: ${error?.message || "unknown reconciliation error"}`);
      logger.error({ err: error, basketId: checkout.providerTransactionId }, "Switch checkout reconciliation failed");
    }
  }
  return result;
}
