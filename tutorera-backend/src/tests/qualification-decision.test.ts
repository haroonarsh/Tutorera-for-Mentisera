import { Types } from "mongoose";
import TutorProfile from "../models/TutorProfile.model";
import AuditLog from "../models/AuditLog.model";
import AdminVerificationReview from "../models/AdminVerificationReview.model";
import TutorDocumentReview from "../models/TutorDocumentReview.model";
import TutorApplicationStatusHistory from "../models/TutorApplicationStatusHistory.model";
import { commitQualificationDecision, qualificationReviewToken, QualificationDecisionError } from "../services/qualificationDecision.service";

async function fixture() {
  await Promise.all([AuditLog.init(), AdminVerificationReview.init(), TutorDocumentReview.init(), TutorApplicationStatusHistory.init()]);
  const profile = await TutorProfile.create({ user: new Types.ObjectId(), fullName: "Qualification Tutor",
    education: [0, 1].map(index => ({ degree: "BSc", institution: "University", year: 2020,
      degreeDoc: `document-${index}`, verificationStatus: "pending" })) });
  return { profileId: profile._id.toString(), index: 0, status: "approved" as const,
    reason: "Credential verified", degreeLevel: "bachelors", expectedToken: qualificationReviewToken(profile.education[0]),
    actor: { id: new Types.ObjectId().toString(), name: "Reviewer" } };
}

describe("atomic qualification reviews", () => {
  it("resets only approved subjects linked to a rejected qualification", async () => {
    const input = await fixture();
    const approved = (await commitQualificationDecision(input))!;
    approved.subjectEligibility = [
      { subject: "Physics", levels: ["O-Level"], status: "approved", matchesDiscipline: true, requestedAt: new Date(), qualificationIndex: 0 },
      { subject: "Chemistry", levels: ["O-Level"], status: "approved", matchesDiscipline: true, requestedAt: new Date(), qualificationIndex: 1 },
    ];
    await approved.save();
    const reset = (await commitQualificationDecision({ ...input, status: "rejected", reason: "Credential revoked",
      expectedToken: qualificationReviewToken(approved.education[0]) }))!;
    expect(reset.subjectEligibility![0].status).toBe("pending");
    expect(reset.subjectEligibility![0].levels).toHaveLength(0);
    expect(reset.subjectEligibility![1].status).toBe("approved");
    expect(reset.approvedSubjects).toEqual(["Chemistry"]);
    expect(await TutorApplicationStatusHistory.countDocuments({ event: "SUBJECT_ELIGIBILITY_REVIEW_REQUIRED" })).toBe(1);
    expect(await AuditLog.countDocuments({ action: "subject_eligibility_reset_after_qualification_review" })).toBe(1);
  });
  it("commits individual review, queue, and complete history", async () => {
    const input = await fixture();
    const profile = await commitQualificationDecision(input);
    expect(profile!.education[0].verificationStatus).toBe("approved");
    expect(profile!.degreeVerificationStatus).toBe("pending");
    expect((await TutorDocumentReview.findOne())!.status).toBe("pending");
    expect(await AuditLog.countDocuments()).toBe(1);
    expect(await AdminVerificationReview.countDocuments()).toBe(1);
    expect((await TutorApplicationStatusHistory.findOne())!.actorId!.toString()).toBe(input.actor.id);
  });

  it("rolls back every write when history fails", async () => {
    const input = await fixture();
    const failure = jest.spyOn(TutorApplicationStatusHistory, "create").mockRejectedValueOnce(new Error("History unavailable") as never);
    try { await expect(commitQualificationDecision(input)).rejects.toThrow("History unavailable"); }
    finally { failure.mockRestore(); }
    expect((await TutorProfile.findById(input.profileId))!.education[0].verificationStatus).toBe("pending");
    expect(await AuditLog.countDocuments()).toBe(0);
    expect(await AdminVerificationReview.countDocuments()).toBe(0);
    expect(await TutorDocumentReview.countDocuments()).toBe(0);
  });

  it("rejects one of two conflicting reviews of the same snapshot", async () => {
    const input = await fixture();
    const results = await Promise.allSettled([commitQualificationDecision(input),
      commitQualificationDecision({ ...input, status: "rejected", reason: "Document unreadable" })]);
    expect(results.filter(result => result.status === "fulfilled")).toHaveLength(1);
    const loser = results.find(result => result.status === "rejected") as PromiseRejectedResult;
    expect(loser.reason).toBeInstanceOf(QualificationDecisionError);
    expect(loser.reason.statusCode).toBe(409);
    expect(await AuditLog.countDocuments()).toBe(1);
  });

  it("preserves another qualification's rejection reason when approving", async () => {
    const input = await fixture();
    const profile = (await TutorProfile.findById(input.profileId))!;
    await commitQualificationDecision({ ...input, index: 1, status: "rejected", reason: "Transcript missing",
      expectedToken: qualificationReviewToken(profile.education[1]) });
    const result = await commitQualificationDecision(input);
    expect(result!.degreeVerificationStatus).toBe("rejected");
    expect(result!.degreeRejectionReason).toBe("Transcript missing");
    expect((await TutorDocumentReview.findOne())!.rejectionReason).toBe("Transcript missing");
  });

  it("records explicit return-to-pending decisions", async () => {
    const input = await fixture();
    const approved = (await commitQualificationDecision(input))!;
    await commitQualificationDecision({ ...input, status: "pending", reason: "Additional issuer check",
      expectedToken: qualificationReviewToken(approved.education[0]) });
    expect(await AdminVerificationReview.countDocuments({ decision: "pending" })).toBe(1);
  });
});
