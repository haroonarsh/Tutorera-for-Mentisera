import { Response } from "express";
import { AuthRequest } from "../types";
import TutorDocumentReview from "../models/TutorDocumentReview.model";
import {
  getReviewQueue,
  getReviewQueueItem,
  assignReviewItem,
  approveComponent,
  rejectComponent,
  escalateReviewItem as escalateServiceItem,
  getReviewHistory,
  syncReviewQueueForProfile,
} from "../services/verification.service";
import { hasPermission } from "../config/rbac";
import { logAudit } from "../utils/logAudit";

export const listReviewQueue = async (req: AuthRequest, res: Response): Promise<void> => {
  const { status, component, assignedTo, search, page = "1", limit = "20" } = req.query;

  const result = await getReviewQueue({
    status: status as string | undefined,
    component: component as string | undefined,
    assignedTo: assignedTo as string | undefined,
    page: parseInt(page as string) || 1,
    limit: parseInt(limit as string) || 20,
    search: search as string | undefined,
  });

  res.status(200).json({
    success: true,
    ...result,
  });
};

export const getReviewQueueStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  const [pending, inReview, approved, rejected, escalated] = await Promise.all([
    TutorDocumentReview.countDocuments({ status: "pending" }),
    TutorDocumentReview.countDocuments({ status: "in_review" }),
    TutorDocumentReview.countDocuments({ status: "approved" }),
    TutorDocumentReview.countDocuments({ status: "rejected" }),
    TutorDocumentReview.countDocuments({ status: "escalated" }),
  ]);

  res.status(200).json({
    success: true,
    stats: { pending, inReview, approved, rejected, escalated, total: pending + inReview + approved + rejected + escalated },
  });
};

export const getReviewItem = async (req: AuthRequest, res: Response): Promise<void> => {
  const item = await getReviewQueueItem(req.params.id as string);
  if (!item) {
    res.status(404).json({ success: false, message: "Review item not found" });
    return;
  }
  res.status(200).json({ success: true, item });
};

export const assignReview = async (req: AuthRequest, res: Response): Promise<void> => {
  const { adminId } = req.body;

  if (!hasPermission(req.user?.adminRole, req.user?.adminPermissions, "tutor.verify")) {
    res.status(403).json({ success: false, message: "You do not have permission to assign reviews." });
    return;
  }

  const item = await assignReviewItem(req.params.id as string, adminId, {
    id: req.user?._id?.toString() || "",
    name: req.user?.name || "Admin",
    role: "admin",
  });

  res.status(200).json({ success: true, message: "Review assigned successfully", item });
};

export const approveReviewItem = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!hasPermission(req.user?.adminRole, req.user?.adminPermissions, "tutor.verify")) {
    res.status(403).json({ success: false, message: "You do not have permission to approve reviews." });
    return;
  }

  const profile = await approveComponent(req.params.id as string, {
    id: req.user?._id?.toString() || "",
    name: req.user?.name || "Admin",
    role: "admin",
  }, req.app.get("io"));

  res.status(200).json({ success: true, message: "Component approved", profile });
};

export const rejectReviewItem = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!hasPermission(req.user?.adminRole, req.user?.adminPermissions, "tutor.reject")) {
    res.status(403).json({ success: false, message: "You do not have permission to reject reviews." });
    return;
  }

  const { reason } = req.body;
  if (!reason || !reason.trim()) {
    res.status(400).json({ success: false, message: "Rejection reason is required" });
    return;
  }

  const profile = await rejectComponent(req.params.id as string, reason, {
    id: req.user?._id?.toString() || "",
    name: req.user?.name || "Admin",
    role: "admin",
  }, req.app.get("io"));

  res.status(200).json({ success: true, message: "Component rejected", profile });
};

export const escalateReviewItem = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!hasPermission(req.user?.adminRole, req.user?.adminPermissions, "tutor.verify")) {
    res.status(403).json({ success: false, message: "You do not have permission to escalate reviews." });
    return;
  }

  const item = await escalateServiceItem(req.params.id as string, {
    id: req.user?._id?.toString() || "",
    name: req.user?.name || "Admin",
    role: "admin",
  });

  res.status(200).json({ success: true, message: "Review escalated", item });
};

export const getReviewHistoryForProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const history = await getReviewHistory(req.params.profileId as string);
  res.status(200).json({ success: true, history });
};

export const triggerQueueSync = async (req: AuthRequest, res: Response): Promise<void> => {
  await syncReviewQueueForProfile(req.params.profileId as string);
  res.status(200).json({ success: true, message: "Review queue synced" });
};