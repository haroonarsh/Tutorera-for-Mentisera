/**
 * Privacy-preserving, read-only release preflight for the age-review indexes.
 * Usage: MONGO_URI=<connection> npm run audit:age-review-index
 * Never attempts to create/drop indexes or change student records.
 */
import "dotenv/config";
import mongoose from "mongoose";
import AgeReviewRequest from "../models/AgeReviewRequest.model";

async function run(): Promise<void> {
  if (process.argv.some(arg => ["--apply", "--write", "--migrate", "--fix"].includes(arg))) {
    throw new Error("Read-only preflight: mutation flags are forbidden.");
  }
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGO_URI or MONGODB_URI is required.");
  // Prevent Mongoose auto-index creation on this read-only connection.
  mongoose.set("autoIndex", false);
  await mongoose.connect(uri, { autoIndex: false });
  try {
    const duplicateGroups = await AgeReviewRequest.aggregate<{ _id: null; groups: number; records: number }>([
      { $match: { status: { $in: ["pending", "in_review"] } } },
      { $group: { _id: "$student", count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
      { $group: { _id: null, groups: { $sum: 1 }, records: { $sum: "$count" } } },
    ]);
    const indexes = await AgeReviewRequest.collection.indexes();
    const active = indexes.some(index =>
      index.name === "unique_active_student_age_review" &&
      index.unique === true &&
      index.key?.student === 1 &&
      JSON.stringify(index.partialFilterExpression) ===
        JSON.stringify({ status: { $in: ["pending", "in_review"] } }));
    const oldPending = indexes.some(index => index.name === "unique_pending_student_age_review");
    const duplicates = duplicateGroups[0]?.groups || 0;
    process.stdout.write(JSON.stringify({
      mode: "READ_ONLY",
      activeCaseDuplicateGroups: duplicates,
      activeCaseDuplicateRecords: duplicateGroups[0]?.records || 0,
      activeUniqueIndexPresent: active,
      legacyPendingUniqueIndexPresent: oldPending,
      readyForIndexMigration: duplicates === 0,
      note: "Never automatically merge cases, delete evidence, or change a student's age or consent.",
    }, null, 2) + "\n");
    if (duplicates > 0 || !active) process.exitCode = 2;
  } finally {
    await mongoose.disconnect();
  }
}
run().catch(async (error: unknown) => {
  console.error("Age-review index preflight failed:", error instanceof Error ? error.name : "unknown");
  await mongoose.disconnect();
  process.exitCode = 1;
});
