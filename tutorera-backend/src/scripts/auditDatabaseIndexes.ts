/**
 * auditDatabaseIndexes.ts
 *
 * Connects to the target MongoDB, lists every actual index on every collection,
 * and compares them against what the Mongoose schemas declare.  Surfaces drift
 * between schema declarations and production indexes before a load test or
 * cutover.
 *
 * Usage:
 *   MONGO_URI=<uri> npx ts-node -e "require('./src/scripts/auditDatabaseIndexes')"
 *   Or: npx ts-node src/scripts/auditDatabaseIndexes.ts
 *
 * Exit 0 — no missing indexes found (extras are reported but not fatal).
 * Exit 1 — at least one schema-declared index is absent from the database.
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

// Import all models so their schemas are registered and autoIndex metadata is
// available.  Add new models here as they are created.
import "../models/User.model";
import "../models/TutorProfile.model";
import "../models/StudentProfile.model";
import "../models/Booking.model";
import "../models/Request.model";
import "../models/OfferNegotiation.model";
import "../models/PaymentLedger.model";
import "../models/PayoutReport.model";
import "../models/TutorPayout.model";
import "../models/AuditLog.model";
import "../models/TutorApplicationStatusHistory.model";
import "../models/TutorDocumentReview.model";
import "../models/AdminVerificationReview.model";
import "../models/ScheduledJobLease.model";
import "../models/ScheduledJobRun.model";
import "../models/EmailOutbox.model";
import "../models/EmailLog.model";
import "../models/Broadcast.model";
import "../models/Notification.model";
import "../models/Review.model";
import "../models/Contact.model";

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("MONGO_URI is required");
  process.exit(1);
}

interface IndexInfo {
  name: string;
  key: Record<string, unknown>;
  unique?: boolean;
  sparse?: boolean;
  partialFilterExpression?: unknown;
}

function normalizeKey(key: Record<string, unknown>): string {
  return Object.entries(key)
    .map(([k, v]) => `${k}:${v}`)
    .join(",");
}

async function main(): Promise<void> {
  await mongoose.connect(MONGO_URI as string, { autoIndex: false, autoCreate: false });
  const db = mongoose.connection.db!;
  let missingCount = 0;

  console.log("\n=== MongoDB Index Audit ===\n");

  for (const modelName of mongoose.modelNames()) {
    const model = mongoose.model(modelName);
    const collectionName = model.collection.collectionName;

    // Fetch indexes actually present in the database
    let liveIndexes: IndexInfo[] = [];
    try {
      liveIndexes = await db.collection(collectionName).indexes() as IndexInfo[];
    } catch {
      console.warn(`  [WARN] Could not read indexes for ${collectionName} — collection may not exist yet`);
      continue;
    }

    const liveKeys = new Set(liveIndexes.map((i) => normalizeKey(i.key)));

    // Collect declared indexes from the schema
    const schema = model.schema;
    const declaredIndexes: Array<{ key: Record<string, unknown>; options?: Record<string, unknown> }> = [];

    // Schema-level indexes (from schema.index() calls)
    for (const [fields, opts] of schema.indexes()) {
      declaredIndexes.push({ key: fields as Record<string, unknown>, options: opts as Record<string, unknown> });
    }
    // Path-level indexes (from { index: true } on individual fields)
    schema.eachPath((pathName: string, schemaType: unknown) => {
      const opts = (schemaType as { options?: { index?: boolean | Record<string, unknown>; unique?: boolean; sparse?: boolean } }).options;
      if (opts?.index || opts?.unique) {
        declaredIndexes.push({ key: { [pathName]: 1 } });
      }
    });

    const missing: string[] = [];
    const extra: string[] = [];

    for (const idx of declaredIndexes) {
      const normalised = normalizeKey(idx.key);
      if (!liveKeys.has(normalised) && normalised !== "_id:1") {
        missing.push(normalised);
      }
    }

    const schemaKeys = new Set(declaredIndexes.map((i) => normalizeKey(i.key)));
    for (const live of liveIndexes) {
      const normalised = normalizeKey(live.key);
      if (normalised !== "_id:1" && !schemaKeys.has(normalised)) {
        extra.push(`${normalised}${live.unique ? " [unique]" : ""}${live.partialFilterExpression ? " [partial]" : ""}`);
      }
    }

    if (missing.length || extra.length) {
      console.log(`Collection: ${collectionName}`);
      for (const m of missing) {
        console.log(`  ❌ MISSING  ${m}`);
        missingCount++;
      }
      for (const e of extra) {
        console.log(`  ➕ EXTRA    ${e}  (not declared in schema — may be a legacy index)`);
      }
      console.log();
    } else {
      console.log(`Collection: ${collectionName}  ✅ (${liveIndexes.length - 1} indexes, schema matches live)`);
    }
  }

  console.log("\n=== Summary ===");
  if (missingCount === 0) {
    console.log("✅ All declared indexes are present in the database.");
  } else {
    console.log(`❌ ${missingCount} declared index(es) are absent from the database.`);
    console.log("   Run: mongoose.syncIndexes() per model, or apply missing indexes manually.");
  }

  await mongoose.disconnect();
  process.exitCode = missingCount > 0 ? 1 : 0;
}

main().catch((err) => {
  console.error("Index audit failed:", err);
  process.exitCode = 1;
  mongoose.disconnect().catch(() => {});
});
