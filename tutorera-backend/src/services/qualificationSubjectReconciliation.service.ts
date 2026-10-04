import type { ITutorProfile } from "../models/TutorProfile.model";
import { hasCurrentQualificationReview, qualificationFingerprint } from "./qualificationReview.service";
import { syncApprovedSubjects } from "./subjectEligibility.service";

/** Bind existing indexed approvals to unchanged credentials during reorder.
 * Never transfer an approval to the new occupant of an old array position. */
export function reconcileQualificationSubjects(profile: ITutorProfile, incoming: ITutorProfile["education"]): string[] {
  const reset: string[] = [];
  for (const entry of profile.subjectEligibility || []) {
    if (!Number.isInteger(entry.qualificationIndex)) continue; // Legacy reconciliation is explicit, not inferred.
    const original = profile.education[entry.qualificationIndex!];
    const fingerprint = original && qualificationFingerprint(original);
    const nextIndex = fingerprint ? incoming.findIndex(row => qualificationFingerprint(row) === fingerprint) : -1;
    if (nextIndex >= 0) entry.qualificationIndex = nextIndex;
    else entry.qualificationIndex = undefined;
    if (entry.status === "approved" && (nextIndex < 0 || !hasCurrentQualificationReview(incoming[nextIndex]))) {
      entry.status = "pending";
      entry.levels = [];
      entry.reason = "The supporting qualification changed or was removed. A fresh qualification and subject review is required.";
      entry.reviewedAt = undefined;
      entry.reviewedBy = undefined;
      reset.push(entry.subject);
    }
  }
  syncApprovedSubjects(profile);
  return reset;
}
