import { Types } from "mongoose";
import type { ITutorProfile } from "../models/TutorProfile.model";
import { reviewQualification, hasCurrentQualificationReview } from "../services/qualificationReview.service";
import { prepareDegreeReplacement, degreeUploadIndex } from "../services/degreeReplacement.service";

describe("shared degree replacement", () => {
  it("targets a non-primary qualification and validates indexes", () => {
    const profile = { education: ["Physics", "Chemistry"].map(degree => ({ degree, institution: "University", year: 2020,
      degreeDoc: degree, degreeDocPublicId: degree })), subjectEligibility: [] } as unknown as ITutorProfile;
    expect(degreeUploadIndex(profile, "1")).toBe(1);
    for (const invalid of [-1, 3, 0.5, "", "garbage", null]) expect(degreeUploadIndex(profile, invalid)).toBeNull();
    expect(degreeUploadIndex(profile, 2)).toBeNull();
    expect(degreeUploadIndex(profile, 2, true)).toBe(2);
    const replacement = prepareDegreeReplacement(profile, "replacement", "new-id", 1);
    expect(replacement.education[0].degreeDoc).toBe("Physics");
    expect(replacement.education[1].degreeDoc).toBe("replacement");
  });
  it("resets the uploaded credential and its subject without discarding additional credentials", () => {
    const profile = { education: ["Physics", "Chemistry"].map(degree => ({ degree, institution: "University", year: 2020,
      degreeDoc: `${degree}-document`, degreeDocPublicId: degree })), subjectEligibility: [
      { subject: "Physics", status: "approved", levels: ["O-Level"], qualificationIndex: 0 },
    ] } as ITutorProfile;
    for (let index = 0; index < 2; index++) reviewQualification(profile, index, "approved", new Types.ObjectId().toString(), "Checked", "bachelors");
    const result = prepareDegreeReplacement(profile, "new-document", "new-id");
    expect(result.education).toHaveLength(2);
    expect(result.education[0].verificationStatus).toBe("pending");
    expect(result.education[0].reviewFingerprint).toBeUndefined();
    expect(hasCurrentQualificationReview(result.education[1])).toBe(true);
    expect(result.subjectEligibility![0].status).toBe("pending");
    expect(result.approvedSubjects).toEqual([]);
    expect(profile.education[0].degreeDoc).toBe("Physics-document");
  });

  it("retains rejection feedback on other qualifications", () => {
    const profile = { education: ["Physics", "Chemistry"].map(degree => ({ degree, institution: "University", year: 2020, degreeDoc: degree })), subjectEligibility: [] } as unknown as ITutorProfile;
    reviewQualification(profile, 1, "rejected", new Types.ObjectId().toString(), "Missing transcript");
    const result = prepareDegreeReplacement(profile, "replacement", "replacement-id");
    expect(result.degreeVerificationStatus).toBe("rejected");
    expect(result.degreeRejectionReason).toBe("Missing transcript");
  });
});
