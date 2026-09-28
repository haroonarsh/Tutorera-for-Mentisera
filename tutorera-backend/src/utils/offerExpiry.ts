import Bid from "../models/Bid.model";
import Request from "../models/Request.model";
import User from "../models/User.model";
import { sendNotification } from "./socket";
import { logAudit } from "./logAudit";
import sendEmail from "./sendEmail";
import { offerExpiredEmail, offerExpiringEmail } from "./emailTemplates";
import logger from "../config/logger";

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
    const [tutor, requester] = await Promise.all([
      User.findById(offer.tutor).select("name email").lean(),
      User.findById(request.student).select("name email").lean(),
    ]);
    const deliveries = [
      tutor?.email && { user: tutor, isTutor: true },
      requester?.email && { user: requester, isTutor: false },
    ].filter(Boolean) as Array<{ user: { _id: unknown; name?: string; email: string }; isTutor: boolean }>;
    const emailResults = await Promise.allSettled(deliveries.map(async ({ user, isTutor }) => {
      const mail = offerExpiringEmail(user.name || "there", request.subject, isTutor);
      await sendEmail({ to: user.email, subject: mail.subject, html: mail.html, userId: String(user._id), eventType: "offer.expiring", relatedEntityType: "Bid", relatedEntityId: offer._id.toString() });
    }));
    for (const result of emailResults) {
      if (result.status === "rejected") logger.error({ err: result.reason, offerId: offer._id }, "Failed to deliver offer-expiry email");
    }
    offer.expiryReminderSentAt = now; await offer.save();
  }
  const expired = await Bid.find({ status: { $in: ACTIVE }, expiresAt: { $lte: now } }).limit(500);
  for (const offer of expired) {
    offer.status = "expired"; await offer.save();
    const request = await Request.findById(offer.request).select("student subject").lean();
    if (request) {
      await Promise.all([
        sendNotification(io, offer.tutor.toString(), { title: "Offer Expired", message: `Your ${request.subject} offer is no longer active.`, type: "bid", link: "/offers" }),
        sendNotification(io, request.student.toString(), { title: "Tutor Offer Expired", message: `A tutor offer on your ${request.subject} requirement is no longer active.`, type: "bid", link: "/offers" }),
      ]);
      const [tutor, requester] = await Promise.all([
        User.findById(offer.tutor).select("name email").lean(),
        User.findById(request.student).select("name email").lean(),
      ]);
      const deliveries = [
        tutor?.email && { user: tutor, isTutor: true },
        requester?.email && { user: requester, isTutor: false },
      ].filter(Boolean) as Array<{ user: { _id: unknown; name?: string; email: string }; isTutor: boolean }>;
      const emailResults = await Promise.allSettled(deliveries.map(async ({ user, isTutor }) => {
        const mail = offerExpiredEmail(user.name || "there", request.subject, isTutor);
        await sendEmail({ to: user.email, subject: mail.subject, html: mail.html, userId: String(user._id), eventType: "offer.expired", relatedEntityType: "Bid", relatedEntityId: offer._id.toString() });
      }));
      for (const result of emailResults) {
        if (result.status === "rejected") logger.error({ err: result.reason, offerId: offer._id }, "Failed to deliver offer-expired email");
      }
    }
    await logAudit({ action: "offer_expired", actor: "system", entity: "Bid", targetId: offer._id.toString() });
  }
  return { reminded: expiring.length, expired: expired.length };
}
