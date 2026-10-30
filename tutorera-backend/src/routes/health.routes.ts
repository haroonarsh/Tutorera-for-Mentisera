import { Router } from "express";
import mongoose from "mongoose";
import ScheduledJobLease from "../models/ScheduledJobLease.model";
import { JOB_SCHEDULES } from "../config/scheduledJobs";
import logger from "../config/logger";

async function detectHeldJobs(): Promise<{ name: string; heldSinceMs: number }[]> {
  const now = Date.now();
  const leases = await ScheduledJobLease.find({ lastStartedAt: { $exists: true } }).lean();
  const held: { name: string; heldSinceMs: number }[] = [];
  for (const lease of leases) {
    if (!lease.lastStartedAt) continue;
    // A job is "held" when it acquired a lease but the lease is still active
    // (expiry in future) and it has been running for longer than 2x its expected
    // lease period — which means the heartbeat is still renewing but the work
    // is taking far longer than normal. Flag it for operator awareness.
    const schedule = JOB_SCHEDULES.find((j) => j.name === lease.name);
    if (!schedule) continue;
    const leaseExpiry = lease.leaseExpiresAt.getTime();
    const startedAt = lease.lastStartedAt.getTime();
    const heldSinceMs = now - startedAt;
    if (leaseExpiry > now && heldSinceMs > 2 * schedule.leaseMs) {
      held.push({ name: lease.name, heldSinceMs });
      logger.warn({ job: lease.name, holderId: lease.holderId, heldSinceMs }, "Scheduled job lease held beyond 2x expected duration — operator reconciliation may be required");
    }
  }
  return held;
}

/** Readiness checks MongoDB, not simply whether the HTTP port is open. */
export function createHealthRouter(checkDatabase: () => Promise<boolean> = async () => {
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) return false;
  await mongoose.connection.db.command({ ping: 1, maxTimeMS: 750 }, { timeoutMS: 1000 });
  return true;
}): Router {
  const router = Router();
  router.use((_req, res, next) => { res.setHeader("Cache-Control", "no-store"); next(); });
  router.get("/live", (_req, res) => { res.json({ status: "alive" }); });
  router.get(["/", "/ready"], async (_req, res) => {
    try {
      const ready = await checkDatabase();
      res.status(ready ? 200 : 503).json({ status: ready ? "ready" : "unavailable" });
    } catch {
      res.status(503).json({ status: "unavailable" });
    }
  });
  router.get("/jobs", async (_req, res) => {
    try {
      const heldJobs = await detectHeldJobs();
      res.json({ heldJobs, count: heldJobs.length });
    } catch (err) {
      logger.error({ err }, "Failed to check held jobs");
      res.status(503).json({ error: "unavailable" });
    }
  });
  return router;
}
