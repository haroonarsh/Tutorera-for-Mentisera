// Tests for infrastructureProbe.service.ts — fail-safe probes

jest.mock("mongoose", () => ({
  connection: { readyState: 1 },
}));
jest.mock("../models/ScheduledJobLease.model", () => ({
  __esModule: true,
  default: { countDocuments: jest.fn().mockResolvedValue(0) },
}));
jest.mock("../models/ScheduledJobRun.model", () => ({
  __esModule: true,
  default: { countDocuments: jest.fn().mockResolvedValue(0) },
}));

import ScheduledJobLease from "../models/ScheduledJobLease.model";
import ScheduledJobRun from "../models/ScheduledJobRun.model";
import { runInfrastructureProbes } from "../services/infrastructureProbe.service";

describe("runInfrastructureProbes", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns healthy overall when all probes pass", async () => {
    const report = await runInfrastructureProbes();
    expect(report.overallStatus).toBe("healthy");
    expect(report.probes.length).toBeGreaterThanOrEqual(3);
  });

  it("includes a database probe with status", async () => {
    const report = await runInfrastructureProbes();
    const db = report.probes.find((p) => p.name === "database");
    expect(db).toBeDefined();
    expect(db?.status).toBe("healthy");
  });

  it("marks overall as degraded when scheduler has failed jobs", async () => {
    (ScheduledJobLease.countDocuments as jest.Mock).mockResolvedValueOnce(2);
    const report = await runInfrastructureProbes();
    const sched = report.probes.find((p) => p.name === "scheduler");
    expect(sched?.status).toBe("degraded");
    expect(report.overallStatus).toBe("degraded");
  });

  it("marks overall as degraded when recent job failures exist", async () => {
    (ScheduledJobRun.countDocuments as jest.Mock).mockResolvedValueOnce(3);
    const report = await runInfrastructureProbes();
    expect(report.overallStatus).toBe("degraded");
  });

  it("never throws — captures probe errors as unknown", async () => {
    (ScheduledJobLease.countDocuments as jest.Mock).mockRejectedValueOnce(new Error("DB down"));
    const report = await runInfrastructureProbes();
    const sched = report.probes.find((p) => p.name === "scheduler");
    expect(sched?.status).toBe("unknown");
    // overall should degrade to unknown
    expect(["degraded", "unknown"]).toContain(report.overallStatus);
  });

  it("each probe has name, status, and checkedAt", async () => {
    const report = await runInfrastructureProbes();
    for (const p of report.probes) {
      expect(p.name).toBeTruthy();
      expect(["healthy", "degraded", "unknown"]).toContain(p.status);
      expect(p.checkedAt).toBeTruthy();
    }
  });
});
