import { Types } from "mongoose";
import type { ITutorProfile } from "../models/TutorProfile.model";
import { preserveQualificationReviews, reviewQualification } from "../services/qualificationReview.service";
import { reconcileQualificationSubjects } from "../services/qualificationSubjectReconciliation.service";

function fixture() {
  const profile = { education: ["Physics", "Chemistry"].map(degree => ({ degree, institution: "University", year: 2020, degreeDoc: `${degree}-document` })),
    subjectEligibility: [{ subject: "Physics", qualificationIndex: 0, status: "approved", levels: ["O-Level"] }] } as ITutorProfile;
  for (let index = 0; index < 2; index++) reviewQualification(profile, index, "approved", new Types.ObjectId().toString(), "Verified", "bachelors");
  return profile;
}

describe("qualification-subject reconciliation", () => {
  it("preserves approval against the same credential after reordering", () => {
    const profile = fixture();
    const incoming = preserveQualificationReviews(profile.education, [...profile.education].reverse());
    expect(reconcileQualificationSubjects(profile, incoming)).toEqual([]);
    expect(profile.subjectEligibility![0].qualificationIndex).toBe(1);
    expect(profile.approvedSubjects).toEqual(["Physics"]);
  });
  it.each(["replacement", "removal"])("does not transfer approval after credential %s", change => {
    const profile = fixture();
    const incoming = preserveQualificationReviews(profile.education, change === "removal" ? [profile.education[1]]
      : [{ ...profile.education[0], degreeDoc: "replacement-document" }, profile.education[1]]);
    expect(reconcileQualificationSubjects(profile, incoming)).toEqual(["Physics"]);
    expect(profile.subjectEligibility![0].status).toBe("pending");
    expect(profile.subjectEligibility![0].levels).toEqual([]);
    expect(profile.approvedSubjects).toEqual([]);
  });
});
