import AbandonedJourney from "../models/AbandonedJourney.model";
import Booking from "../models/Booking.model";
import EmailLog from "../models/EmailLog.model";
import TutorProfile from "../models/TutorProfile.model";
import User from "../models/User.model";
import { NotificationService } from "../services/notification.service";
import { logAudit } from "./logAudit";
import sendEmail from "./sendEmail";
import { tutorApplicationCompletionReminderEmail } from "./recoveryEmailTemplates";


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

function tutorMissingItems(profile: any): Array<{ label: string; href: string }> {
  const missing: Array<{ label: string; href: string }> = [];
  if (!profile.fullName || !profile.phone || !profile.city) missing.push({ label: "Personal details and location", href: "/onboarding/tutor?step=1" });
  if (!profile.education?.[0]?.degree || !profile.education?.[0]?.institution || !profile.education?.[0]?.degreeDoc) missing.push({ label: "Qualification and educational document", href: "/onboarding/tutor?step=2" });
  if (!profile.experience || !profile.subjects?.length || !profile.levels?.length) missing.push({ label: "Teaching experience, subjects, and levels", href: "/onboarding/tutor?step=3" });
  if (!profile.bio || !profile.hourlyRate || !profile.availability?.length) missing.push({ label: "Profile, hourly rate, and availability", href: "/onboarding/tutor?step=4" });
  if (!profile.cnicFront || !profile.cnicBack || profile.cnicVerificationStatus !== "approved") missing.push({ label: "Identity document (front and back)", href: "/onboarding/tutor?step=5" });
  if (!profile.videoIntro || profile.demoVideoStatus !== "approved") missing.push({ label: "Demo video", href: "/onboarding/tutor?step=5" });
  if ((profile.teachingMode === "in-person" || profile.teachingMode === "both") && (!profile.policeCertificate || profile.policeVerificationStatus !== "approved")) missing.push({ label: "Background and safety document for Home Tuition", href: "/onboarding/tutor?step=5" });
  return missing;
}

export async function processAbandonedJourneyRecovery() {
  const now = new Date();
  let tutorApplicationReminders = 0;
  let studentRequestReminders = 0;
  let paymentReminders = 0;

  const incompleteProfiles = await TutorProfile.find({
    updatedAt: { $lte: new Date(now.getTime() - DAY_MS) },
    verificationStatus: { $ne: "approved" },
  }).select("user onboardingStep updatedAt fullName phone city education experience subjects levels bio hourlyRate availability teachingMode cnicFront cnicBack cnicVerificationStatus videoIntro demoVideoStatus policeCertificate policeVerificationStatus").limit(200);

  for (const profile of incompleteProfiles) {
    const user = await User.findOne({ _id: profile.user, role: "tutor", isActive: true }).select("name email");
    if (!user?.email) continue;

    const missingItems = tutorMissingItems(profile);
    if (!missingItems.length) continue;
    const lastDaily = await EmailLog.findOne({ relatedEntityType: "TutorProfile", relatedEntityId: profile._id.toString(), eventType: "tutor_application_completion_reminder_daily" }).sort({ createdAt: -1 }).select("createdAt").lean();
    if (lastDaily?.createdAt && now.getTime() - new Date(lastDaily.createdAt).getTime() < 20 * 60 * 60 * 1000) continue;
    const { subject, html } = tutorApplicationCompletionReminderEmail(user.name, missingItems);
    await sendEmail({
      to: user.email, subject, html, userId: user._id.toString(),
      eventType: "tutor_application_completion_reminder_daily",
      templateId: "tutor_application_completion_reminder",
      relatedEntityType: "TutorProfile", relatedEntityId: profile._id.toString(),
    });
    await logAudit({ action: "tutor_application_completion_reminder_daily", actor: "system", entity: "TutorProfile", targetId: profile._id.toString(), metadata: { missingItems: missingItems.map(item => item.label) } });
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
