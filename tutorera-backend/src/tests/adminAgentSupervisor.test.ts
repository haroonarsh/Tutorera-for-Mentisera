// Tests for adminAgentSupervisor.service.ts — deterministic planner + registry

import {
  ADMIN_AGENT_REGISTRY,
  planAdminAgentTasks,
} from "../services/adminAgentSupervisor.service";

describe("ADMIN_AGENT_REGISTRY", () => {
  it("contains exactly the four specialist agents", () => {
    const ids = ADMIN_AGENT_REGISTRY.map((a) => a.id).sort();
    expect(ids).toEqual(["finance", "marketplace", "operations", "tutor"]);
  });

  it("every agent has a non-empty requiredPermission", () => {
    for (const a of ADMIN_AGENT_REGISTRY) {
      expect(typeof a.requiredPermission).toBe("string");
      expect(a.requiredPermission.length).toBeGreaterThan(0);
    }
  });
});

describe("planAdminAgentTasks", () => {
  it("throws INVALID_AGENT_REQUEST for empty string", () => {
    expect(() => planAdminAgentTasks("")).toThrow("INVALID_AGENT_REQUEST");
  });

  it("throws INVALID_AGENT_REQUEST for message exceeding 1000 chars", () => {
    expect(() => planAdminAgentTasks("a".repeat(1001))).toThrow("INVALID_AGENT_REQUEST");
  });

  it("returns all four agents for 'give me a full platform overview today'", () => {
    const tasks = planAdminAgentTasks("give me a full platform overview today");
    const ids = tasks.map((t) => t.agentId).sort();
    expect(ids).toEqual(["finance", "marketplace", "operations", "tutor"]);
  });

  it("returns only tutor agent for a tutor-specific query", () => {
    const tasks = planAdminAgentTasks("show tutor onboarding pipeline");
    expect(tasks.map((t) => t.agentId)).toContain("tutor");
    expect(tasks.map((t) => t.agentId)).not.toContain("finance");
  });

  it("returns only finance agent for a finance-specific query", () => {
    const tasks = planAdminAgentTasks("payout revenue earnings this week");
    expect(tasks.map((t) => t.agentId)).toContain("finance");
    expect(tasks.map((t) => t.agentId)).not.toContain("tutor");
  });

  it("returns all agents as default when no keyword matches", () => {
    const tasks = planAdminAgentTasks("what is going on");
    expect(tasks.length).toBe(4);
  });

  it("each task has non-empty agentId, label, and rationale", () => {
    const tasks = planAdminAgentTasks("all");
    for (const t of tasks) {
      expect(t.agentId).toBeTruthy();
      expect(t.label).toBeTruthy();
      expect(t.rationale).toBeTruthy();
    }
  });
});
