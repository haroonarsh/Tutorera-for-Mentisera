import crypto from "crypto";
import ScheduledJobLease from "../models/ScheduledJobLease.model";
import logger from "../config/logger";

const PROCESS_HOLDER_ID = `${process.env.RENDER_INSTANCE_ID || process.env.HOSTNAME || "local"}:${process.pid}:${crypto.randomUUID()}`;

/**
 * Runs work only while this process owns a MongoDB-backed lease. This is safe
 * across Render replicas and naturally recovers after a crashed process once
 * the lease expires. Work must remain idempotent: a process can still die
 * after completing external work but before recording completion.
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
      { new: true, upsert: true },
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
    await ScheduledJobLease.updateOne(
      { name, holderId: PROCESS_HOLDER_ID },
      { $set: { lastCompletedAt: new Date(), leaseExpiresAt: new Date(), lastError: "" } },
    );
    return { acquired: true, value };
  } catch (error: any) {
    await ScheduledJobLease.updateOne(
      { name, holderId: PROCESS_HOLDER_ID },
      { $set: { leaseExpiresAt: new Date(), lastError: String(error?.message || "Scheduled job failed").slice(0, 2000) } },
    ).catch((leaseError) => logger.error({ err: leaseError, job: name }, "Failed to record scheduled job failure"));
    throw error;
  }
}
