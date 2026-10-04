import { Types } from "mongoose";
import User from "../models/User.model";
import TutorProfile from "../models/TutorProfile.model";
import AuditLog from "../models/AuditLog.model";
import TutorApplicationStatusHistory from "../models/TutorApplicationStatusHistory.model";
import { synchronizeReviewVisibility } from "../services/reviewVisibility.service";

async function fixture() {
  await Promise.all([AuditLog.init(), TutorApplicationStatusHistory.init()]);
  const user = await User.create({ name: "Visibility Tutor", email: "visibility@test.com", password: "password123", role: "tutor", accountStatus: "submitted" });
  const profile = await TutorProfile.create({ user: user._id, fullName: user.name,
    onboardingComplete: true, hourlyRate: 1000, subjects: ["Physics"],
    cnicFront: "identity", videoIntro: "demo", policeCertificate: "background",
    education: [{ degree: "BSc", institution: "University", year: 2020, degreeDoc: "degree" }],
    legacyAgreementStatus: "accepted",
    verificationStatus: "approved", isVerified: true, cnicVerificationStatus: "approved",
    degreeVerificationStatus: "approved", demoVideoStatus: "approved", agreementAcceptedAt: new Date(),
    countryCode: "PK", teachingMode: "both", policeVerificationStatus: "approved",
    subjectEligibility: [{ subject: "Physics", levels: ["O-Level"], status: "approved", matchesDiscipline: true }] });
  // Explicit pre-transition state, bypassing the legacy save-hook auto flags.
  await TutorProfile.updateOne({ _id: profile._id }, { $set: { marketplaceEligible: false, homeTuitionEligible: false } });
  return { profile, user, actor: { id: new Types.ObjectId().toString(), name: "Reviewer", role: "admin" as const } };
}

describe("atomic post-review visibility", () => {
  it("does not activate an approved application with incomplete onboarding", async () => {
    const { profile, actor } = await fixture();
    await TutorProfile.updateOne({ _id: profile._id }, { $set: { onboardingComplete: false } });
    const result = (await synchronizeReviewVisibility(profile._id.toString(), actor))!;
    expect(result.marketplace).toBe(false);
    expect(result.home).toBe(false);
  });
  it("activates both flags, account and history once", async () => {
    const { profile, user, actor } = await fixture();
    const result = (await synchronizeReviewVisibility(profile._id.toString(), actor))!;
    expect(result.marketplace).toBe(true);
    expect(result.home).toBe(true);
    expect((await User.findById(user._id))!.accountStatus).toBe("verified");
    expect(await TutorApplicationStatusHistory.countDocuments()).toBe(2);
    await synchronizeReviewVisibility(profile._id.toString(), actor);
    expect(await TutorApplicationStatusHistory.countDocuments()).toBe(2);
    expect(await AuditLog.countDocuments()).toBe(1);
  });

  it("rolls back flags, account and history when audit fails", async () => {
    const { profile, user, actor } = await fixture();
    const failure = jest.spyOn(AuditLog, "create").mockRejectedValueOnce(new Error("Audit unavailable") as never);
    try { await expect(synchronizeReviewVisibility(profile._id.toString(), actor)).rejects.toThrow("Audit unavailable"); }
    finally { failure.mockRestore(); }
    expect((await TutorProfile.findById(profile._id))!.marketplaceEligible).toBe(false);
    expect((await User.findById(user._id))!.accountStatus).toBe("submitted");
    expect(await TutorApplicationStatusHistory.countDocuments()).toBe(0);
  });

  it("deactivates suspended accounts and clears visibility timestamps", async () => {
    const { profile, user, actor } = await fixture();
    await synchronizeReviewVisibility(profile._id.toString(), actor);
    await User.updateOne({ _id: user._id }, { $set: { moderationStatus: "suspended" } });
    const result = (await synchronizeReviewVisibility(profile._id.toString(), actor))!;
    expect(result.marketplace).toBe(false);
    expect(result.home).toBe(false);
    const saved = (await TutorProfile.findById(profile._id))!;
    expect(saved.marketplaceEligibleAt).toBeUndefined();
    expect(saved.homeTuitionEligibleAt).toBeUndefined();
    expect((await User.findById(user._id))!.moderationStatus).toBe("suspended");
    expect((await User.findById(user._id))!.accountStatus).toBe("submitted");
  });

  it("repairs lifecycle drift without duplicate activation history", async () => {
    const { profile, user, actor } = await fixture();
    await synchronizeReviewVisibility(profile._id.toString(), actor);
    await User.updateOne({ _id: user._id }, { $set: { accountStatus: "submitted" } });
    const result = (await synchronizeReviewVisibility(profile._id.toString(), actor))!;
    expect(result.marketplaceChanged).toBe(false);
    expect((await User.findById(user._id))!.accountStatus).toBe("verified");
    expect(await TutorApplicationStatusHistory.countDocuments()).toBe(2);
    expect(await AuditLog.countDocuments()).toBe(2);
  });
});
