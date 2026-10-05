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

  const tutors = await User.find({ role: "tutor" })
    .select("_id applicationId trackingTokenHash trackingTokenCreatedAt applicationSubmittedAt")
    .lean();
  console.log(`Found ${tutors.length} tutor users`);

  let allocated = 0;
  let tokenIssued = 0;
  let submittedBackfilled = 0;

  // Fetch dependent records once. The original per-tutor lookups made this
  // otherwise-idempotent migration grow linearly into hundreds of round trips.
  const tutorIds = tutors.map((user) => user._id);
  const [profiles, createdHistoryTutorIds] = await Promise.all([
    TutorProfile.find({ user: { $in: tutorIds } }).select("user onboardingComplete createdAt").lean(),
    TutorApplicationStatusHistory.distinct("tutor", { tutor: { $in: tutorIds }, event: "APPLICATION_CREATED" }),
  ]);
  const profilesByTutor = new Map(profiles.map((profile) => [String(profile.user), profile]));
  const tutorsWithCreatedHistory = new Set(createdHistoryTutorIds.map(String));
  const userOperations: Array<Record<string, unknown>> = [];
  const historyRows: Array<Record<string, unknown>> = [];

  for (const user of tutors) {
    const update: Record<string, unknown> = {};
    if (!user.applicationId) {
      update.applicationId = await allocateApplicationId();
      allocated++;
    }
    if (!user.trackingTokenHash) {
      const t = generateTrackingToken();
      update.trackingTokenHash = t.hash;
      update.trackingTokenCreatedAt = user.trackingTokenCreatedAt || new Date();
      tokenIssued++;
    }
    if (!user.applicationSubmittedAt) {
      const profile = profilesByTutor.get(String(user._id));
      if (profile?.onboardingComplete) {
        update.applicationSubmittedAt = profile.createdAt;
        submittedBackfilled++;
      }
    }
    if (Object.keys(update).length) {
      userOperations.push({ updateOne: { filter: { _id: user._id }, update: { $set: update } } });
    }

    if ((user.applicationId || update.applicationId) && !tutorsWithCreatedHistory.has(String(user._id))) {
      historyRows.push({
          tutor: user._id,
          actor: "System",
          actorRole: "system",
          event: "APPLICATION_CREATED",
          message: "Tutor application created (backfilled)",
          isPublic: true,
      });
    }
  }

  if (userOperations.length) await User.bulkWrite(userOperations as any, { ordered: false });
  if (historyRows.length) await TutorApplicationStatusHistory.insertMany(historyRows, { ordered: false });

  console.log(`Done. Allocated applicationIds: ${allocated}, issued tracking tokens: ${tokenIssued}, submitted timestamps backfilled: ${submittedBackfilled}, history rows inserted: ${historyRows.length}`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
