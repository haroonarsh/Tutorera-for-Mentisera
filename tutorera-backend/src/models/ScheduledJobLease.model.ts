import mongoose, { Document, Schema } from "mongoose";

export interface IScheduledJobLease extends Document {
  name: string;
  holderId: string;
  leaseExpiresAt: Date;
  lastStartedAt?: Date;
  lastCompletedAt?: Date;
  lastError?: string;
  consecutiveFailures: number;
  totalRuns: number;
  totalFailures: number;
  lastDurationMs?: number;
  createdAt: Date;
  updatedAt: Date;
}

const scheduledJobLeaseSchema = new Schema<IScheduledJobLease>({
  name: { type: String, required: true, unique: true, trim: true },
  holderId: { type: String, required: true, trim: true },
  leaseExpiresAt: { type: Date, required: true, index: true },
  lastStartedAt: { type: Date },
  lastCompletedAt: { type: Date },
  lastError: { type: String, maxlength: 2000 },
  // Counters make a repeatedly failing job visible without reading logs: the
  // admin system-health panel reports these, and a non-zero consecutive count
  // is what an operator alerts on.
  consecutiveFailures: { type: Number, default: 0, min: 0 },
  totalRuns: { type: Number, default: 0, min: 0 },
  totalFailures: { type: Number, default: 0, min: 0 },
  lastDurationMs: { type: Number, min: 0 },
}, { timestamps: true });

export default mongoose.model<IScheduledJobLease>("ScheduledJobLease", scheduledJobLeaseSchema);