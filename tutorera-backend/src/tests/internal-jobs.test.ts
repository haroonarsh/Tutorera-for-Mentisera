import express from "express";
import request from "supertest";
import { createInternalJobsRouter } from "../routes/internalJobs.routes";

describe("internal scheduled-job dispatch", () => {
  const token = "test-internal-job-token-at-least-32-characters";
  const originalMode = process.env.SCHEDULER_MODE;
  const originalToken = process.env.INTERNAL_JOB_TOKEN;
  const run = jest.fn().mockResolvedValue({ acquired: true });
  const app = express().use("/internal/jobs", createInternalJobsRouter(run));

  beforeEach(() => {
    process.env.SCHEDULER_MODE = "external";
    process.env.INTERNAL_JOB_TOKEN = token;
    run.mockClear();
  });
  afterAll(() => {
    if (originalMode === undefined) delete process.env.SCHEDULER_MODE; else process.env.SCHEDULER_MODE = originalMode;
    if (originalToken === undefined) delete process.env.INTERNAL_JOB_TOKEN; else process.env.INTERNAL_JOB_TOKEN = originalToken;
  });
  it.each([undefined, "wrong", "x".repeat(token.length)])("rejects unauthenticated or forged dispatch", async (supplied) => {
    const call = request(app).post("/internal/jobs/email-outbox-delivery");
    if (supplied) call.set("X-Tutorera-Job-Token", supplied);
    await call.expect(403);
    expect(run).not.toHaveBeenCalled();
  });
  it("fails closed on Render and when the server secret is too short", async () => {
    process.env.SCHEDULER_MODE = "process";
    await request(app).post("/internal/jobs/email-outbox-delivery").set("X-Tutorera-Job-Token", token).expect(403);
    process.env.SCHEDULER_MODE = "external";
    process.env.INTERNAL_JOB_TOKEN = "short";
    await request(app).post("/internal/jobs/email-outbox-delivery").set("X-Tutorera-Job-Token", "short").expect(403);
    expect(run).not.toHaveBeenCalled();
  });
  it("rejects unknown jobs even with valid credentials", async () => {
    await request(app).post("/internal/jobs/arbitrary-code").set("X-Tutorera-Job-Token", token).expect(404);
    expect(run).not.toHaveBeenCalled();
  });
  it("executes only an authenticated allowlisted job", async () => {
    await request(app).post("/internal/jobs/email-outbox-delivery").set("X-Tutorera-Job-Token", token).expect(200, { success: true, acquired: true });
    expect(run).toHaveBeenCalledWith("email-outbox-delivery", undefined);
  });
});
