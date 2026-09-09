import "dotenv/config";
import mongoose from "mongoose";
import TutorProfile from "../models/TutorProfile.model";
import { normalizeEducationLevels } from "../config/educationLevels";

/**
 * Idempotently repairs historic short level labels. Run before deploying the
 * document-review fix so legacy profiles do not block future admin actions.
 */
async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required");
  await mongoose.connect(process.env.MONGODB_URI);
  const profiles = await TutorProfile.find({ levels: { $exists: true, $ne: [] } }).select("levels").lean();
  const operations = profiles.flatMap((profile: any) => {
    const normalized = normalizeEducationLevels(profile.levels);
    return JSON.stringify(normalized) === JSON.stringify(profile.levels)
      ? []
      : [{ updateOne: { filter: { _id: profile._id }, update: { $set: { levels: normalized } } } }];
  });
  if (operations.length) await TutorProfile.bulkWrite(operations);
  console.log(`Normalized education levels for ${operations.length} tutor profile(s).`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => undefined);
  process.exitCode = 1;
});
