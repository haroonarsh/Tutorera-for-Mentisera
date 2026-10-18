import Booking from "../models/Booking.model";
import PaymentLedger from "../models/PaymentLedger.model";
import RefundRequest from "../models/RefundRequest.model";
import logger from "../config/logger";

export interface PayoutRunResult {
  scanned: number;
  processed: number;
  failed: number;
  errors: string[];
  awaitingApproval: number;
  awaitingIndependentVerification: number;
  approvedRefundsAwaitingSettlement: number;
  paymentExceptionsAwaitingReconciliation: number;
}

// Queue monitoring ONLY. Real bank/wallet transfers are initiated externally,
// then independently attested by finance. In the absence of a provider payout
// API, this worker must never auto-transition a booking to 'paid'.
export async function processPendingPayouts(): Promise<PayoutRunResult> {
  const result: PayoutRunResult = {
    scanned: 0, processed: 0, failed: 0, errors: [],
    awaitingApproval: 0, awaitingIndependentVerification: 0,
    approvedRefundsAwaitingSettlement: 0, paymentExceptionsAwaitingReconciliation: 0,
  };
  try {
    const [pending, processing, refunds, exceptions] = await Promise.all([
      Booking.countDocuments({ status: "completed", paymentStatus: "confirmed", payoutStatus: "pending", payoutRequestedAt: { $exists: true } }),
      Booking.countDocuments({ status: "completed", paymentStatus: "confirmed", payoutStatus: "processing" }),
      RefundRequest.countDocuments({ status: "approved" }),
      PaymentLedger.countDocuments({ settlementStatus: "exception" }),
    ]);
    result.awaitingApproval = pending;
    result.awaitingIndependentVerification = processing;
    result.approvedRefundsAwaitingSettlement = refunds;
    result.paymentExceptionsAwaitingReconciliation = exceptions;
    result.scanned = pending + processing + refunds + exceptions;
    if (result.scanned > 0) logger.warn({ ...result }, "Finance action queue has unresolved transfers or reconciliation exceptions");
  } catch (err: any) {
    result.failed++;
    result.errors.push(`Finance queue scan failed: ${err?.message || "unknown error"}`);
    logger.error({ err }, "Finance queue scan failed");
  }
  return result;
}
