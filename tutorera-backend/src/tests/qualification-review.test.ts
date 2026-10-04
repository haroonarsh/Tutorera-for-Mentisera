import { Types } from "mongoose";
import type { ITutorProfile } from "../models/TutorProfile.model";
import { hasCurrentQualificationReview, meetsMinimumDegreeLevel, preserveQualificationReviews, reviewQualification, replacePrimaryQualification } from "../services/qualificationReview.service";
import { tutorProfileSchema } from "../validators/tutor.validator";

function fixture() {
  return { education: [{ degree: "BSc", institution: "University", year: 2020, discipline: "Science", degreeDoc: "degree-url", degreeDocPublicId: "degree-id" }] } as ITutorProfile;
}
describe("qualification review", () => {
  const actor = new Types.ObjectId().toString();
  it("preserves additional qualifications and their reviews when the primary document is replaced", () => {
    const profile = fixture();
    profile.education.push({ ...profile.education[0], degree: "MSc", degreeDoc: "masters-document" });
    reviewQualification(profile, 0, "approved", actor, "Verified", "bachelors");
    reviewQualification(profile, 1, "approved", actor, "Verified", "masters");
    const result = replacePrimaryQualification(profile.education, { ...profile.education[0], degreeDoc: "replacement" });
    expect(result).toHaveLength(2);
    expect(result[0].verificationStatus).toBe("pending");
    expect(result[0].reviewFingerprint).toBeUndefined();
    expect(hasCurrentQualificationReview(result[1])).toBe(true);
  });
  it("records a review and satisfies only supported minimum ranks", () => {
    const profile = fixture();
    expect(reviewQualification(profile, 0, "approved", actor, "Checked", "Bachelor's").success).toBe(true);
    expect(hasCurrentQualificationReview(profile.education[0])).toBe(true);
    expect(meetsMinimumDegreeLevel(profile.education[0], "Bachelors")).toBe(true);
    expect(meetsMinimumDegreeLevel(profile.education[0], "Masters")).toBe(false);
    expect(meetsMinimumDegreeLevel(profile.education[0], "Unrecognized Degree")).toBe(false);
  });
  it("invalidates the review when credential metadata changes", () => {
    const profile = fixture();
    reviewQualification(profile, 0, "approved", actor, "Checked", "masters");
    profile.education[0].institution = "Different institution";
    expect(hasCurrentQualificationReview(profile.education[0])).toBe(false);
    expect(meetsMinimumDegreeLevel(profile.education[0], "Bachelors")).toBe(false);
  });
  it("rejects invalid indexes and unknown degree levels without granting verification", () => {
    const profile = fixture();
    expect(reviewQualification(profile, -1, "approved", actor, "", "masters").success).toBe(false);
    expect(reviewQualification(profile, 0, "approved", actor, "", "unknown").success).toBe(false);
    expect(hasCurrentQualificationReview(profile.education[0])).toBe(false);
  });
  it("clears verified degree rank when a credential is rejected", () => {
    const profile = fixture();
    reviewQualification(profile, 0, "approved", actor, "Checked", "masters");
    expect(reviewQualification(profile, 0, "rejected", actor, "Unreadable document").success).toBe(true);
    expect(profile.education[0].verifiedDegreeLevel).toBeUndefined();
    expect(hasCurrentQualificationReview(profile.education[0])).toBe(false);
  });
  it("does not accept admin review fields from tutor profile input", () => {
    const profile = fixture();
    reviewQualification(profile, 0, "approved", actor, "Checked", "masters");
    const parsed = tutorProfileSchema.parse({ education: profile.education });
    expect(parsed.education![0]).not.toHaveProperty("verificationStatus");
    expect(parsed.education![0]).not.toHaveProperty("verifiedDegreeLevel");
    expect(parsed.education![0]).not.toHaveProperty("reviewFingerprint");
  });
  it("preserves server reviews on unchanged profile saves but resets changed credentials", () => {
    const profile = fixture();
    reviewQualification(profile, 0, "approved", actor, "Checked", "masters");
    const unchanged = preserveQualificationReviews(profile.education, [{ ...fixture().education[0] }]);
    expect(hasCurrentQualificationReview(unchanged[0])).toBe(true);
    const changed = preserveQualificationReviews(profile.education, [{ ...profile.education[0], degree: "Different degree" }]);
    expect(changed[0].verificationStatus).toBe("pending");
    expect(changed[0].reviewedBy).toBeUndefined();
    expect(changed[0].verifiedDegreeLevel).toBeUndefined();
  });
});
