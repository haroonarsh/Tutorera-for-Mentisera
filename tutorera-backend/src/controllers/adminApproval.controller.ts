// src/controllers/adminApproval.controller.ts
//
// REST endpoints for the human-approval workflow:
//   POST /api/v1/admin/approvals          — submit a new approval request
//   GET  /api/v1/admin/approvals          — list pending requests
//   POST /api/v1/admin/approvals/:id/review — approve or reject

import { Response } from "express";
import { AuthRequest as Request } from "../types";
import {
  submitApprovalRequest,
  reviewApprovalRequest,
  listPendingApprovals,
} from "../services/adminApproval.service";
import logger from "../config/logger";

function adminInfo(req: Request) {
  return {
    id: req.user?._id?.toString() ?? "unknown",
    name: req.user?.name ?? "Unknown Admin",
  };
}

export async function submitApproval(req: Request, res: Response): Promise<void> {
  const admin = adminInfo(req);
  const { action, targetEntity, targetId, targetName, payload, rationale } =
    req.body as {
      action?: string;
      targetEntity?: string;
      targetId?: string;
      targetName?: string;
      payload?: Record<string, unknown>;
      rationale?: string;
    };

  if (!action || !targetEntity || !targetId || !rationale) {
    res.status(400).json({ error: "action, targetEntity, targetId, and rationale are required" });
    return;
  }

  try {
    const request = await submitApprovalRequest({
      requestedByAdminId: admin.id,
      requestedByAdminName: admin.name,
      action,
      targetEntity,
      targetId,
      targetName,
      payload,
      rationale,
    });
    res.status(201).json(request);
  } catch (err) {
    logger.error({ err }, "[AdminApproval] submit failed");
    res.status(500).json({ error: "Failed to submit approval request" });
  }
}

export async function listApprovals(req: Request, res: Response): Promise<void> {
  const { action, targetEntity } = req.query as { action?: string; targetEntity?: string };
  try {
    const requests = await listPendingApprovals({ action, targetEntity });
    res.json({ requests });
  } catch (err) {
    logger.error({ err }, "[AdminApproval] list failed");
    res.status(500).json({ error: "Failed to list approvals" });
  }
}

export async function reviewApproval(req: Request, res: Response): Promise<void> {
  const admin = adminInfo(req);
  const { id } = req.params as { id: string };
  const { decision, reviewNote } = req.body as { decision?: string; reviewNote?: string };

  if (decision !== "approved" && decision !== "rejected") {
    res.status(400).json({ error: "decision must be 'approved' or 'rejected'" });
    return;
  }

  try {
    const updated = await reviewApprovalRequest({
      approvalRequestId: id,
      reviewingAdminId: admin.id,
      reviewingAdminName: admin.name,
      decision,
      reviewNote,
    });
    res.json(updated);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Review failed";
    const status =
      msg === "Approval request not found" ? 404
      : msg === "An admin cannot approve their own request" ? 403
      : msg.startsWith("Request already") || msg === "Approval request has expired" ? 409
      : 500;
    res.status(status).json({ error: msg });
  }
}
