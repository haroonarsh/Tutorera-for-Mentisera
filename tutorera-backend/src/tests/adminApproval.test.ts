// Tests for adminApproval.service.ts — human-approval workflow

const mockSave = jest.fn().mockResolvedValue(undefined);
const mockCreate = jest.fn();
const mockFindById = jest.fn();
const mockUpdateMany = jest.fn().mockResolvedValue({});
const mockFind = jest.fn();

jest.mock("../models/AdminApprovalRequest.model", () => ({
  __esModule: true,
  default: {
    create: mockCreate,
    findById: mockFindById,
    updateMany: mockUpdateMany,
    find: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([]) }),
  },
}));
jest.mock("../models/AuditLog.model", () => ({
  __esModule: true,
  default: { create: jest.fn().mockResolvedValue({}) },
}));

import {
  submitApprovalRequest,
  reviewApprovalRequest,
} from "../services/adminApproval.service";

const BASE_INPUT = {
  requestedByAdminId: "admin-a",
  requestedByAdminName: "Admin A",
  action: "tutor.suspend",
  targetEntity: "TutorProfile",
  targetId: "tutor-123",
  rationale: "Policy violation detected",
};

describe("submitApprovalRequest", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreate.mockResolvedValue({
      _id: "req-1",
      status: "pending",
      ...BASE_INPUT,
    });
  });

  it("creates an approval request with status pending", async () => {
    const result = await submitApprovalRequest(BASE_INPUT);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ status: "pending", action: "tutor.suspend" })
    );
    expect(result.status).toBe("pending");
  });

  it("sets an expiresAt ~48h in the future", async () => {
    await submitApprovalRequest(BASE_INPUT);
    const createArg = mockCreate.mock.calls[0][0];
    const diff = createArg.expiresAt.getTime() - Date.now();
    expect(diff).toBeGreaterThan(47 * 60 * 60 * 1000);
    expect(diff).toBeLessThan(49 * 60 * 60 * 1000);
  });
});

describe("reviewApprovalRequest", () => {
  function makePendingRequest(overrides = {}) {
    return {
      _id: "req-1",
      status: "pending",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      requestedByAdminId: "admin-a",
      action: "tutor.suspend",
      save: mockSave,
      ...overrides,
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockSave.mockResolvedValue(undefined);
  });

  it("throws when request is not found", async () => {
    mockFindById.mockResolvedValue(null);
    await expect(
      reviewApprovalRequest({
        approvalRequestId: "missing",
        reviewingAdminId: "admin-b",
        reviewingAdminName: "Admin B",
        decision: "approved",
      })
    ).rejects.toThrow("Approval request not found");
  });

  it("throws when the same admin tries to approve their own request", async () => {
    mockFindById.mockResolvedValue(makePendingRequest());
    await expect(
      reviewApprovalRequest({
        approvalRequestId: "req-1",
        reviewingAdminId: "admin-a",
        reviewingAdminName: "Admin A",
        decision: "approved",
      })
    ).rejects.toThrow("cannot approve their own request");
  });

  it("throws when request is already actioned", async () => {
    mockFindById.mockResolvedValue(makePendingRequest({ status: "approved" }));
    await expect(
      reviewApprovalRequest({
        approvalRequestId: "req-1",
        reviewingAdminId: "admin-b",
        reviewingAdminName: "Admin B",
        decision: "approved",
      })
    ).rejects.toThrow("already approved");
  });

  it("approves a valid request and saves it", async () => {
    const req = makePendingRequest();
    mockFindById.mockResolvedValue(req);
    await reviewApprovalRequest({
      approvalRequestId: "req-1",
      reviewingAdminId: "admin-b",
      reviewingAdminName: "Admin B",
      decision: "approved",
      reviewNote: "Looks good",
    });
    expect(req.status).toBe("approved");
    expect(req.reviewedByAdminId).toBe("admin-b");
    expect(mockSave).toHaveBeenCalled();
  });

  it("rejects a valid request and saves it", async () => {
    const req = makePendingRequest();
    mockFindById.mockResolvedValue(req);
    await reviewApprovalRequest({
      approvalRequestId: "req-1",
      reviewingAdminId: "admin-b",
      reviewingAdminName: "Admin B",
      decision: "rejected",
      reviewNote: "Insufficient evidence",
    });
    expect(req.status).toBe("rejected");
    expect(mockSave).toHaveBeenCalled();
  });
});
