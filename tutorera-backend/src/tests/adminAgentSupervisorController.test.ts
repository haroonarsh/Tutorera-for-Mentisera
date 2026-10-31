import { planAdminSupervisor } from "../controllers/adminAgentSupervisor.controller";
import AuditLog from "../models/AuditLog.model";

jest.mock("../models/AuditLog.model", () => ({ __esModule: true, default: { create: jest.fn() } }));

const response = () => {
  const res: any = { status: jest.fn(), json: jest.fn(), setHeader: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
};

describe("admin supervisor audit and access boundaries", () => {
  beforeEach(() => jest.clearAllMocks());

  it("rejects malformed requests before any database write", async () => {
    const res = response();
    await planAdminSupervisor({ body: { message: ["finance"] } } as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(AuditLog.create).not.toHaveBeenCalled();
  });

  it("does not leak free-text requests into the audit record", async () => {
    (AuditLog.create as jest.Mock).mockResolvedValue({ _id: "audit123" });
    const res = response();
    const message = "tutor verification: confidential note 123";
    await planAdminSupervisor({
      body: { message },
      user: { _id: "admin123", name: "Admin", role: "admin", adminRole: "tutor_operations", adminPermissions: [] },
    } as any, res);
    expect(AuditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      action: "admin_agent_plan",
      actorId: "admin123",
      metadata: { plannedAgentIds: ["tutor"], blockedCount: 0, mode: "read-only-planning" },
    }));
    expect(JSON.stringify((AuditLog.create as jest.Mock).mock.calls[0][0])).not.toContain("confidential note");
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ auditId: "audit123", mode: "read-only-planning" }));
  });

  it("does not return finance tasks to a tutor-only administrator", async () => {
    (AuditLog.create as jest.Mock).mockResolvedValue({ _id: "audit456" });
    const res = response();
    await planAdminSupervisor({
      body: { message: "finance payouts" },
      user: { _id: "admin123", role: "admin", adminRole: "tutor_operations", adminPermissions: [] },
    } as any, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ tasks: [], blockedCount: 1 }));
  });

  it("fails closed when the audit database is unavailable", async () => {
    (AuditLog.create as jest.Mock).mockRejectedValue(new Error("database unavailable"));
    const res = response();
    await expect(planAdminSupervisor({
      body: { message: "tutor" },
      user: { _id: "admin123", role: "admin", adminRole: "tutor_operations", adminPermissions: [] },
    } as any, res)).rejects.toThrow("database unavailable");
    expect(res.json).not.toHaveBeenCalled();
  });
});
