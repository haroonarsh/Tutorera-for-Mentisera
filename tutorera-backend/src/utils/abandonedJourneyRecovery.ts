import AbandonedJourney from "../models/AbandonedJourney.model";
import Booking from "../models/Booking.model";
import EmailLog from "../models/EmailLog.model";
import TutorProfile from "../models/TutorProfile.model";
import User from "../models/User.model";
import sendEmail from "./sendEmail";
import { logAudit } from "./logAudit";
import {
  studentPaymentAbandonedEmail,
  studentRequestAbandonedEmail,
  tutorApplicationAbandonedEmail,
} from "./recoveryEmailTemplates";

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
      eventType: /^tutor\.application\.abandoned_reminder_/,
    }).select("eventType").lean();
    const sentDays = daysFromEvents(prior);
    const day = milestoneFor(now.getTime() - profile.updatedAt.getTime(), sentDays);
    if (!day) continue;

    const eventType = `tutor.application.abandoned_reminder_${day}d`;
    if (await alreadyLogged(eventType, "TutorProfile", profile._id.toString())) continue;

    const { subject, html } = tutorApplicationAbandonedEmail(user.name, day, profile.onboardingStep as number);
    await sendEmail({
      to: user.email,
      subject,
      html,
      userId: user._id.toString(),
      eventType,
      templateId: `tutor_application_abandoned_${day}d`,
      relatedEntityType: "TutorProfile",
      relatedEntityId: profile._id.toString(),
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
    const eventType = `${isDirectBooking ? "student.direct_booking" : "student.request"}.abandoned_reminder_${day}d`;
    if (await alreadyLogged(eventType, "AbandonedJourney", journey._id.toString())) continue;

    const data = journey.data || {};
    const { subject, html } = studentRequestAbandonedEmail(user.name, day, typeof data.subject === "string" ? data.subject : undefined);
    await sendEmail({
      to: user.email,
      subject,
      html,
      userId: user._id.toString(),
      eventType,
      templateId: `${isDirectBooking ? "student_direct_booking" : "student_request"}_abandoned_${day}d`,
      relatedEntityType: "AbandonedJourney",
      relatedEntityId: journey._id.toString(),
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
      eventType: /^booking\.payment\.abandoned_reminder_/,
    }).select("eventType").lean();
    const sentDays = daysFromEvents(prior);
    const day = milestoneFor(now.getTime() - booking.createdAt.getTime(), sentDays);
    if (!day) continue;

    const student = booking.student as any;
    if (!student?.email) continue;

    const eventType = `booking.payment.abandoned_reminder_${day}d`;
    if (await alreadyLogged(eventType, "Booking", booking._id.toString())) continue;

    const tutor = booking.tutor as any;
    const { subject, html } = studentPaymentAbandonedEmail(student.name || "Student", day, tutor?.name, booking.studentTotal || booking.amount);
    await sendEmail({
      to: student.email,
      subject,
      html,
      userId: student._id?.toString(),
      eventType,
      templateId: `booking_payment_abandoned_${day}d`,
      relatedEntityType: "Booking",
      relatedEntityId: booking._id.toString(),
    });
    await logAudit({ action: eventType, actor: "system", entity: "Booking", targetId: booking._id.toString() });
    paymentReminders++;
  }

  return { tutorApplicationReminders, studentRequestReminders, paymentReminders };
}
