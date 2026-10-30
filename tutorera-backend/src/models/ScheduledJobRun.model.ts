import mongoose, { Document, Schema } from "mongoose";

export type ScheduledJobRunStatus = "succeeded" | "failed";
export type ScheduledJobRunTrigger = "cron" | "manual_replay";

/**
 * One durable row per job execution. The ScheduledJobLease holds only the
 * latest state; this keeps the history an operator needs to answer "did this
 * job fail repeatedly, and when did it last succeed?" after a restart.
 * `triggeredBy` and `replayReason` are set for operator-initiated replays so
 * the audit trail distinguishes manual interventions from normal cron runs.
 */
export interface IScheduledJobRun extends Document {
  jobName: string;
  holderId: string;
  status: ScheduledJobRunStatus;
  startedAt: Date;
  finishedAt: Date;
  durationMs: number;
  error?: string;
  triggeredBy: ScheduledJobRunTrigger;
  replayReason?: string;
  createdAt: Date;
}

const scheduledJobRunSchema = new Schema<IScheduledJobRun>({
  jobName: { type: String, required: true, trim: true, index: true },
  holderId: { type: String, required: true, trim: true },
  status: { type: String, enum: ["succeeded", "failed"], required: true },
  startedAt: { type: Date, required: true },
  finishedAt: { type: Date, required: true },
  durationMs: { type: Number, required: true, min: 0 },
  error: { type: String, maxlength: 2000 },
  triggeredBy: { type: String, enum: ["cron", "manual_replay"], required: true, default: "cron" },
  replayReason: { type: String, maxlength: 500 },
}, { timestamps: true });

scheduledJobRunSchema.index({ jobName: 1, startedAt: -1 });
// History is diagnostic, not a source of truth: expire it so a job running
// every few minutes cannot grow the collection without bound.
scheduledJobRunSchema.index({ createdAt: 1 }, { expireAfterSeconds: 14 * 24 * 60 * 60 });

export default mongoose.model<IScheduledJobRun>("ScheduledJobRun", scheduledJobRunSchema);