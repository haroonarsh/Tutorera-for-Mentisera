import type { TutorProfile } from "@/types/tutor";

export interface TutorSeoAssessment {
  indexable: boolean;
  score: number;
  reasons: string[];
}

const normalize = (value?: string) => value?.trim() ?? "";

// Names a bot could present as a real marketplace tutor if the backend
// leaked an unarchived test account. We'd rather force a false negative
// (an edge-case real tutor whose name genuinely looks test-shaped) than
// let "Testing User" or "Demo Tutor" rank as live inventory again.
const TEST_NAME_PATTERN = /\b(testing|test|demo|sample|dummy|example|qa|placeholder|lorem|ipsum|john\s+doe|jane\s+doe)\b/i;

export function assessTutorSeoQuality(tutor: TutorProfile): TutorSeoAssessment {
  const reasons: string[] = [];
  let score = 0;

  const name = normalize(tutor.user?.name || tutor.fullName);
  const city = normalize(tutor.city || tutor.user?.city);
  const bio = normalize(tutor.bio);
  const verificationStatus = normalize(tutor.verificationStatus).toLowerCase();

  const hasName = name.length >= 3;
  const hasSubject = Array.isArray(tutor.subjects) && tutor.subjects.some((subject) => normalize(subject).length > 1);
  const hasLevel = Array.isArray(tutor.levels) && tutor.levels.some((level) => normalize(level).length > 1);
  const hasCity = city.length >= 2;
  const hasUsefulBio = bio.length >= 120;
  const hasRate = Number.isFinite(tutor.hourlyRate) && tutor.hourlyRate > 0;
  const hasEducation = Array.isArray(tutor.education) && tutor.education.some((education) => normalize(education.degree).length > 1 && normalize(education.institution).length > 1);
  const hasVisualTrustSignal = Boolean(tutor.user?.avatar || tutor.videoIntro);
  const hasApprovedStatus = verificationStatus === "approved" || verificationStatus === "verified";
  const isVerified = tutor.isVerified === true;

  if (hasName) score += 10; else reasons.push("missing tutor name");
  if (hasSubject) score += 15; else reasons.push("missing subjects");
  if (hasLevel) score += 10; else reasons.push("missing teaching levels");
  if (hasCity) score += 10; else reasons.push("missing city");
  if (hasUsefulBio) score += 20; else reasons.push("bio shorter than 120 characters");
  if (hasRate) score += 10; else reasons.push("missing valid hourly rate");
  if (hasEducation) score += 10; else reasons.push("missing structured education");
  if (hasVisualTrustSignal) score += 5; else reasons.push("missing profile image or intro video");
  if (hasApprovedStatus) score += 5; else reasons.push("profile approval status is not confirmed");
  if (isVerified) score += 5; else reasons.push("profile does not have a verification badge");

  const hasCoreContent = hasName && hasSubject && hasLevel && hasCity && hasUsefulBio && hasRate;

  // Hard reject on test-pattern names regardless of all other signals.
  // Oct 2026 incident: a "Testing User" account surfaced in Google via
  // related-tutor references on real level/subject pages even after the
  // profile detail URL returned 404. Score-based gating alone can't
  // catch it if the backend returns the record with isVerified: true.
  const looksLikeTestAccount = TEST_NAME_PATTERN.test(name);
  if (looksLikeTestAccount) reasons.push("name matches a test-account pattern");

  // Marketplace visibility and search visibility are intentionally separate. Profiles may remain
  // usable on TUTORERA, while search engines are asked not to index them until they contain enough
  // factual content and both approval and verification trust signals are explicitly present.
  const indexable = hasCoreContent && hasApprovedStatus && isVerified && score >= 75 && !looksLikeTestAccount;

  return { indexable, score, reasons };
}
