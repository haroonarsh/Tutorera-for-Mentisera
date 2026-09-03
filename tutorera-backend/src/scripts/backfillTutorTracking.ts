import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.model";
import TutorProfile from "../models/TutorProfile.model";
import TutorApplicationStatusHistory from "../models/TutorApplicationStatusHistory.model";
import { allocateApplicationId, generateTrackingToken } from "../services/tracking.service";

dotenv.config();

async function main() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("MONGO_URI not set");
    process.exit(1);
  }
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB");

  const tutors = await User.find({ role: "tutor" }).select("_id name applicationId trackingTokenHash createdAt");
  console.log(`Found ${tutors.length} tutor users`);

  let allocated = 0;
  let tokenIssued = 0;
  let historyInserted = 0;

  for (const user of tutors) {
    let dirty = false;
    if (!user.applicationId) {
      user.applicationId = await allocateApplicationId();
      allocated++;
      dirty = true;
    }
    if (!user.trackingTokenHash) {
      const t = generateTrackingToken();
      user.trackingTokenHash = t.hash;
      user.trackingTokenCreatedAt = user.trackingTokenCreatedAt || new Date();
      tokenIssued++;
      dirty = true;
    }
    if (!user.applicationSubmittedAt) {
      const profile = await TutorProfile.findOne({ user: user._id });
      if (profile?.onboardingComplete) {
        user.applicationSubmittedAt = profile.createdAt;
        dirty = true;
      }
    }
    if (dirty) await user.save();

    if (user.applicationId) {
      const exists = await TutorApplicationStatusHistory.findOne({ tutor: user._id, event: "APPLICATION_CREATED" });
      if (!exists) {
        await TutorApplicationStatusHistory.create({
          tutor: user._id,
          actor: "System",
          actorRole: "system",
          event: "APPLICATION_CREATED",
          message: "Tutor application created (backfilled)",
          isPublic: true,
        });
        historyInserted++;
      }
    }
  }

  console.log(`Done. Allocated applicationIds: ${allocated}, issued tracking tokens: ${tokenIssued}, history rows inserted: ${historyInserted}`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
