import AbandonedJourney from "../models/AbandonedJourney.model";
import Booking from "../models/Booking.model";
import EmailLog from "../models/EmailLog.model";
import TutorProfile from "../models/TutorProfile.model";
import User from "../models/User.model";
import { NotificationService } from "../services/notification.service";
import { logAudit } from "./logAudit";
import sendEmail from "./sendEmail";
import { tutorApplicationCompletionReminderEmail } from "./recoveryEmailTemplates";
import logger from "../config/logger";


const MILESTONES = [7, 3, 1] as const;
const DAY_MS = 24 * 60 * 60 * 1000;

function milestoneFor(ageMs: number, alreadySent: number[] = []) {
  return MILESTONES.find((day) => ageMs >= day * DAY_MS && !alreadySent.includes(day));
}

function daysFromEvents(rows: Array<{ eventType: string }>) {
  return rows
    .map((row) => {
      const eventType = String(row.eventType);
      const dayMatch = eventType.match(/_(1|3|7)d$/);
      if (dayMatch) return Number(dayMatch[1]);
      const hourMatch = eventType.match(/_(24|72|168)h$/);
      return hourMatch ? Number(hourMatch[1]) / 24 : NaN;
    })
    .filter(Number.isFinite);
}

async function alreadyLogged(eventType: string, relatedEntityType: string, relatedEntityId: string) {
  return EmailLog.exists({ eventType, relatedEntityType, relatedEntityId });
}

function tutorMissingItems(profile: any): Array<{ label: string; href: string }> {
  const missing: Array<{ label: string; href: string }> = [];
  const needsTutorAction = (status: string | undefined) => !status || status === "not_submitted" || status === "rejected";
  if (!profile.fullName || !profile.phone || !profile.city) missing.push({ label: "Personal details and location", href: "/onboarding/tutor?step=1" });
  if (!profile.education?.[0]?.degree || !profile.education?.[0]?.institution || !profile.education?.[0]?.degreeDoc || needsTutorAction(profile.degreeVerificationStatus)) missing.push({ label: "Qualification and educational document", href: "/onboarding/tutor?step=2" });
  if (!profile.experience || !profile.subjects?.length || !profile.levels?.length) missing.push({ label: "Teaching experience, subjects, and levels", href: "/onboarding/tutor?step=3" });
  if (!profile.bio || !profile.hourlyRate || !profile.availability?.length) missing.push({ label: "Profile, hourly rate, and availability", href: "/onboarding/tutor?step=4" });
  if (!profile.cnicFront || !profile.cnicBack || needsTutorAction(profile.cnicVerificationStatus)) missing.push({ label: "Identity document (front and back)", href: "/onboarding/tutor?step=5" });
  if (!profile.videoIntro || needsTutorAction(profile.demoVideoStatus)) missing.push({ label: "Demo video", href: "/onboarding/tutor?step=5" });
  if ((profile.teachingMode === "in-person" || profile.teachingMode === "both") && (!profile.policeCertificate || needsTutorAction(profile.policeVerificationStatus))) missing.push({ label: "Background and safety document for Home Tuition", href: "/onboarding/tutor?step=5" });
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
  }).select("user onboardingStep updatedAt fullName phone city education experience subjects levels bio hourlyRate availability teachingMode cnicFront cnicBack cnicVerificationStatus degreeVerificationStatus videoIntro demoVideoStatus policeCertificate policeVerificationStatus").limit(200);

  for (const profile of incompleteProfiles) {
    try {
      const user = await User.findOne({ _id: profile.user, role: "tutor", isActive: true }).select("name email");
      if (!user?.email) continue;

      const missingItems = tutorMissingItems(profile);
      // Pending documents are under review, not missing. Reminders stop until
      // the tutor has a concrete item to provide or correct.
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
    } catch (err) {
      // A single provider or data error must not suppress reminders for other tutors.
      logger.error({ err, tutorProfileId: profile._id }, "Tutor application completion reminder failed");
    }
  }

  const abandonedRequests = await AbandonedJourney.find({
    type: { $in: ["student_request", "direct_booking"] },
    completedAt: { $exists: false },
    updatedAt: { $lte: new Date(now.getTime() - DAY_MS) },
  }).limit(200);

  for (const journey of abandonedRequests) {
    try {
      // Parents can post requirements and start direct bookings on behalf of a
      // learner, so they must use the same recovery flow as students.
      const user = await User.findOne({ _id: journey.user, role: { $in: ["student", "parent"] }, isActive: true }).select("name email");
      if (!user?.email) continue;

      const day = milestoneFor(now.getTime() - journey.updatedAt.getTime(), journey.remindersSent || []);
      if (!day) continue;

      const isDirectBooking = journey.type === "direct_booking";
      const data = journey.data || {};
      const hours = day * 24;
      const eventName = isDirectBooking
        ? `booking.direct_booking_abandoned_${hours}h`
        : `request.abandoned_${hours}h`;
      const auditAction = `${isDirectBooking ? "student_direct_booking" : "student_request"}_abandoned_${day}d`;
      if (await alreadyLogged(eventName, "AbandonedJourney", journey._id.toString())) continue;

      await NotificationService.publishEvent(user._id.toString(), eventName, {
        day,
        subjectName: typeof data.subject === "string" ? data.subject : undefined,
        tutorName: typeof data.tutorName === "string" ? data.tutorName : undefined,
        isDirectBooking,
        title: isDirectBooking ? "Continue Your Tutor Booking" : "Finish Your Tuition Request",
        message: isDirectBooking
          ? "Your selected tutor booking is saved. Complete the remaining details when ready."
          : "Your tuition request draft is saved. Complete it to start receiving tutor offers.",
        link: "/post-tuition-request",
        relatedEntityType: "AbandonedJourney",
        relatedEntityId: journey._id.toString(),
      });
      journey.remindersSent = Array.from(new Set([...(journey.remindersSent || []), day])).sort((a, b) => a - b);
      journey.lastReminderSentAt = now;
      await journey.save();
      await logAudit({ action: auditAction, actor: "system", entity: "AbandonedJourney", targetId: journey._id.toString() });
      studentRequestReminders++;
    } catch (err) {
      logger.error({ err, journeyId: journey._id }, "Abandoned request recovery failed");
    }
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
      eventType: /^(payment_abandoned_|booking\.payment_abandoned_)/,
    }).select("eventType").lean();
    const sentDays = daysFromEvents(prior);
    const day = milestoneFor(now.getTime() - booking.createdAt.getTime(), sentDays);
    if (!day) continue;

    const student = booking.student as any;
    if (!student?.email) continue;

    const tutor = booking.tutor as any;
    const hours = day * 24;
    const eventName = `booking.payment_abandoned_${hours}h`;
    const auditAction = `payment_abandoned_${day}d`;
    if (await alreadyLogged(eventName, "Booking", booking._id.toString())) continue;

    await NotificationService.publishEvent(student._id?.toString(), eventName, {
      day,
      tutorName: tutor?.name,
      amount: booking.studentTotal || booking.amount,
      subject: "Complete your payment",
      html: "Your booking is waiting for payment.",
      relatedEntityType: "Booking",
      relatedEntityId: booking._id.toString(),
    });
    await logAudit({ action: auditAction, actor: "system", entity: "Booking", targetId: booking._id.toString() });
    paymentReminders++;
  }

  return { tutorApplicationReminders, studentRequestReminders, paymentReminders };
}
