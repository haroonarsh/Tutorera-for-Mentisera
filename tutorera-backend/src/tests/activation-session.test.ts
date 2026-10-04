import mongoose from "mongoose";
import User from "../models/User.model";
import TutorProfile from "../models/TutorProfile.model";
import TutorApplicationStatusHistory from "../models/TutorApplicationStatusHistory.model";
import { evaluateTutorActivation, syncTutorActivation } from "../services/tutorActivation.service";
import { seedDefaultLegalAgreements } from "../services/legalAgreement.service";

describe("activation transaction boundaries", () => {
  it("rolls back deactivation if tracking history cannot be saved", async () => {
    await seedDefaultLegalAgreements();
    const user = await User.create({ name: "History Failure", email: "history-failure@test.com", password: "password123", role: "tutor", accountStatus: "verified" });
    const profile = await TutorProfile.create({ user: user._id, fullName: user.name, verificationStatus: "rejected" });
    await TutorProfile.updateOne({ _id: profile._id }, { $set: { marketplaceEligible: true, homeTuitionEligible: true } });
    const failure = jest.spyOn(TutorApplicationStatusHistory, "create").mockRejectedValueOnce(new Error("History unavailable") as never);
    try { await expect(syncTutorActivation(user._id)).rejects.toThrow("History unavailable"); }
    finally { failure.mockRestore(); }
    const saved = (await TutorProfile.findById(profile._id))!;
    expect(saved.marketplaceEligible).toBe(true);
    expect(saved.homeTuitionEligible).toBe(true);
    expect((await User.findById(user._id))!.accountStatus).toBe("verified");
  });
  it("clears both visibility flags and timestamps for a rejected tutor", async () => {
    await seedDefaultLegalAgreements();
    const user = await User.create({ name: "Previously Active", email: "previous-active@test.com", password: "password123", role: "tutor", accountStatus: "verified" });
    const profile = await TutorProfile.create({ user: user._id, fullName: user.name, verificationStatus: "rejected" });
    await TutorProfile.updateOne({ _id: profile._id }, { $set: { marketplaceEligible: true, homeTuitionEligible: true,
      marketplaceEligibleAt: new Date(), homeTuitionEligibleAt: new Date() } });
    await syncTutorActivation(user._id);
    const saved = (await TutorProfile.findById(profile._id))!;
    expect(saved.marketplaceEligible).toBe(false);
    expect(saved.homeTuitionEligible).toBe(false);
    expect(saved.marketplaceEligibleAt).toBeUndefined();
    expect(saved.homeTuitionEligibleAt).toBeUndefined();
    expect((await User.findById(user._id))!.accountStatus).toBe("rejected");
    expect(await TutorApplicationStatusHistory.countDocuments({ tutor: user._id })).toBe(2);
    await syncTutorActivation(user._id);
    expect(await TutorApplicationStatusHistory.countDocuments({ tutor: user._id })).toBe(2);
  });
  it("reads uncommitted review changes and rolls back profile plus account on abort", async () => {
    await seedDefaultLegalAgreements();
    const user = await User.create({ name: "Session Tutor", email: "session@test.com", password: "password123", role: "tutor", accountStatus: "submitted" });
    const profile = await TutorProfile.create({ user: user._id, fullName: user.name, verificationStatus: "pending" });
    const session = await mongoose.startSession();
    try {
      await expect(session.withTransaction(async () => {
        await TutorProfile.updateOne({ _id: profile._id }, { $set: { verificationStatus: "rejected" } }, { session });
        expect((await evaluateTutorActivation(user._id, { session })).tutorStatus).toBe("rejected");
        await syncTutorActivation(user._id, { session });
        expect((await User.findById(user._id).session(session))!.accountStatus).toBe("rejected");
        throw new Error("Abort regression test");
      })).rejects.toThrow("Abort regression test");
    } finally { await session.endSession(); }
    expect((await TutorProfile.findById(profile._id))!.verificationStatus).toBe("pending");
    expect((await User.findById(user._id))!.accountStatus).toBe("submitted");
  });

  it("uses its own transaction when the caller supplies no session", async () => {
    await seedDefaultLegalAgreements();
    const user = await User.create({ name: "Rejected Tutor", email: "rejected-session@test.com", password: "password123", role: "tutor", accountStatus: "submitted" });
    await TutorProfile.create({ user: user._id, fullName: user.name, verificationStatus: "rejected" });
    const result = await syncTutorActivation(user._id);
    expect(result.status).toBe("rejected");
    expect((await User.findById(user._id))!.accountStatus).toBe("rejected");
  });
});
