import crypto from "crypto";
import ScheduledJobLease from "../models/ScheduledJobLease.model";
import ScheduledJobRun from "../models/ScheduledJobRun.model";
import logger from "../config/logger";

const PROCESS_HOLDER_ID = `${process.env.RENDER_INSTANCE_ID || process.env.HOSTNAME || "local"}:${process.pid}:${crypto.randomUUID()}`;

async function recordRun(
  name: string,
  startedAt: Date,
  status: "succeeded" | "failed",
  durationMs: number,
  error?: string
): Promise<void> {
  try {
    await ScheduledJobRun.create({
      jobName: name,
      holderId: PROCESS_HOLDER_ID,
      status,
      startedAt,
      finishedAt: new Date(),
      durationMs,
      ...(error ? { error: error.slice(0, 2000) } : {}),
    });
  } catch (runError) {
    // History is best-effort: losing a run row must never fail the job.
    logger.error({ err: runError, job: name }, "Failed to record scheduled job run");
  }
}

/**
 * Runs work only while this process owns a MongoDB-backed lease. This is safe
 * across Render replicas and naturally recovers after a crashed process once
 * the lease expires. Work must remain idempotent: a process can still die
 * after completing external work but before recording completion.
 *
 * A process that dies mid-run leaves no run row and no lease update, so the
 * lease simply expires and the next tick re-runs the job — that is the retry
 * mechanism. Persistent failures accumulate in `consecutiveFailures` and stay
 * visible in the admin system-health panel.
 */
export async function runWithJobLease<T>(
  name: string,
  leaseMs: number,
  work: () => Promise<T>,
): Promise<{ acquired: boolean; value?: T }> {
  const now = new Date();
  const leaseExpiresAt = new Date(now.getTime() + leaseMs);
  let lease;
  try {
    lease = await ScheduledJobLease.findOneAndUpdate(
      {
        name,
        $or: [
          { leaseExpiresAt: { $lte: now } },
          { holderId: PROCESS_HOLDER_ID },
        ],
      },
      {
        $set: { holderId: PROCESS_HOLDER_ID, leaseExpiresAt, lastStartedAt: now, lastError: "" },
        $setOnInsert: { name },
      },
      { returnDocument: "after", upsert: true },
    );
  } catch (error: any) {
    // A concurrent first upsert may lose the unique-index race. That is the
    // expected signal that another process owns the lease, not a job error.
    if (error?.code === 11000) return { acquired: false };
    throw error;
  }

  if (!lease || lease.holderId !== PROCESS_HOLDER_ID) return { acquired: false };

  try {
    const value = await work();
    const durationMs = Date.now() - now.getTime();
    await ScheduledJobLease.updateOne(
      { name, holderId: PROCESS_HOLDER_ID },
      {
        $set: { lastCompletedAt: new Date(), leaseExpiresAt: new Date(), lastError: "", lastDurationMs: durationMs, consecutiveFailures: 0 },
        $inc: { totalRuns: 1 },
      },
    );
    await recordRun(name, now, "succeeded", durationMs);
    return { acquired: true, value };
  } catch (error: any) {
    const durationMs = Date.now() - now.getTime();
    const message = String(error?.message || "Scheduled job failed");
    await ScheduledJobLease.updateOne(
      { name, holderId: PROCESS_HOLDER_ID },
      {
        $set: { leaseExpiresAt: new Date(), lastError: message.slice(0, 2000), lastDurationMs: durationMs },
        $inc: { totalRuns: 1, totalFailures: 1, consecutiveFailures: 1 },
      },
    ).catch((leaseError) => logger.error({ err: leaseError, job: name }, "Failed to record scheduled job failure"));
    await recordRun(name, now, "failed", durationMs, message);
    throw error;
  }
}