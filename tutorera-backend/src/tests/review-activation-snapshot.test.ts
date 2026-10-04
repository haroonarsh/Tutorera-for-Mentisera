import { Types } from "mongoose";
import User from "../models/User.model";
import TutorProfile from "../models/TutorProfile.model";
import { loadReviewActivationSnapshot } from "../services/reviewActivationSnapshot.service";

describe("post-review activation snapshots", () => {
  it("reads current decisions and account moderation, not stale controller objects", async () => {
    const user = await User.create({ name: "Snapshot Tutor", email: "snapshot@test.com", password: "password123", role: "tutor" });
    const profile = await TutorProfile.create({ user: user._id, fullName: user.name, degreeVerificationStatus: "pending" });
    await TutorProfile.updateOne({ _id: profile._id }, { $set: { degreeVerificationStatus: "rejected" } });
    await User.updateOne({ _id: user._id }, { $set: { moderationStatus: "suspended" } });
    const current = await loadReviewActivationSnapshot(profile._id.toString());
    expect(profile.degreeVerificationStatus).toBe("pending");
    expect(current.profile.degreeVerificationStatus).toBe("rejected");
    expect(current.user.moderationStatus).toBe("suspended");
  });

  it("fails closed if either application or account is absent", async () => {
    await expect(loadReviewActivationSnapshot(new Types.ObjectId().toString())).rejects.toThrow("Application no longer exists");
    const profile = await TutorProfile.create({ user: new Types.ObjectId(), fullName: "Missing account" });
    await expect(loadReviewActivationSnapshot(profile._id.toString())).rejects.toThrow("Tutor account no longer exists");
  });
});
