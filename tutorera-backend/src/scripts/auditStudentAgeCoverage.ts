/**
 * Read-only, aggregate-only release report for historical student accounts.
 *
 * Usage from tutorera-backend:
 *   MONGO_URI=<secured-connection> npm run audit:student-age
 *
 * Never updates records or logs any student ID, name, DOB, email, or profile.
 * A privacy owner must review the totals before planning re-verification.
 */
import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User.model";
import StudentProfile from "../models/StudentProfile.model";
import GuardianConsent from "../models/GuardianConsent.model";

async function run() {
  if (process.argv.some(arg => ["--apply", "--write", "--migrate", "--fix"].includes(arg))) {
    throw new Error("Read-only age audit: write/migration flags are not permitted.");
  }
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGO_URI or MONGODB_URI is required for read-only age audit.");

  await mongoose.connect(uri);
  try {
    const eighteenYearsAgo = new Date();
    eighteenYearsAgo.setUTCFullYear(eighteenYearsAgo.getUTCFullYear() - 18);
    eighteenYearsAgo.setUTCHours(0, 0, 0, 0);

    const [
      totalStudents, missingAccountDob, storedMinor, minorWithoutConsent,
      consentVerifiedMinor, dobIndicatesMinorButFlagMissing,
      adultDobButMinorFlag, verifiedConsentRecords, profileDateMismatch,
    ] = await Promise.all([
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "student", $or: [
        { dateOfBirth: { $exists: false } }, { dateOfBirth: null },
      ] }),
      User.countDocuments({ role: "student", isMinor: true }),
      User.countDocuments({ role: "student", isMinor: true, parentConsentVerified: { $ne: true } }),
      User.countDocuments({ role: "student", isMinor: true, parentConsentVerified: true }),
      User.countDocuments({ role: "student", dateOfBirth: { $gt: eighteenYearsAgo },
        isMinor: { $ne: true } }),
      User.countDocuments({ role: "student", dateOfBirth: { $lte: eighteenYearsAgo },
        isMinor: true }),
      GuardianConsent.countDocuments({ status: "verified" }),
      StudentProfile.aggregate<{ total: number }>([
        { $match: { dateOfBirth: { $type: "string", $ne: "" } } },
        { $lookup: {
          from: User.collection.name, localField: "user", foreignField: "_id", as: "account",
        } },
        { $unwind: "$account" },
        { $match: { "account.role": "student" } },
        { $project: {
          profileDate: "$dateOfBirth",
          accountDate: { $dateToString: {
            format: "%Y-%m-%d", date: "$account.dateOfBirth", onNull: "",
          } },
        } },
        { $match: { $expr: { $ne: ["$profileDate", "$accountDate"] } } },
        { $count: "total" },
      ]),
    ]);

    process.stdout.write(JSON.stringify({
      mode: "READ_ONLY_AGGREGATES",
      generatedAt: new Date().toISOString(),
      privacy: "No personally identifying student data or dates of birth are exported.",
      counts: {
        totalStudents, missingAccountDob, storedMinor, minorWithoutConsent,
        consentVerifiedMinor, dobIndicatesMinorButFlagMissing,
        adultDobButMinorFlag, verifiedConsentRecords,
        studentProfileBirthDateMismatch: profileDateMismatch[0]?.total || 0,
      },
      interpretation: "The counts may overlap. Do not classify unknown DOB as verified adult, migrate automatically, or change consent without supervised review.",
    }, null, 2) + "\n");
  } finally {
    await mongoose.disconnect();
  }
}
run().catch(async error => {
  // Fail without echoing the MONGO_URI or any connection string.
  console.error("Student-age audit failed:", error instanceof Error ? error.name : "unknown error");
  await mongoose.disconnect();
  process.exitCode = 1;
});
