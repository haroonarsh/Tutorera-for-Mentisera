import "dotenv/config";
import mongoose from "mongoose";
import TutorProfile from "../models/TutorProfile.model";
import { evaluateMarketplaceAccess } from "../services/eligibility.service";

/**
 * Enumerates the tutor profiles whose marketplace visibility currently rests on
 * the legacy `marketplaceEligible` flag rather than on re-approved CNIC, degree
 * and demo-video documents.
 *
 * This is the evidence the audit asked for before the grandfather policy can be
 * retired: it answers "who would lose access if the bypass were removed" with a
 * list rather than an assumption. Read-only — this script never writes.
 *
 *   npm run audit:grandfathered-tutors
 */

async function run() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGO_URI is required.");
  await mongoose.connect(uri);

  const candidates = await TutorProfile.find({
    verificationStatus: "approved",
    marketplaceEligible: true,
  })
    .select("user countryCode city tutorStatus cnicVerificationStatus degreeVerificationStatus demoVideoStatus subjectEligibility agreementAcceptedAt legacyAgreementStatus marketplaceEligibleAt")
    .lean();

  const grandfathered = candidates.filter((profile) => evaluateMarketplaceAccess(profile, { grandfathered: true }).grandfatherBypassActive);
  const wouldLoseSubjectApproval = grandfathered.filter((profile) => !evaluateMarketplaceAccess(profile).subjectApproved);
  const wouldLoseAgreement = grandfathered.filter((profile) => !evaluateMarketplaceAccess(profile).agreementSatisfied);

  console.log(JSON.stringify({
    activeProfilesInspected: candidates.length,
    relyingOnGrandfatherBypass: grandfathered.length,
    alsoMissingApprovedSubject: wouldLoseSubjectApproval.length,
    alsoMissingAgreement: wouldLoseAgreement.length,
    profiles: grandfathered.map((profile) => ({
      tutorProfileId: String(profile._id),
      userId: String(profile.user),
      countryCode: profile.countryCode || null,
      city: profile.city || null,
      tutorStatus: profile.tutorStatus,
      documents: {
        cnic: profile.cnicVerificationStatus,
        degree: profile.degreeVerificationStatus,
        demoVideo: profile.demoVideoStatus,
      },
      approvedSubjects: (profile.subjectEligibility || [])
        .filter((entry) => entry.status === "approved")
        .map((entry) => ({ subject: entry.subject, levels: entry.levels })),
      marketplaceEligibleSince: profile.marketplaceEligibleAt || null,
    })),
  }, null, 2));

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exitCode = 1;
});