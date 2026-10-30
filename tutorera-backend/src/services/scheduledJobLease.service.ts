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
  error: string | undefined,
  holderId: string,
): Promise<void> {
  try {
    await ScheduledJobRun.create({
      jobName: name,
      holderId,
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
 * Acquires and renews an invocation-owned MongoDB lease. Lease loss cannot
 * cancel arbitrary in-flight work: tasks must remain idempotent, since a process can die
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
  if (!Number.isSafeInteger(leaseMs) || leaseMs <= 0) throw new Error("Invalid scheduled job lease duration");
  // An invocation owns the lease, not the process. Timers/alarms in the same
  // process can overlap, and an expired invocation must not release its successor.
  const holderId = `${PROCESS_HOLDER_ID}:${crypto.randomUUID()}`;
  const now = new Date();
  const leaseExpiresAt = new Date(now.getTime() + leaseMs);
  let lease;
  try {
    lease = await ScheduledJobLease.findOneAndUpdate(
      {
        name,
        leaseExpiresAt: { $lte: now },
      },
      {
        $set: { holderId, leaseExpiresAt, lastStartedAt: now, lastError: "" },
        $setOnInsert: { name },
      },
      { returnDocument: "after", upsert: true },
    );
  } catch (error) {
    // A concurrent first upsert may lose the unique-index race. That is the
    // expected signal that another process owns the lease, not a job error.
    if ((error as { code?: number })?.code === 11000) return { acquired: false };
    throw error;
  }

  if (!lease || lease.holderId !== holderId) return { acquired: false };

  let renewing: Promise<void> | undefined;
  let leaseLost = false;
  const heartbeat = setInterval(() => {
    if (renewing || leaseLost) return;
    renewing = (async () => {
      try {
        const at = new Date();
        const renewed = await ScheduledJobLease.updateOne(
          { name, holderId, leaseExpiresAt: { $gt: at } },
          { $set: { leaseExpiresAt: new Date(at.getTime() + leaseMs) } },
        );
        if (renewed.matchedCount !== 1) leaseLost = true;
      } catch {
        leaseLost = true;
      }
      if (leaseLost) logger.error({ job: name, holderId }, "Scheduled job lease renewal failed; in-flight work requires reconciliation");
    })().finally(() => { renewing = undefined; });
  }, Math.max(1, Math.floor(leaseMs / 3)));
  heartbeat.unref();
  const stopHeartbeat = async () => {
    clearInterval(heartbeat);
    await renewing;
  };

  try {
    const value = await work();
    await stopHeartbeat();
    if (leaseLost) throw new Error("Scheduled job lease lost during execution");
    const durationMs = Date.now() - now.getTime();
    const completed = await ScheduledJobLease.updateOne(
      { name, holderId, leaseExpiresAt: { $gt: new Date() } },
      {
        $set: { lastCompletedAt: new Date(), leaseExpiresAt: new Date(), lastError: "", lastDurationMs: durationMs, consecutiveFailures: 0 },
        $inc: { totalRuns: 1 },
      },
    );
    if (completed.matchedCount !== 1) throw new Error("Scheduled job lease lost during execution");
    await recordRun(name, now, "succeeded", durationMs, undefined, holderId);
    return { acquired: true, value };
  } catch (error) {
    await stopHeartbeat();
    const durationMs = Date.now() - now.getTime();
    const message = error instanceof Error ? error.message : "Scheduled job failed";
    await ScheduledJobLease.updateOne(
      { name, holderId },
      {
        $set: { leaseExpiresAt: new Date(), lastError: message.slice(0, 2000), lastDurationMs: durationMs },
        $inc: { totalRuns: 1, totalFailures: 1, consecutiveFailures: 1 },
      },
    ).catch((leaseError) => logger.error({ err: leaseError, job: name }, "Failed to record scheduled job failure"));
    await recordRun(name, now, "failed", durationMs, message, holderId);
    throw error;
  }
}
