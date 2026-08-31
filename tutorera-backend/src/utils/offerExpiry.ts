import Bid from "../models/Bid.model";
import Request from "../models/Request.model";
import { sendNotification } from "./socket";
import { logAudit } from "./logAudit";

const ACTIVE: Array<"pending" | "submitted" | "viewed" | "countered"> = ["pending", "submitted", "viewed", "countered"];

export async function processOfferExpirations(io: any) {
  const now = new Date();
  const reminderBoundary = new Date(now.getTime() + 60 * 60 * 1000);
  const expiring = await Bid.find({ status: { $in: ACTIVE }, expiresAt: { $gt: now, $lte: reminderBoundary }, expiryReminderSentAt: { $exists: false } }).limit(200);
  for (const offer of expiring) {
    const request = await Request.findById(offer.request).select("student subject").lean();
    if (!request) continue;
    await Promise.all([
      sendNotification(io, offer.tutor.toString(), { title: "Offer Expiring Soon", message: `Your ${request.subject} offer expires in under one hour.`, type: "bid", link: "/offers" }),
      sendNotification(io, request.student.toString(), { title: "Tutor Offer Expiring Soon", message: `A ${request.subject} tutor offer expires in under one hour.`, type: "bid", link: "/offers" }),
    ]);
    offer.expiryReminderSentAt = now; await offer.save();
  }
  const expired = await Bid.find({ status: { $in: ACTIVE }, expiresAt: { $lte: now } }).limit(500);
  for (const offer of expired) {
    offer.status = "expired"; await offer.save();
    await logAudit({ action: "offer_expired", actor: "system", entity: "Bid", targetId: offer._id.toString() });
  }
  return { reminded: expiring.length, expired: expired.length };
}
