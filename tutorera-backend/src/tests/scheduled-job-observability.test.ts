import request from "supertest";
import app from "../app";
import User from "../models/User.model";
import ScheduledJobLease from "../models/ScheduledJobLease.model";
import ScheduledJobRun from "../models/ScheduledJobRun.model";
import { runWithJobLease } from "../services/scheduledJobLease.service";

jest.mock("../utils/sendEmail", () => jest.fn().mockResolvedValue(undefined));

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret-at-least-16-chars";
});

async function admin() {
  const email = `jobs-admin-${Date.now()}-${Math.random()}@test.com`;
  await User.create({ name: "Jobs Admin", email, password: "password123", role: "admin", adminRole: "super_admin" });
  const agent = request.agent(app);
  await agent.post("/api/v1/auth/login").send({ email, password: "password123" }).expect(200);
  return agent;
}

describe("scheduled job observability", () => {
  it("restricts native queue inspection to authorized monitoring users and tolerates inspection failure", async () => {
    const previousNative = process.env.CLOUDFLARE_NATIVE_RUNTIME;
    const previousInspector = app.get("nativeJobQueueInspector");
    const snapshot = { observedAt: new Date().toISOString(), pending: [], failed: [], limit: 100, pendingTruncated: false, failedTruncated: false };
    const inspector = jest.fn().mockResolvedValue(snapshot);
    try {
      process.env.CLOUDFLARE_NATIVE_RUNTIME = "true";
      app.set("nativeJobQueueInspector", inspector);
      await request(app).get("/api/v1/admin/system/health").expect(401);
      expect(inspector).not.toHaveBeenCalled();
      const agent = await admin();
      const res = await agent.get("/api/v1/admin/system/health").expect(200);
      expect(res.body.health.nativeQueue).toEqual(snapshot);
      expect(res.body.health.scheduler.queueVisibility).toBe("available");
      inspector.mockRejectedValueOnce(new Error("fixture unavailable"));
      const unavailable = await agent.get("/api/v1/admin/system/health").expect(200);
      expect(unavailable.body.health.nativeQueue).toBeNull();
      expect(unavailable.body.health.scheduler.queueVisibility).toBe("unavailable");
    } finally {
      app.set("nativeJobQueueInspector", previousInspector);
      if (previousNative === undefined) delete process.env.CLOUDFLARE_NATIVE_RUNTIME; else process.env.CLOUDFLARE_NATIVE_RUNTIME = previousNative;
    }
  });

  it("reports paused native dispatch and retained last-success timestamps", async () => {
    const original = { native: process.env.CLOUDFLARE_NATIVE_RUNTIME, enabled: process.env.ENABLE_SCHEDULED_JOBS };
    const completedAt = new Date("2026-01-01T00:00:00.000Z");
    await ScheduledJobLease.create({ name: "retained-success", holderId: "old-fixture", leaseExpiresAt: new Date(0), lastCompletedAt: completedAt });
    try {
      process.env.CLOUDFLARE_NATIVE_RUNTIME = "true";
      process.env.ENABLE_SCHEDULED_JOBS = "false";
      const agent = await admin();
      const res = await agent.get("/api/v1/admin/system/health").expect(200);
      expect(res.body.health.scheduler).toMatchObject({ engine: "cloudflare-alarms", enabled: false, queueVisibility: "unavailable" });
      expect(res.body.health.jobs.find((job: { name: string }) => job.name === "retained-success").lastSucceededAt).toBe(completedAt.toISOString());
    } finally {
      if (original.native === undefined) delete process.env.CLOUDFLARE_NATIVE_RUNTIME; else process.env.CLOUDFLARE_NATIVE_RUNTIME = original.native;
      if (original.enabled === undefined) delete process.env.ENABLE_SCHEDULED_JOBS; else process.env.ENABLE_SCHEDULED_JOBS = original.enabled;
    }
  });

  it("does not run overlapping invocations in the same process", async () => {
    await ScheduledJobLease.init();
    let release!: () => void;
    let started!: () => void;
    const entered = new Promise<void>((resolve) => { started = resolve; });
    const held = new Promise<void>((resolve) => { release = resolve; });
    const first = runWithJobLease("test-overlap", 30_000, async () => { started(); await held; });
    await entered;
    try {
      const work = jest.fn();
      expect((await runWithJobLease("test-overlap", 30_000, work)).acquired).toBe(false);
      expect(work).not.toHaveBeenCalled();
    } finally { release(); await first; }
  });

  it("an expired invocation cannot release a replacement invocation's lease", async () => {
    await ScheduledJobLease.init();
    let releaseFirst!: () => void;
    let releaseSecond!: () => void;
    let enteredFirst!: () => void;
    let enteredSecond!: () => void;
    const firstEntered = new Promise<void>((resolve) => { enteredFirst = resolve; });
    const secondEntered = new Promise<void>((resolve) => { enteredSecond = resolve; });
    const firstHeld = new Promise<void>((resolve) => { releaseFirst = resolve; });
    const secondHeld = new Promise<void>((resolve) => { releaseSecond = resolve; });
    const first = runWithJobLease("test-expired-owner", 30_000, async () => { enteredFirst(); await firstHeld; });
    await firstEntered;
    await ScheduledJobLease.updateOne({ name: "test-expired-owner" }, { $set: { leaseExpiresAt: new Date(0) } });
    const second = runWithJobLease("test-expired-owner", 30_000, async () => { enteredSecond(); await secondHeld; });
    await secondEntered;
    try {
      const replacement = await ScheduledJobLease.findOne({ name: "test-expired-owner" }).lean();
      releaseFirst();
      await expect(first).rejects.toThrow("lease lost");
      const after = await ScheduledJobLease.findOne({ name: "test-expired-owner" }).lean();
      expect(after?.holderId).toBe(replacement?.holderId);
      expect(after?.leaseExpiresAt).toEqual(replacement?.leaseExpiresAt);
      expect((await runWithJobLease("test-expired-owner", 30_000, jest.fn())).acquired).toBe(false);
    } finally { releaseFirst(); releaseSecond(); await Promise.allSettled([first, second]); }
  });

  it("renews a running lease and releases it when the job finishes", async () => {
    let release!: () => void;
    let entered!: () => void;
    const started = new Promise<void>((resolve) => { entered = resolve; });
    const held = new Promise<void>((resolve) => { release = resolve; });
    const running = runWithJobLease("test-heartbeat", 3000, async () => { entered(); await held; });
    await started;
    try {
      const initial = await ScheduledJobLease.findOne({ name: "test-heartbeat" }).lean();
      let renewed = false;
      const deadline = Date.now() + 5000;
      while (Date.now() < deadline) {
        const current = await ScheduledJobLease.findOne({ name: "test-heartbeat" }).lean();
        if (current!.leaseExpiresAt.getTime() > initial!.leaseExpiresAt.getTime()) { renewed = true; break; }
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
      expect(renewed).toBe(true);
      expect((await runWithJobLease("test-heartbeat", 3000, jest.fn())).acquired).toBe(false);
    } finally { release(); await running; }
    const completed = await ScheduledJobLease.findOne({ name: "test-heartbeat" }).lean();
    expect(completed!.leaseExpiresAt.getTime()).toBeLessThanOrEqual(Date.now());
    const run = await ScheduledJobRun.findOne({ jobName: "test-heartbeat" }).lean();
    expect(run?.holderId).toBe(completed?.holderId);
    expect(run?.status).toBe("succeeded");
  });

  it.each([0, -1, NaN, Infinity, 1.5])("rejects invalid lease duration %s before running work", async (duration) => {
    const work = jest.fn();
    await expect(runWithJobLease("invalid-duration", duration, work)).rejects.toThrow("Invalid scheduled job lease duration");
    expect(work).not.toHaveBeenCalled();
  });

  it("records a durable run row and clears the failure state on success", async () => {
    const result = await runWithJobLease("test-success-job", 30_000, async () => "done");

    expect(result.acquired).toBe(true);
    expect(result.value).toBe("done");

    const runs = await ScheduledJobRun.find({ jobName: "test-success-job" }).lean();
    expect(runs).toHaveLength(1);
    expect(runs[0].status).toBe("succeeded");
    expect(runs[0].durationMs).toBeGreaterThanOrEqual(0);

    const lease = await ScheduledJobLease.findOne({ name: "test-success-job" }).lean();
    expect(lease?.consecutiveFailures).toBe(0);
    expect(lease?.totalRuns).toBe(1);
    expect(lease?.totalFailures).toBe(0);
    expect(lease?.lastError).toBeFalsy();
  });

  it("accumulates consecutive failures and keeps the last error", async () => {
    await expect(runWithJobLease("test-failing-job", 30_000, async () => { throw new Error("provider unavailable"); })).rejects.toThrow("provider unavailable");
    await expect(runWithJobLease("test-failing-job", 30_000, async () => { throw new Error("provider unavailable"); })).rejects.toThrow("provider unavailable");

    const lease = await ScheduledJobLease.findOne({ name: "test-failing-job" }).lean();
    expect(lease?.consecutiveFailures).toBe(2);
    expect(lease?.totalRuns).toBe(2);
    expect(lease?.totalFailures).toBe(2);
    expect(lease?.lastError).toContain("provider unavailable");

    const failures = await ScheduledJobRun.find({ jobName: "test-failing-job", status: "failed" }).lean();
    expect(failures).toHaveLength(2);

    await runWithJobLease("test-failing-job", 30_000, async () => "recovered");
    const recovered = await ScheduledJobLease.findOne({ name: "test-failing-job" }).lean();
    expect(recovered?.consecutiveFailures).toBe(0);
    expect(recovered?.lastError).toBe("");
  });

  it("releases the lease after a failure so the next tick can retry", async () => {
    await expect(runWithJobLease("test-retry-job", 30_000, async () => { throw new Error("boom"); })).rejects.toThrow("boom");

    const lease = await ScheduledJobLease.findOne({ name: "test-retry-job" }).lean();
    expect(new Date(lease!.leaseExpiresAt).getTime()).toBeLessThanOrEqual(Date.now());

    const retried = await runWithJobLease("test-retry-job", 30_000, async () => "second attempt");
    expect(retried.acquired).toBe(true);
    expect(retried.value).toBe("second attempt");
  });

  it("surfaces failing jobs and recent failures in system health", async () => {
    await expect(runWithJobLease("test-degraded-job", 30_000, async () => { throw new Error("settlement API timeout"); })).rejects.toThrow("settlement API timeout");

    const agent = await admin();
    const res = await agent.get("/api/v1/admin/system/health").expect(200);

    expect(res.body.health.degradedJobs).toContain("test-degraded-job");
    const job = res.body.health.jobs.find((j: { name: string }) => j.name === "test-degraded-job");
    expect(job.consecutiveFailures).toBe(1);
    expect(job.totalFailures).toBe(1);
    expect(job.lastError).toContain("settlement API timeout");
    expect(res.body.health.recentJobFailures[0]).toMatchObject({ jobName: "test-degraded-job" });
    expect(res.body.health.recentJobFailures[0].error).toContain("settlement API timeout");
  });
});
