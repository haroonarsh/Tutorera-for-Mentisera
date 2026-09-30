// src/services/legalAgreementReminder.service.ts
//
// Already-activated tutors whose account needs the current Tutor Agreement
// (re)signed - e.g. after publishAdminAgreement() flags them because a new
// version was published with requiresReacceptance - are reminded by email
// once immediately (at publish time) and then at most once daily until they
// actually sign. The cron never "expires"; it simply stops finding a given
// tutor once their agreementVersion/agreementAcceptedAt is updated by
// acceptTutorAgreement(), so there's nothing to separately cancel.

import TutorProfile, { ITutorProfile } from "../models/TutorProfile.model";
import User from "../models/User.model";
import LegalAgreement from "../models/LegalAgreement.model";
import sendEmail from "../utils/sendEmail";
import { agreementReminderEmail } from "../utils/trackingEmails";
import { sendNotification } from "../utils/socket";
import logger from "../config/logger";

const REMINDER_THROTTLE_MS = 20 * 60 * 60 * 1000; // ~20h - safely under a day even if the daily timer drifts, but never sends twice within the same day.

// "Already activated" per the request this implements - tutors who were
// actually live on the marketplace (or already went through the
// reacceptance flow once), not brand-new approvals who get the separate
// one-time tutorMarketplaceAgreementEmail on first approval instead.
const ALREADY_ACTIVATED_STATUSES = ["active", "agreement_reacceptance_required"] as const;

export interface AgreementReminderRunResult {
  countriesChecked: number;
  tutorsDue: number;
  emailsSent: number;
  failures: number;
}

/**
 * Finds already-activated tutors who still haven't accepted the current
 * published Tutor Agreement for their market and emails them a reminder,
 * throttled to at most once per ~20h per tutor. Call this:
 *  - immediately after publishing an agreement with requiresReacceptance
 *    (see publishAdminAgreement), so affected tutors hear about it right away
 *  - from a daily timer (see server.ts) so it keeps nudging anyone who
 *    still hasn't signed, with no separate "stop" needed - once a tutor
 *    accepts, the query below simply no longer matches them.
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
    const dueProfiles = await TutorProfile.find({
      countryCode: agreement.country === "GLOBAL" ? { $exists: true } : agreement.country,
      tutorStatus: { $in: ALREADY_ACTIVATED_STATUSES },
      agreementAcceptanceRequired: true,
      agreementVersion: { $ne: agreement.version },
      $or: [
        { agreementReminderLastSentAt: { $exists: false } },
        { agreementReminderLastSentAt: { $lt: new Date(Date.now() - REMINDER_THROTTLE_MS) } },
      ],
    });
    result.tutorsDue += dueProfiles.length;

    for (const profile of dueProfiles) {
      try {
        await remindOneTutor(profile, agreement.version, agreement.complianceDeadline, io);
        result.emailsSent += 1;
      } catch (err) {
        result.failures += 1;
        logger.error({ err, tutorProfileId: profile._id.toString() }, "[LegalAgreementReminder] Failed to send reminder");
      }
    }
  }

  return result;
}

async function remindOneTutor(
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
  }).catch((err) => logger.error({ err }, "[LegalAgreementReminder] In-app notification failed"));

  profile.agreementReminderLastSentAt = new Date();
  profile.agreementReminderCount = reminderCount;
  await profile.save({ validateBeforeSave: false });
}
