// Tests for adminAgentOrchestrator.service.ts — parallel fan-out + RBAC filter

jest.mock("../services/adminAgentRead.service", () => ({
  readAdminAgentSummary: jest.fn().mockImplementation((agentId: string) =>
    Promise.resolve({
      agentId,
      generatedAt: new Date().toISOString(),
      data: { testKey: 42 },
    })
  ),
}));

import { executeAdminSupervisor } from "../services/adminAgentOrchestrator.service";
import { readAdminAgentSummary } from "../services/adminAgentRead.service";

describe("executeAdminSupervisor", () => {
  beforeEach(() => jest.clearAllMocks());

  it("executes all 4 agents for super_admin with 'all' query", async () => {
    const result = await executeAdminSupervisor("all", "super_admin", ["*"]);
    expect(result.agentsExecuted).toBe(4);
    expect(result.agentsSucceeded).toBe(4);
    expect(result.agentsFailed).toBe(0);
    expect(readAdminAgentSummary).toHaveBeenCalledTimes(4);
  });

  it("only executes agents the caller has permission for", async () => {
    // tutor_operations only has tutor.read — should get tutor agent only
    const result = await executeAdminSupervisor("all", "tutor_operations", []);
    const ids = result.results.map((r) => r.agentId);
    expect(ids).toContain("tutor");
    expect(ids).not.toContain("finance");
    expect(ids).not.toContain("operations");
  });

  it("captures individual agent errors without failing the whole response", async () => {
    (readAdminAgentSummary as jest.Mock)
      .mockRejectedValueOnce(new Error("DB timeout"))
      .mockResolvedValue({ agentId: "marketplace", generatedAt: "", data: {} });

    const result = await executeAdminSupervisor(
      "tutor pipeline and market overview",
      "super_admin",
      ["*"]
    );
    expect(result.agentsFailed).toBeGreaterThanOrEqual(1);
    expect(result.agentsSucceeded).toBeGreaterThanOrEqual(1);
    const failed = result.results.filter((r) => r.status === "error");
    expect(failed[0].error).toBeTruthy();
  });

  it("includes timing data on each result", async () => {
    const result = await executeAdminSupervisor("all", "super_admin", ["*"]);
    for (const r of result.results) {
      expect(typeof r.durationMs).toBe("number");
    }
    expect(typeof result.totalDurationMs).toBe("number");
  });

  it("returns the original message and executedAt timestamp", async () => {
    const msg = "show finance summary";
    const result = await executeAdminSupervisor(msg, "super_admin", ["*"]);
    expect(result.message).toBe(msg);
    expect(typeof result.executedAt).toBe("string");
    // executedAt should parse as a valid date
    expect(new Date(result.executedAt).getTime()).not.toBeNaN();
  });
});
