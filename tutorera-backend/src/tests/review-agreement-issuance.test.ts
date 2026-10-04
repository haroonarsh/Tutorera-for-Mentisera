import { Types } from "mongoose";
import User from "../models/User.model";
import TutorProfile from "../models/TutorProfile.model";
import TutorAgreement from "../models/TutorAgreement.model";
import AuditLog from "../models/AuditLog.model";
import TutorApplicationStatusHistory from "../models/TutorApplicationStatusHistory.model";
import { issueReviewedTutorAgreement } from "../services/reviewAgreementIssuance.service";

async function fixture() {
  await Promise.all([TutorAgreement.init(), AuditLog.init(), TutorApplicationStatusHistory.init()]);
  const user = await User.create({ name: "Agreement Tutor", email: "agreement-issuance@test.com", password: "password123", role: "tutor" });
  const profile = await TutorProfile.create({ user: user._id, fullName: user.name, onboardingComplete: true,
    hourlyRate: 25, currency: "USD", verificationStatus: "approved", cnicVerificationStatus: "approved",
    degreeVerificationStatus: "approved", demoVideoStatus: "approved", isVerified: true,
    subjectEligibility: [{ subject: "Physics", status: "approved", levels: ["O-Level"], matchesDiscipline: true }] });
  return { profile, user, actor: { id: new Types.ObjectId().toString(), name: "Reviewer", role: "admin" as const } };
}

describe("atomic reviewed agreement issuance", () => {
  it("issues one agreement with its profile flags and audit/history", async () => {
    const { profile, actor } = await fixture();
    expect((await issueReviewedTutorAgreement(profile._id.toString(), actor))!.issued).toBe(true);
    expect((await TutorProfile.findById(profile._id))!.agreementAcceptanceRequired).toBe(true);
    expect((await TutorAgreement.findOne())!.approvedHourlyRate).toBe(25);
    expect(await AuditLog.countDocuments({ action: "tutor_agreement_issued" })).toBe(1);
    expect(await TutorApplicationStatusHistory.countDocuments({ event: "TUTOR_AGREEMENT_ISSUED" })).toBe(1);
    expect((await issueReviewedTutorAgreement(profile._id.toString(), actor))!.issued).toBe(false);
  });

  it("rolls back profile and agreement if audit fails", async () => {
    const { profile, actor } = await fixture();
    const failure = jest.spyOn(AuditLog, "create").mockRejectedValueOnce(new Error("Audit unavailable") as never);
    try { await expect(issueReviewedTutorAgreement(profile._id.toString(), actor)).rejects.toThrow("Audit unavailable"); }
    finally { failure.mockRestore(); }
    expect(await TutorAgreement.countDocuments()).toBe(0);
    expect((await TutorProfile.findById(profile._id))!.agreementVersion).not.toBe("TTA-2026.1");
    expect(await TutorApplicationStatusHistory.countDocuments()).toBe(0);
  });

  it("serializes simultaneous issuance into exactly one agreement", async () => {
    const { profile, actor } = await fixture();
    const results = await Promise.all([issueReviewedTutorAgreement(profile._id.toString(), actor), issueReviewedTutorAgreement(profile._id.toString(), actor)]);
    expect(results.filter(result => result!.issued)).toHaveLength(1);
    expect(await TutorAgreement.countDocuments()).toBe(1);
    expect(await AuditLog.countDocuments()).toBe(1);
  });

  it("blocks issuance for moderated accounts or missing teaching approval", async () => {
    const { profile, user, actor } = await fixture();
    await User.updateOne({ _id: user._id }, { $set: { moderationStatus: "suspended" } });
    expect((await issueReviewedTutorAgreement(profile._id.toString(), actor))!.issued).toBe(false);
    await User.updateOne({ _id: user._id }, { $unset: { moderationStatus: 1 } });
    await TutorProfile.updateOne({ _id: profile._id }, { $set: { subjectEligibility: [] } });
    expect((await issueReviewedTutorAgreement(profile._id.toString(), actor))!.issued).toBe(false);
    expect(await TutorAgreement.countDocuments()).toBe(0);
  });
});
