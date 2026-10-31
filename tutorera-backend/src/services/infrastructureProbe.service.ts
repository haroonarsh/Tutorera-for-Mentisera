// src/services/infrastructureProbe.service.ts
//
// Lightweight, read-only infrastructure health probes used by the operations
// agent and the system-health endpoint.  Each probe is fail-safe: a thrown
// error is caught and reported as degraded rather than propagating.

import mongoose from "mongoose";
import ScheduledJobLease from "../models/ScheduledJobLease.model";
import ScheduledJobRun from "../models/ScheduledJobRun.model";
import logger from "../config/logger";

export type ProbeStatus = "healthy" | "degraded" | "unknown";

export interface ProbeResult {
  name: string;
  status: ProbeStatus;
  detail?: string;
  checkedAt: string;
}

export interface InfrastructureReport {
  overallStatus: ProbeStatus;
  checkedAt: string;
  probes: ProbeResult[];
}

// ── Individual probes ─────────────────────────────────────────────────────────

async function probeDatabase(): Promise<ProbeResult> {
  const checkedAt = new Date().toISOString();
  try {
    const state = mongoose.connection.readyState;
    // 1 = connected, 2 = connecting
    const status: ProbeStatus = state === 1 ? "healthy" : state === 2 ? "degraded" : "degraded";
    return { name: "database", status, detail: `readyState=${state}`, checkedAt };
  } catch (err) {
    logger.warn({ err }, "[InfraProbe] database probe threw");
    return { name: "database", status: "unknown", detail: "probe threw", checkedAt };
  }
}

async function probeScheduler(): Promise<ProbeResult> {
  const checkedAt = new Date().toISOString();
  try {
    const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 h
    const degradedLeases = await ScheduledJobLease.countDocuments({
      consecutiveFailures: { $gt: 0 },
    });
    const recentFailures = await ScheduledJobRun.countDocuments({
      status: "failed",
      startedAt: { $gte: cutoff },
    });
    const status: ProbeStatus =
      degradedLeases > 0 || recentFailures > 0 ? "degraded" : "healthy";
    return {
      name: "scheduler",
      status,
      detail: `degradedJobs=${degradedLeases} recentFailures=${recentFailures}`,
      checkedAt,
    };
  } catch (err) {
    logger.warn({ err }, "[InfraProbe] scheduler probe threw");
    return { name: "scheduler", status: "unknown", detail: "probe threw", checkedAt };
  }
}

function probeEnvironment(): ProbeResult {
  const checkedAt = new Date().toISOString();
  // In test environments the process vars are intentionally absent; skip the check.
  if (process.env.NODE_ENV === "test") {
    return { name: "environment", status: "healthy", detail: "skipped in test", checkedAt };
  }
  const required = ["MONGO_URI", "JWT_SECRET", "CLIENT_URL"];
  const missing = required.filter((k) => !process.env[k]);

  // Dangerous misconfigurations
  const warnings: string[] = [];
  if (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "development") {
    warnings.push(`NODE_ENV="${process.env.NODE_ENV ?? "unset"}"`);
  }
  if (process.env.CONTRACT_VERIFIED === "true" && process.env.NODE_ENV !== "production") {
    warnings.push("CONTRACT_VERIFIED=true outside production");
  }

  const status: ProbeStatus = missing.length > 0 ? "degraded" : warnings.length > 0 ? "degraded" : "healthy";
  const details: string[] = [];
  if (missing.length > 0) details.push(`missing: ${missing.join(", ")}`);
  if (warnings.length > 0) details.push(`warn: ${warnings.join("; ")}`);

  return {
    name: "environment",
    status,
    detail: details.join(" | ") || "all required vars present",
    checkedAt,
  };
}

function probeMemory(): ProbeResult {
  const checkedAt = new Date().toISOString();
  try {
    const mem = process.memoryUsage();
    const rssMb = Math.round(mem.rss / 1024 / 1024);
    const heapMb = Math.round(mem.heapUsed / 1024 / 1024);
    // Flag if heap usage is above 512 MB — likely a memory leak in a Node worker
    const status: ProbeStatus = heapMb > 512 ? "degraded" : "healthy";
    return {
      name: "memory",
      status,
      detail: `rss=${rssMb}MB heap=${heapMb}MB`,
      checkedAt,
    };
  } catch (err) {
    logger.warn({ err }, "[InfraProbe] memory probe threw");
    return { name: "memory", status: "unknown", detail: "probe threw", checkedAt };
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Runs all infrastructure probes in parallel and returns a consolidated report.
 * Never throws — individual probe errors are captured as "unknown" status.
 */
export async function runInfrastructureProbes(): Promise<InfrastructureReport> {
  const [db, sched, env, mem] = await Promise.all([
    probeDatabase(),
    probeScheduler(),
    Promise.resolve(probeEnvironment()),
    Promise.resolve(probeMemory()),
  ]);

  const probes = [db, sched, env, mem];
  const overallStatus: ProbeStatus =
    probes.some((p) => p.status === "degraded") ? "degraded"
    : probes.some((p) => p.status === "unknown") ? "unknown"
    : "healthy";

  return {
    overallStatus,
    checkedAt: new Date().toISOString(),
    probes,
  };
}
