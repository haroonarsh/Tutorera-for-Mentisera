import type { ITutorProfile } from "../models/TutorProfile.model";
import { preserveQualificationReviews } from "./qualificationReview.service";
import { reconcileQualificationSubjects } from "./qualificationSubjectReconciliation.service";

/** Uploading evidence is not an administrative qualification approval. */
export function degreeUploadIndex(profile: ITutorProfile, input: unknown, allowAppend = false): number | null {
  const index = input === undefined ? 0 : typeof input === "number" || typeof input === "string" && input.trim() ? Number(input) : NaN;
  // The onboarding wizard may append exactly one new qualification. Other
  // upload surfaces expose existing credentials only.
  return Number.isInteger(index) && index >= 0 && (index < profile.education.length || (allowAppend && index === profile.education.length)) ? index : null;
}

export function prepareDegreeReplacement(profile: ITutorProfile, url: string, publicId: string, index = 0, allowAppend = false) {
  if (degreeUploadIndex(profile, index, allowAppend) === null) throw new Error("Choose an existing qualification to replace.");
  const first = profile.education[index];
  const primary = first ? { degree: first.degree, institution: first.institution, year: first.year,
    discipline: first.discipline, disciplineRef: first.disciplineRef, degreeDoc: url, degreeDocPublicId: publicId }
    : { degree: "", institution: "", year: 0, degreeDoc: url, degreeDocPublicId: publicId };
  const incoming = [...profile.education];
  incoming[index] = primary;
  const education = preserveQualificationReviews(profile.education, incoming);
  reconcileQualificationSubjects(profile, education);
  return { education, subjectEligibility: profile.subjectEligibility, approvedSubjects: profile.approvedSubjects,
    degreeVerificationStatus: education.some(item => item.verificationStatus === "rejected") ? "rejected" as const : "pending" as const,
    degreeRejectionReason: education.filter(item => item.verificationStatus === "rejected").map(item => item.reviewReason).filter(Boolean).join("; ") };
}
