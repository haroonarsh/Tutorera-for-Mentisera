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