import AbandonedJourney from "../models/AbandonedJourney.model";
import Booking from "../models/Booking.model";
import EmailLog from "../models/EmailLog.model";
import TutorProfile from "../models/TutorProfile.model";
import User from "../models/User.model";
import { NotificationService } from "../services/notification.service";
import { logAudit } from "./logAudit";


const MILESTONES = [7, 3, 1] as const;
const DAY_MS = 24 * 60 * 60 * 1000;

function milestoneFor(ageMs: number, alreadySent: number[] = []) {
  return MILESTONES.find((day) => ageMs >= day * DAY_MS && !alreadySent.includes(day));
}

function daysFromEvents(rows: Array<{ eventType: string }>) {
  return rows
    .map((row) => Number(String(row.eventType).match(/_(1|3|7)d$/)?.[1]))
    .filter(Number.isFinite);
}

async function alreadyLogged(eventType: string, relatedEntityType: string, relatedEntityId: string) {
  return EmailLog.exists({ eventType, relatedEntityType, relatedEntityId });
}

export async function processAbandonedJourneyRecovery() {
  const now = new Date();
  let tutorApplicationReminders = 0;
  let studentRequestReminders = 0;
  let paymentReminders = 0;

  const incompleteProfiles = await TutorProfile.find({
    onboardingComplete: false,
    updatedAt: { $lte: new Date(now.getTime() - DAY_MS) },
  }).select("user onboardingStep remindersSent updatedAt").limit(200);

  for (const profile of incompleteProfiles) {
    const user = await User.findOne({ _id: profile.user, role: "tutor", isActive: true }).select("name email");
    if (!user?.email) continue;

    const prior = await EmailLog.find({
      relatedEntityType: "TutorProfile",
      relatedEntityId: profile._id.toString(),
      eventType: /^profile_abandoned_/,
    }).select("eventType").lean();
    const sentDays = daysFromEvents(prior);
    const day = milestoneFor(now.getTime() - profile.updatedAt.getTime(), sentDays);
    if (!day) continue;

    const eventType = `profile_abandoned_${day}d`;
    if (await alreadyLogged(eventType, "TutorProfile", profile._id.toString())) continue;

    const hours = day * 24;
    const eventName = `tutor.application_abandoned_${hours}h`;
    
    await NotificationService.publishEvent(user._id.toString(), eventName, {
      day,
      onboardingStep: profile.onboardingStep,
      subject: `Finish your tutor application`,
      html: `You left your application at step ${profile.onboardingStep}. Please finish it.` // This will be overriden by the template mapped in NotificationService
    });
    await logAudit({ action: eventType, actor: "system", entity: "TutorProfile", targetId: profile._id.toString() });
    tutorApplicationReminders++;
  }

  const abandonedRequests = await AbandonedJourney.find({
    type: { $in: ["student_request", "direct_booking"] },
    completedAt: { $exists: false },
    updatedAt: { $lte: new Date(now.getTime() - DAY_MS) },
  }).limit(200);

  for (const journey of abandonedRequests) {
    const user = await User.findOne({ _id: journey.user, role: "student", isActive: true }).select("name email");
    if (!user?.email) continue;

    const day = milestoneFor(now.getTime() - journey.updatedAt.getTime(), journey.remindersSent || []);
    if (!day) continue;

    const isDirectBooking = journey.type === "direct_booking";
    const eventType = `${isDirectBooking ? "student_direct_booking" : "student_request"}_abandoned_${day}d`;
    if (await alreadyLogged(eventType, "AbandonedJourney", journey._id.toString())) continue;

    const data = journey.data || {};
    const hours = day * 24;
    const eventName = `request.abandoned_${hours}h`;

    await NotificationService.publishEvent(user._id.toString(), eventName, {
      day,
      subjectName: typeof data.subject === "string" ? data.subject : undefined,
      isDirectBooking,
      subject: "Finish your tuition request draft",
      html: "Please finish your request." // Handled by NotificationService
    });
    journey.remindersSent = Array.from(new Set([...(journey.remindersSent || []), day])).sort((a, b) => a - b);
    journey.lastReminderSentAt = now;
    await journey.save();
    await logAudit({ action: eventType, actor: "system", entity: "AbandonedJourney", targetId: journey._id.toString() });
    studentRequestReminders++;
  }

  const pendingBookings = await Booking.find({
    paymentStatus: "pending",
    status: { $ne: "cancelled" },
    createdAt: { $lte: new Date(now.getTime() - DAY_MS) },
  }).populate("student", "name email").populate("tutor", "name").limit(200);

  for (const booking of pendingBookings) {
    const prior = await EmailLog.find({
      relatedEntityType: "Booking",
      relatedEntityId: booking._id.toString(),
      eventType: /^payment_abandoned_/,
    }).select("eventType").lean();
    const sentDays = daysFromEvents(prior);
    const day = milestoneFor(now.getTime() - booking.createdAt.getTime(), sentDays);
    if (!day) continue;

    const student = booking.student as any;
    if (!student?.email) continue;

    const eventType = `payment_abandoned_${day}d`;
    if (await alreadyLogged(eventType, "Booking", booking._id.toString())) continue;

    const tutor = booking.tutor as any;
    const hours = day * 24;
    const eventName = `booking.payment_abandoned_${hours}h`;

    await NotificationService.publishEvent(student._id?.toString(), eventName, {
      day,
      tutorName: tutor?.name,
      amount: booking.studentTotal || booking.amount,
      subject: "Complete your payment",
      html: "Your booking is waiting for payment."
    });
    await logAudit({ action: eventType, actor: "system", entity: "Booking", targetId: booking._id.toString() });
    paymentReminders++;
  }

  return { tutorApplicationReminders, studentRequestReminders, paymentReminders };
}
