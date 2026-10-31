// src/services/legalAgreementReminder.service.ts
//
// Two daily reminder flows, both driven by the same "agreement-reminder-delivery"
// cron (see scheduledJobs.ts / schedulerRuntime.service.ts):
//
//  1. REACCEPTANCE REMINDER — already-active tutors who need to re-sign after a
//     new agreement version is published (tutorStatus "active" or
//     "agreement_reacceptance_required").  Sends agreementReminderEmail.
//
//  2. PENDING-APPROVAL NUDGE — tutors whose admin approval is complete but who
//     have not yet signed the initial agreement (tutorStatus
//     "approved_pending_agreement"). They are currently invisible on the
//     marketplace. Sends pendingAgreementNudgeEmail daily until they sign.
//
// Both flows are throttled to at most once per ~20 h per tutor and stop
// automatically the moment the tutor signs (the query no longer matches them).

import TutorProfile, { ITutorProfile } from "../models/TutorProfile.model";
import User from "../models/User.model";
import LegalAgreement from "../models/LegalAgreement.model";
import sendEmail from "../utils/sendEmail";
import { agreementReminderEmail, pendingAgreementNudgeEmail } from "../utils/trackingEmails";
import { sendNotification } from "../utils/socket";
import logger from "../config/logger";

const REMINDER_THROTTLE_MS = 20 * 60 * 60 * 1000; // ~20 h — safely under a day even if the daily timer drifts.

const REACCEPTANCE_STATUSES = ["active", "agreement_reacceptance_required"] as const;
const PENDING_APPROVAL_STATUS = "approved_pending_agreement" as const;

export interface AgreementReminderRunResult {
  countriesChecked: number;
  tutorsDue: number;
  emailsSent: number;
  failures: number;
}

/**
 * Sends daily agreement-related email reminders for two groups:
 *  - Already-active tutors who need to re-sign a new agreement version.
 *  - Approved-but-not-yet-signed tutors (approved_pending_agreement) who are
 *    invisible on the marketplace until they sign.
 *
 * Safe to call repeatedly — throttle + self-expiring query mean no
 * duplicates and no manual cancellation needed.
 */
export async function sendAgreementReminders(io?: unknown): Promise<AgreementReminderRunResult> {
  const result: AgreementReminderRunResult = { countriesChecked: 0, tutorsDue: 0, emailsSent: 0, failures: 0 };

  const currentAgreements = await LegalAgreement.find({
    documentType: "TUTOR_AGREEMENT",
    status: "published",
    isCurrent: true,
  }).lean();
  result.countriesChecked = currentAgreements.length;

  for (const agreement of currentAgreements) {
    const countryFilter = agreement.country === "GLOBAL" ? { $exists: true } : agreement.country;
    const throttleCutoff = new Date(Date.now() - REMINDER_THROTTLE_MS);

    // ── Flow 1: reacceptance reminders for already-active tutors ────────────
    const reacceptanceDue = await TutorProfile.find({
      countryCode: countryFilter,
      tutorStatus: { $in: REACCEPTANCE_STATUSES },
      agreementAcceptanceRequired: true,
      agreementVersion: { $ne: agreement.version },
      $or: [
        { agreementReminderLastSentAt: { $exists: false } },
        { agreementReminderLastSentAt: { $lt: throttleCutoff } },
      ],
    });
    result.tutorsDue += reacceptanceDue.length;
    for (const profile of reacceptanceDue) {
      try {
        await remindReacceptance(profile, agreement.version, agreement.complianceDeadline, io);
        result.emailsSent++;
      } catch (err) {
        result.failures++;
        logger.error({ err, tutorProfileId: profile._id.toString() }, "[AgreementReminder] reacceptance email failed");
      }
    }

    // ── Flow 2: daily nudge for approved-but-unsigned tutors ────────────────
    const pendingDue = await TutorProfile.find({
      countryCode: countryFilter,
      tutorStatus: PENDING_APPROVAL_STATUS,
      agreementAcceptanceRequired: true,
      agreementAcceptedAt: { $exists: false },
      $or: [
        { agreementReminderLastSentAt: { $exists: false } },
        { agreementReminderLastSentAt: { $lt: throttleCutoff } },
      ],
    });
    result.tutorsDue += pendingDue.length;
    for (const profile of pendingDue) {
      try {
        await nudgePendingSigner(profile, agreement.version, io);
        result.emailsSent++;
      } catch (err) {
        result.failures++;
        logger.error({ err, tutorProfileId: profile._id.toString() }, "[AgreementReminder] pending-approval nudge failed");
      }
    }
  }

  return result;
}

// ── Flow 1 helper ───────────────────────────────────────────────────────────

async function remindReacceptance(
  profile: ITutorProfile,
  version: string,
  complianceDeadline: Date | undefined,
  io: unknown
): Promise<void> {
  const tutorUser = await User.findById(profile.user).select("name email applicationId");
  if (!tutorUser) return;

  const reminderCount = (profile.agreementReminderCount || 0) + 1;

  const { subject, html } = agreementReminderEmail(tutorUser.name, {
    applicationId: tutorUser.applicationId || "TUT-PENDING",
    statusUrl: `${process.env.CLIENT_URL || "https://tutorera.ac.pk"}/tutor/accept-agreement`,
    version,
    reminderCount,
    complianceDeadline,
  });
  await sendEmail({ to: tutorUser.email, subject, html });

  await sendNotification(io as never, tutorUser._id.toString(), {
    title: "Sign the updated Tutor Agreement",
    message: `Please review and accept Agreement Version ${version} to keep your marketplace access active.`,
    type: "general",
    link: "/tutor/accept-agreement",
  }).catch((err) => logger.error({ err }, "[AgreementReminder] in-app notification failed (reacceptance)"));

  profile.agreementReminderLastSentAt = new Date();
  profile.agreementReminderCount = reminderCount;
  await profile.save({ validateBeforeSave: false });
}

// ── Flow 2 helper ───────────────────────────────────────────────────────────

async function nudgePendingSigner(
  profile: ITutorProfile,
  version: string,
  io: unknown
): Promise<void> {
  const tutorUser = await User.findById(profile.user).select("name email applicationId");
  if (!tutorUser) return;

  const reminderCount = (profile.agreementReminderCount || 0) + 1;

  const { subject, html } = pendingAgreementNudgeEmail(tutorUser.name, {
    applicationId: tutorUser.applicationId || "TUT-PENDING",
    statusUrl: `${process.env.CLIENT_URL || "https://tutorera.ac.pk"}/tutor/accept-agreement`,
    hourlyRate: profile.hourlyRate,
    currency: profile.currency,
    version,
    reminderCount,
  });
  await sendEmail({ to: tutorUser.email, subject, html, eventType: "agreement_pending_nudge" });

  const notifMessage = reminderCount > 1
    ? `Reminder ${reminderCount}: your profile is approved but invisible on the marketplace until you sign the Tutor Agreement.`
    : "Your application is approved! Sign the Tutor Agreement to appear in student searches.";

  await sendNotification(io as never, tutorUser._id.toString(), {
    title: reminderCount > 1 ? "Sign your Tutor Agreement — you're still hidden" : "Sign your Tutor Agreement to go live",
    message: notifMessage,
    type: "general",
    link: "/tutor/accept-agreement",
  }).catch((err) => logger.error({ err }, "[AgreementReminder] in-app notification failed (pending signer)"));

  profile.agreementReminderLastSentAt = new Date();
  profile.agreementReminderCount = reminderCount;
  await profile.save({ validateBeforeSave: false });
}
