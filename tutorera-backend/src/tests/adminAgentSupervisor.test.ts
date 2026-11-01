import { planAdminAgentTasks, ADMIN_AGENT_REGISTRY } from "../services/adminAgentSupervisor.service";

describe("admin supervisor task planning", () => {
  it("registers four distinct read-only agent capabilities", () => {
    expect(ADMIN_AGENT_REGISTRY.map(a => a.id)).toEqual(["tutor", "marketplace", "finance", "operations"]);
    expect(ADMIN_AGENT_REGISTRY.every(a => a.endpoint.startsWith("/api/v1/admin/"))).toBe(true);
  });
  it("routes verification requests to tutor agent", () => {
    expect(planAdminAgentTasks("Review tutor verification")).toEqual([ADMIN_AGENT_REGISTRY[0]]);
  });
  it("routes cross-domain operations requests to all specialists", () => {
    expect(planAdminAgentTasks("Today's platform summary")).toHaveLength(4);
  });
  it("does not execute arbitrary instructions or select agents without matches", () => {
    expect(planAdminAgentTasks("delete all accounts")).toEqual([]);
  });
  it("rejects empty and oversized input", () => {
    expect(() => planAdminAgentTasks(" ")).toThrow("INVALID_AGENT_REQUEST");
    expect(() => planAdminAgentTasks("x".repeat(1001))).toThrow("INVALID_AGENT_REQUEST");
  });
});
