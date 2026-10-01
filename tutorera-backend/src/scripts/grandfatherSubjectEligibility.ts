import "dotenv/config";
import mongoose from "mongoose";
import TutorProfile from "../models/TutorProfile.model";
import { grandfatherExistingSubjects } from "../services/subjectEligibility.service";

/**
 * One-time backfill for the qualification-based subject eligibility
 * feature: tutors who were already active before this feature existed had
 * their self-declared subjects/levels working as de facto approvals. This
 * auto-approves those existing subjects (see
 * services/subjectEligibility.service.ts's grandfatherExistingSubjects) so
 * the live marketplace isn't disrupted by suddenly requiring admin review
 * for subjects a tutor was already teaching. Newly-added subjects after
 * this point still require explicit admin approval. Idempotent - safe to
 * re-run; it skips tutors who already have any subjectEligibility entries.
 */
async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required");
  await mongoose.connect(process.env.MONGODB_URI);

  const profiles = await TutorProfile.find({
    subjects: { $exists: true, $ne: [] },
    $or: [{ subjectEligibility: { $exists: false } }, { subjectEligibility: { $size: 0 } }],
  });

  let updated = 0;
  for (const profile of profiles) {
    grandfatherExistingSubjects(profile);
    await profile.save({ validateModifiedOnly: true });
    updated++;
  }

  console.log(`Grandfathered subject eligibility for ${updated} already-active tutor profile(s).`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => undefined);
  process.exitCode = 1;
});
