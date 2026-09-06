import Booking from "../models/Booking.model";
import User from "../models/User.model";
import sendEmail from "../utils/sendEmail";
import { payoutProcessedEmail, payoutFailedEmail } from "../utils/emailTemplates";
import { sendNotification } from "../utils/socket";
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
      .populate("student", "name")
      .populate("tutor", "name email")
      .limit(AUTO_PAYOUT_MAX_BATCH)
      .lean();

    result.scanned = pendingBookings.length;

    for (const booking of pendingBookings) {
      try {
        const tutor = booking.tutor as unknown as { name?: string; email?: string } | null;
        if (!tutor?.email) continue;

        const amount = booking.tutorPayout || 0;
        const updated = await Booking.findByIdAndUpdate(
          booking._id,
          { payoutStatus: "paid", payoutNote: "Auto-processed by scheduled payout job" },
          { new: true }
        );

        if (!updated) continue;

        result.processed++;

        try {
          const mail = payoutProcessedEmail(tutor.name || "Tutor", amount, updated._id.toString());
          await sendEmail({ to: tutor.email, subject: mail.subject, html: mail.html, eventType: "payout.completed", relatedEntityType: "Booking", relatedEntityId: updated._id.toString() });
        } catch (err) {
          logger.error({ err, bookingId: booking._id }, "Failed to send payout processed email");
        }
      } catch (err: any) {
        result.failed++;
        result.errors.push(`Booking ${booking._id}: ${err?.message || "unknown error"}`);
        logger.error({ err, bookingId: booking._id }, "Failed to process pending payout");
      }
    }
  } catch (err: any) {
    result.errors.push(`Scan error: ${err?.message || "unknown error"}`);
    logger.error({ err }, "Failed to scan pending payouts");
  }

  return result;
}
