import Booking from "../models/Booking.model";
import logger from "../config/logger";

export interface PayoutRunResult {
  scanned: number;
  processed: number;
  failed: number;
  errors: string[];
}

const AUTO_PAYOUT_MINIMUM_AMOUNT = 500;
const AUTO_PAYOUT_MAX_BATCH = 50;

export async function processPendingPayouts(): Promise<PayoutRunResult> {
  const result: PayoutRunResult = { scanned: 0, processed: 0, failed: 0, errors: [] };

  try {
    const pendingBookings = await Booking.find({
      paymentStatus: "confirmed",
      payoutStatus: "pending",
      tutorPayout: { $gte: AUTO_PAYOUT_MINIMUM_AMOUNT },
    })
      .select("_id tutorPayout")
      .limit(AUTO_PAYOUT_MAX_BATCH)
      .lean();

    result.scanned = pendingBookings.length;
    if (pendingBookings.length > 0) {
      const message = "Automatic payout settlement is disabled because no verified payout-provider adapter is configured.";
      result.errors.push(message);
      logger.warn({ eligiblePayouts: pendingBookings.length }, message);
    }
  } catch (err: any) {
    result.errors.push(`Scan error: ${err?.message || "unknown error"}`);
    logger.error({ err }, "Failed to scan pending payouts");
  }

  return result;
}
