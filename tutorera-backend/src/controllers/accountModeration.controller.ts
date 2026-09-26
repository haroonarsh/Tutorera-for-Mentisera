import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../types";
import User from "../models/User.model";
import AccountEnforcement from "../models/AccountEnforcement.model";
import SafetyCase from "../models/SafetyCase.model";
import { hasPermission, Permission } from "../config/rbac";
import { logAudit } from "../utils/logAudit";

type EnforcementAction = "suspend" | "ban" | "reinstate" | "delete";
const permissionFor: Record<EnforcementAction, Permission> = { suspend: "users.suspend", ban: "users.ban", reinstate: "users.reinstate", delete: "users.delete" };

function canManageTarget(req: AuthRequest, target: any, permission: Permission): string | null {
  if (!hasPermission(req.user?.adminRole, req.user?.adminPermissions, permission)) return "You do not have permission for this enforcement action.";
  if (target._id.toString() === req.user?._id?.toString()) return "You cannot moderate your own account.";
  if (target.role === "admin" && req.user?.adminRole !== "super_admin") return "Only a super administrator may moderate an administrator.";
  if (target.role === "admin" && target.adminRole === "super_admin" && req.user?.adminRole !== "super_admin") return "Only a super administrator may moderate another super administrator.";
  return null;
}

export const enforceAccountAction = async (req: AuthRequest, res: Response): Promise<void> => {
  const action = req.body?.action as EnforcementAction;
  const reason = typeof req.body?.reason === "string" ? req.body.reason.trim() : "";
  const safetyCaseId = req.body?.safetyCaseId as string | undefined;
  const suspendedUntil = req.body?.suspendedUntil ? new Date(req.body.suspendedUntil) : undefined;
  if (!(["suspend", "ban", "reinstate", "delete"] as string[]).includes(action)) { res.status(422).json({ success: false, message: "A valid enforcement action is required." }); return; }
  if (!reason || reason.length > 1000) { res.status(422).json({ success: false, message: "A reason of up to 1,000 characters is required." }); return; }
  if (action === "suspend" && suspendedUntil && (Number.isNaN(suspendedUntil.getTime()) || suspendedUntil <= new Date())) { res.status(422).json({ success: false, message: "Suspension expiry must be in the future." }); return; }
  const target = await User.findById(req.params.id);
  if (!target) { res.status(404).json({ success: false, message: "User not found." }); return; }
  const denied = canManageTarget(req, target, permissionFor[action]);
  if (denied) { res.status(403).json({ success: false, message: denied }); return; }
  if (req.countryScopeCode && target.countryCode !== req.countryScopeCode) { res.status(404).json({ success: false, message: "User not found." }); return; }
  let safetyCase: any;
  if (safetyCaseId) {
    if (!mongoose.isValidObjectId(safetyCaseId)) { res.status(422).json({ success: false, message: "Invalid safety case." }); return; }
    safetyCase = await SafetyCase.findOne({ _id: safetyCaseId, reportedUser: target._id });
    if (!safetyCase) { res.status(422).json({ success: false, message: "The safety case must belong to this user." }); return; }
  }
  if ((action === "ban" || action === "delete") && !safetyCaseId) { res.status(422).json({ success: false, message: "A safety case is required for a ban or administrative deletion." }); return; }
  if (action === "reinstate" && target.moderationStatus !== "suspended") { res.status(409).json({ success: false, message: "Only suspended accounts can be reinstated." }); return; }
  if (action !== "reinstate" && (target.isDeleted || target.moderationStatus === "deleted")) { res.status(409).json({ success: false, message: "A deleted account cannot be changed." }); return; }
  if (action === "ban" && target.moderationStatus === "banned") { res.status(409).json({ success: false, message: "This account is already banned." }); return; }

  const previousStatus = target.moderationStatus || "active";
  const now = new Date();
  if (action === "suspend") Object.assign(target, { isActive: false, moderationStatus: "suspended", suspendedAt: now, suspendedUntil, bannedAt: undefined, moderationReason: reason, moderatedBy: req.user?._id, moderationCase: safetyCase?._id, sessionInvalidBefore: now });
  if (action === "ban") Object.assign(target, { isActive: false, moderationStatus: "banned", bannedAt: now, suspendedAt: undefined, suspendedUntil: undefined, moderationReason: reason, moderatedBy: req.user?._id, moderationCase: safetyCase?._id, sessionInvalidBefore: now });
  if (action === "reinstate") Object.assign(target, { isActive: true, moderationStatus: "active", suspendedAt: undefined, suspendedUntil: undefined, moderationReason: reason, moderatedBy: req.user?._id, moderationCase: safetyCase?._id, sessionInvalidBefore: now });
  if (action === "delete") Object.assign(target, { isActive: false, isDeleted: true, deletedAt: now, deletedBy: req.user?._id, deletionReason: reason, moderationStatus: "deleted", moderationReason: reason, moderatedBy: req.user?._id, moderationCase: safetyCase?._id, sessionInvalidBefore: now });
  await target.save({ validateBeforeSave: false });
  const event = await AccountEnforcement.create({ user: target._id, action: action === "suspend" ? "suspended" : action === "ban" ? "banned" : action === "reinstate" ? "reinstated" : "deleted", reason, actor: req.user?._id, safetyCase: safetyCase?._id, suspendedUntil, previousStatus, resultingStatus: target.moderationStatus });
  if (safetyCase) { safetyCase.status = "resolved"; safetyCase.actionTaken = action === "suspend" ? "account_suspended" : action === "ban" ? "account_banned" : "none"; safetyCase.resolutionSummary = reason; safetyCase.resolvedAt = now; safetyCase.assignedOfficer = req.user?._id; await safetyCase.save(); }
  const auditAction = action === "suspend" ? "account_suspended" : action === "ban" ? "account_banned" : action === "reinstate" ? "account_reinstated" : "account_deleted";
  await logAudit({ action: auditAction, actor: req.user?.name, actorId: req.user?._id?.toString(), entity: "User", targetId: target._id.toString(), targetName: target.name, metadata: { reason, safetyCaseId, enforcementId: event._id.toString(), previousStatus, resultingStatus: target.moderationStatus, suspendedUntil } });
  res.json({ success: true, user: target, enforcement: event });
};

export const getAccountEnforcementHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  const target = await User.findById(req.params.id).select("countryCode").lean();
  if (!target || (req.countryScopeCode && target.countryCode !== req.countryScopeCode)) { res.status(404).json({ success: false, message: "User not found." }); return; }
  const history = await AccountEnforcement.find({ user: target._id }).populate("actor", "name email").populate("safetyCase", "caseId status").sort("-createdAt").lean();
  res.json({ success: true, history });
};
