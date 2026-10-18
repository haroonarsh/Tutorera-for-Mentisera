import { randomUUID } from "crypto";
import mongoose from "mongoose";
import JobLease from "../models/JobLease.model";
import logger from "../config/logger";

/**
 * One active worker for each job across Render instances. Fencing is based on
 * a MongoDB compare-and-set lease; a crashed runner frees the lease after TTL.
 * Workers must finish within leaseMs. No payouts are issued by this scheduler.
 */
export async function withDistributedJobLease(
  name: string,
  work: () => Promise<unknown>,
  leaseMs = 30 * 60 * 1000
): Promise<boolean> {
  if (mongoose.connection.readyState !== 1) return false;
  const owner = randomUUID();
  const now = new Date();
  let acquired;
  try {
    acquired = await JobLease.findOneAndUpdate(
      { _id: name, $or: [{ leaseUntil: { $lte: now } }, { leaseUntil: { $exists: false } }] },
      { $set: { owner, leaseUntil: new Date(now.getTime() + leaseMs) } },
      { upsert: true, new: true }
    );
  } catch (error: any) {
    // A uniqueness conflict means another instance holds this job's lease.
    if (error?.code === 11000) return false;
    throw error;
  }
  if (!acquired || acquired.owner !== owner) return false;
  try {
    await work();
    return true;
  } finally {
    const cleared = await JobLease.updateOne({ _id: name, owner }, { $set: { leaseUntil: new Date(0) } });
    if (cleared.modifiedCount !== 1) logger.warn({ name }, "Job lease expired or was stolen before release");
  }
}
