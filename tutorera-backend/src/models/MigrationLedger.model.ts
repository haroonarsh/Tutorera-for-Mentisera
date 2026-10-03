import mongoose, { Document, Schema } from "mongoose";

/**
 * Audit trail for one-off data migrations. The migration scripts under
 * `src/scripts` are hand-run against real data with no schema to enforce their
 * history, so without this ledger there is no way to answer "has this run,
 * did it change anything, what did it report" months later — and re-running a
 * half-applied migration becomes guesswork.
 *
 * Every migration script records a `planned` row when it runs without
 * `--apply` and updates that row to `applied` (or `failed`) when it writes.
 */
export interface IMigrationLedgerEntry extends Document {
  name: string;
  status: "planned" | "applied" | "failed";
  plannedAt: Date;
  appliedAt?: Date;
  durationMs?: number;
  matched: number;
  modified: number;
  report?: Record<string, unknown>;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const migrationLedgerSchema = new Schema<IMigrationLedgerEntry>({
  name: { type: String, required: true, trim: true, index: true },
  status: { type: String, enum: ["planned", "applied", "failed"], required: true, index: true },
  plannedAt: { type: Date, required: true },
  appliedAt: { type: Date },
  durationMs: { type: Number, min: 0 },
  matched: { type: Number, default: 0, min: 0 },
  modified: { type: Number, default: 0, min: 0 },
  report: { type: Schema.Types.Mixed },
  error: { type: String, maxlength: 2000 },
}, { timestamps: true });

export default mongoose.model<IMigrationLedgerEntry>("MigrationLedger", migrationLedgerSchema);