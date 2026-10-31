// Tests for adminAgentSupervisor.controller.ts — RBAC gating and audit-log fail-close

jest.mock("../models/AuditLog.model", () => ({
  __esModule: true,
  default: { create: jest.fn().mockResolvedValue({}) },
}));
jest.mock("../services/adminAgentRead.service", () => ({
  readAdminAgentSummary: jest.fn().mockResolvedValue({
    agentId: "tutor",
    generatedAt: new Date().toISOString(),
    data: { pending: 3, active: 10, pendingAgreement: 2, approved: 1, suspended: 0 },
  }),
}));

import { Request, Response } from "express";
import AuditLog from "../models/AuditLog.model";
import { listAdminAgents, planAdminSupervisor, readAdminAgent } from "../controllers/adminAgentSupervisor.controller";

function makeRes() {
  const res = { status: jest.fn(), json: jest.fn() } as unknown as Response;
  (res.status as jest.Mock).mockReturnValue(res);
  return res;
}

function makeReq(overrides: Partial<Request> = {}): Request {
  return {
    user: {
      _id: "admin123",
      name: "Test Admin",
      adminRole: "super_admin",
      adminPermissions: ["*"],
    },
    body: {},
    params: {},
    ...overrides,
  } as unknown as Request;
}

describe("listAdminAgents", () => {
  it("returns all 4 agents for super_admin", async () => {
    const req = makeReq();
    const res = makeRes();
    await listAdminAgents(req, res);
    const call = (res.json as jest.Mock).mock.calls[0][0];
    expect(call.agents).toHaveLength(4);
  });

  it("returns only agents matching the caller's permissions", async () => {
    const req = makeReq({
      user: {
        _id: "admin456",
        name: "Tutor Ops",
        adminRole: "tutor_operations",
        adminPermissions: [],
      } as unknown as Request["user"],
    });
    const res = makeRes();
    await listAdminAgents(req, res);
    const call = (res.json as jest.Mock).mock.calls[0][0];
    const ids = call.agents.map((a: { id: string }) => a.id);
    expect(ids).toContain("tutor");
    expect(ids).not.toContain("finance");
  });
});

describe("planAdminSupervisor", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 400 when message is missing", async () => {
    const req = makeReq({ body: {} });
    const res = makeRes();
    await planAdminSupervisor(req, res);
    expect((res.status as jest.Mock).mock.calls[0][0]).toBe(400);
  });

  it("writes an audit log and returns tasks for valid message", async () => {
    const req = makeReq({ body: { message: "show me everything" } });
    const res = makeRes();
    await planAdminSupervisor(req, res);
    expect(AuditLog.create).toHaveBeenCalledTimes(1);
    const call = (res.json as jest.Mock).mock.calls[0][0];
    expect(Array.isArray(call.tasks)).toBe(true);
  });

  it("returns 500 and no data when audit log fails (fail-closed)", async () => {
    (AuditLog.create as jest.Mock).mockRejectedValueOnce(new Error("DB down"));
    const req = makeReq({ body: { message: "all" } });
    const res = makeRes();
    await planAdminSupervisor(req, res);
    expect((res.status as jest.Mock).mock.calls[0][0]).toBe(500);
    expect((res.json as jest.Mock).mock.calls[0][0]).toHaveProperty("error");
  });
});

describe("readAdminAgent", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 404 for unknown agentId", async () => {
    const req = makeReq({ params: { agentId: "nonexistent" } });
    const res = makeRes();
    await readAdminAgent(req, res);
    expect((res.status as jest.Mock).mock.calls[0][0]).toBe(404);
  });

  it("returns 403 when caller lacks required permission", async () => {
    const req = makeReq({
      params: { agentId: "finance" },
      user: {
        _id: "admin789",
        name: "Tutor Ops",
        adminRole: "tutor_operations",
        adminPermissions: [],
      } as unknown as Request["user"],
    });
    const res = makeRes();
    await readAdminAgent(req, res);
    expect((res.status as jest.Mock).mock.calls[0][0]).toBe(403);
  });

  it("returns summary data and writes audit log for authorised caller", async () => {
    const req = makeReq({ params: { agentId: "tutor" } });
    const res = makeRes();
    await readAdminAgent(req, res);
    expect(AuditLog.create).toHaveBeenCalledTimes(1);
    const call = (res.json as jest.Mock).mock.calls[0][0];
    expect(call.agentId).toBe("tutor");
  });
});
