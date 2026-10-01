import "dotenv/config";
import mongoose from "mongoose";
import TutorProfile from "../models/TutorProfile.model";
import { assignUniqueTutorSlug } from "../services/tutorSlug.service";

/**
 * One-time backfill for the SEO-friendly tutor profile URL migration:
 * replaces the old ObjectId-embedded frontend-only slug
 * (e.g. "6ab3de03c7eb556afb57ff43-samah-gamal-mathematics-tutor-egypt")
 * with a persisted, collision-checked slug
 * (/tutors/{countrySlug}/{name}-{subject}-tutor-{nationality}) with no
 * ObjectId in the URL at all. Idempotent - only assigns a slug to profiles
 * that don't already have one; re-run safely after new signups.
 */
async function main() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) throw new Error("MONGO_URI is required");
  await mongoose.connect(mongoUri);

  const profiles = await TutorProfile.find({ $or: [{ slug: { $exists: false } }, { slug: "" }, { slug: null }] });

  let updated = 0;
  for (const profile of profiles) {
    await assignUniqueTutorSlug(profile, { force: true });
    await profile.save({ validateModifiedOnly: true });
    updated++;
  }

  console.log(`Backfilled SEO-friendly slugs for ${updated} tutor profile(s).`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => undefined);
  process.exitCode = 1;
});
