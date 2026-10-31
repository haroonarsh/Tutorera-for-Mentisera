// src/services/adminApproval.service.ts
//
// Human-approval workflow for sensitive admin actions.
// An action is submitted as a "pending" request and must be approved (or
// rejected) by a DIFFERENT admin with the required permission before it runs.
// The actual execution of the approved action is the caller's responsibility —
// this service only manages the queue.

import AdminApprovalRequest, {
  type IAdminApprovalRequest,
} from "../models/AdminApprovalRequest.model";
import AuditLog from "../models/AuditLog.model";
import logger from "../config/logger";

const APPROVAL_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours

export interface SubmitApprovalInput {
  requestedByAdminId: string;
  requestedByAdminName: string;
  action: string;
  targetEntity: string;
  targetId: string;
  targetName?: string;
  payload?: Record<string, unknown>;
  rationale: string;
}

export interface ReviewApprovalInput {
  approvalRequestId: string;
  reviewingAdminId: string;
  reviewingAdminName: string;
  decision: "approved" | "rejected";
  reviewNote?: string;
}

/**
 * Submit a new approval request. An admin may not approve their own request.
 * Returns the created request.
 */
export async function submitApprovalRequest(
  input: SubmitApprovalInput
): Promise<IAdminApprovalRequest> {
  const expiresAt = new Date(Date.now() + APPROVAL_TTL_MS);

  const request = await AdminApprovalRequest.create({
    requestedByAdminId: input.requestedByAdminId,
    requestedByAdminName: input.requestedByAdminName,
    action: input.action,
    targetEntity: input.targetEntity,
    targetId: input.targetId,
    targetName: input.targetName,
    payload: input.payload ?? {},
    rationale: input.rationale,
    status: "pending",
    expiresAt,
  });

  await AuditLog.create({
    action: "admin_approval_submitted",
    actor: input.requestedByAdminName,
    actorId: input.requestedByAdminId,
    entity: "AdminApprovalRequest",
    targetId: String(request._id),
    metadata: { action: input.action, targetEntity: input.targetEntity, targetId: input.targetId },
  }).catch((err) =>
    logger.error({ err }, "[AdminApproval] audit log failed on submit")
  );

  return request;
}

/**
 * Review (approve or reject) a pending request.
 * Throws if: not found, already actioned, expired, or same admin as requester.
 */
export async function reviewApprovalRequest(
  input: ReviewApprovalInput
): Promise<IAdminApprovalRequest> {
  const request = await AdminApprovalRequest.findById(input.approvalRequestId);

  if (!request) throw new Error("Approval request not found");
  if (request.status !== "pending") throw new Error(`Request already ${request.status}`);
  if (request.expiresAt < new Date()) {
    request.status = "expired";
    await request.save({ validateBeforeSave: false });
    throw new Error("Approval request has expired");
  }
  if (request.requestedByAdminId === input.reviewingAdminId) {
    throw new Error("An admin cannot approve their own request");
  }

  request.status = input.decision;
  request.reviewedByAdminId = input.reviewingAdminId;
  request.reviewedByAdminName = input.reviewingAdminName;
  request.reviewNote = input.reviewNote;
  request.reviewedAt = new Date();
  await request.save({ validateBeforeSave: false });

  await AuditLog.create({
    action: `admin_approval_${input.decision}`,
    actor: input.reviewingAdminName,
    actorId: input.reviewingAdminId,
    entity: "AdminApprovalRequest",
    targetId: String(request._id),
    metadata: { originalAction: request.action, decision: input.decision, reviewNote: input.reviewNote },
  }).catch((err) =>
    logger.error({ err }, "[AdminApproval] audit log failed on review")
  );

  return request;
}

/**
 * List pending approval requests. Optionally filter to a specific action or
 * entity. Excludes expired requests.
 */
export async function listPendingApprovals(filters?: {
  action?: string;
  targetEntity?: string;
}): Promise<IAdminApprovalRequest[]> {
  // Expire overdue requests before listing
  await AdminApprovalRequest.updateMany(
    { status: "pending", expiresAt: { $lt: new Date() } },
    { $set: { status: "expired" } }
  );

  return AdminApprovalRequest.find({
    status: "pending",
    ...filters,
  }).sort({ createdAt: -1 });
}
