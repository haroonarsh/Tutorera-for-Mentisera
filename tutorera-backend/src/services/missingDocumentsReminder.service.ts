// src/services/missingDocumentsReminder.service.ts
//
// Nudges a tutor whose onboarding is stalled because they have no
// education entries at all, or have gone through onboarding step 3
// without a single subject eligibility request on file (see
// services/subjectEligibility.service.ts). Mirrors
// legalAgreementReminder.service.ts's shape: throttled to at most once
// per ~20h per tutor, safe to call repeatedly from a daily timer, and
// self-stops once the tutor actually submits what's missing (the query
// below simply stops matching them).

import TutorProfile, { ITutorProfile } from "../models/TutorProfile.model";
import User from "../models/User.model";
import sendEmail from "../utils/sendEmail";
import { missingDocumentsReminderEmail } from "../utils/trackingEmails";
import { generateTrackingToken } from "./tracking.service";
import { sendNotification } from "../utils/socket";
import logger from "../config/logger";

const REMINDER_THROTTLE_MS = 20 * 60 * 60 * 1000; // ~20h - same reasoning as the agreement reminder cron.
const RESPONSE_WINDOW_DAYS = 14;

// Only already-registered tutors who are stuck part-way through onboarding
// (not yet active, not already rejected/terminated) are nudged - someone
// who hasn't started at all has no profile row to match, and a fully
// rejected/terminated account shouldn't get a "please submit" email.
const STALLED_STATUSES = [
  "registered",
  "profile_incomplete",
  "profile_complete",
  "documents_pending",
  "under_verification",
  "admin_review",
  "changes_requested",
] as const;

export interface MissingDocumentsReminderRunResult {
  tutorsDue: number;
  emailsSent: number;
  failures: number;
}

function describeMissingItems(profile: ITutorProfile): string[] {
  const items: string[] = [];
  if (!profile.education || profile.education.length === 0 || !profile.education[0]?.degree) {
    items.push("Your degree/qualification details and a certificate or transcript");
  }
  if (!profile.subjectEligibility || profile.subjectEligibility.length === 0) {
    items.push("At least one subject you'd like to be approved to teach");
  }
  if (profile.cnicVerificationStatus === "not_submitted") {
    items.push("A government-issued identity document (CNIC/ID)");
  }
  if (profile.demoVideoStatus === "not_submitted") {
    items.push("A short demo/introduction video");
  }
  return items;
}

/**
 * Finds already-registered tutors stalled on missing education/documents
 * and emails them a reminder, throttled to at most once per ~20h per
 * tutor. Call this from a daily timer (see server.ts), the same way
 * sendAgreementReminders() is - no separate "stop" needed, since a tutor
 * who submits what's missing simply stops matching the query below.
 */
export async function sendMissingDocumentsReminders(io?: unknown): Promise<MissingDocumentsReminderRunResult> {
  const result: MissingDocumentsReminderRunResult = { tutorsDue: 0, emailsSent: 0, failures: 0 };

  const dueProfiles = await TutorProfile.find({
    tutorStatus: { $in: STALLED_STATUSES },
    $or: [
      { education: { $size: 0 } },
      // NOT a positional dot-path ("education.0.degree": null) - that form
      // spuriously matches documents whose degree is already set (verified
      // against a real MongoDB instance, not a driver quirk). $elemMatch is
      // the form that actually only matches an empty/missing degree.
      { education: { $elemMatch: { degree: { $in: [null, ""] } } } },
      { subjectEligibility: { $size: 0 } },
    ],
    $and: [
      {
        $or: [
          { missingDocsReminderLastSentAt: { $exists: false } },
          { missingDocsReminderLastSentAt: { $lt: new Date(Date.now() - REMINDER_THROTTLE_MS) } },
        ],
      },
    ],
  });
  result.tutorsDue = dueProfiles.length;

  for (const profile of dueProfiles) {
    try {
      await remindOneTutor(profile, io);
      result.emailsSent += 1;
    } catch (err) {
      result.failures += 1;
      logger.error({ err, tutorProfileId: profile._id.toString() }, "[MissingDocumentsReminder] Failed to send reminder");
    }
  }

  return result;
}

async function remindOneTutor(profile: ITutorProfile, io: unknown): Promise<void> {
  const tutorUser = await User.findById(profile.user);
  if (!tutorUser) return;

  const missingItems = describeMissingItems(profile);
  if (missingItems.length === 0) return; // Nothing actually missing - query matched on a stale condition.

  // Trackable link must be passwordless (a stalled applicant may not be
  // signed in) - issue a fresh token rather than reusing a stored one,
  // since only the hash is persisted (see tracking.service.ts).
  const { plaintext, hash } = generateTrackingToken();
  tutorUser.trackingTokenHash = hash;
  tutorUser.trackingTokenCreatedAt = new Date();
  await tutorUser.save();

  const reminderCount = (profile.missingDocsReminderCount || 0) + 1;
  const responseDeadline = new Date(Date.now() + RESPONSE_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const { subject, html } = missingDocumentsReminderEmail(tutorUser.name, {
    applicationId: tutorUser.applicationId || "TUT-PENDING",
    statusUrl: `${process.env.CLIENT_URL || "https://tutorera.ac.pk"}/track/tutor/${plaintext}`,
    missingItems,
    responseDeadline,
    reminderCount,
  });
  await sendEmail({ to: tutorUser.email, subject, html });

  await sendNotification(io as never, tutorUser._id.toString(), {
    title: "Complete your tutor application",
    message: "A few required items are still missing from your TUTORERA application.",
    type: "verification",
    link: "/tutor/application-status",
  }).catch((err) => logger.error({ err }, "[MissingDocumentsReminder] In-app notification failed"));

  profile.missingDocsReminderLastSentAt = new Date();
  profile.missingDocsReminderCount = reminderCount;
  await profile.save({ validateBeforeSave: false });
}
