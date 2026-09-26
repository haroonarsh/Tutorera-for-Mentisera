import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../types";
import Request from "../models/Request.model";
import Bid from "../models/Bid.model";
import SafetyCase from "../models/SafetyCase.model";
import RequestStatusHistory from "../models/RequestStatusHistory.model";
import { logAudit } from "../utils/logAudit";
import { sendNotification } from "../utils/socket";

const ACTIVE = ["open", "published", "receiving_offers", "negotiating"];
const TERMINAL = ["booked", "in_progress", "completed", "archived"];
type RequestAction = "approve" | "reject" | "cancel" | "hold" | "restore" | "resolve_dispute";

export const moderateRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  const action = req.body?.action as RequestAction;
  const reason = typeof req.body?.reason === "string" ? req.body.reason.trim() : "";
  const safetyCaseId = req.body?.safetyCaseId as string | undefined;
  if (!(["approve", "reject", "cancel", "hold", "restore", "resolve_dispute"] as string[]).includes(action)) { res.status(422).json({ success: false, message: "A valid request moderation action is required." }); return; }
  if (!reason || reason.length > 1000) { res.status(422).json({ success: false, message: "A reason of up to 1,000 characters is required." }); return; }
  const request = await Request.findById(req.params.id);
  if (!request || (req.countryScopeCode && request.countryCode !== req.countryScopeCode)) { res.status(404).json({ success: false, message: "Tuition request not found." }); return; }
  if (TERMINAL.includes(request.status) && action !== "resolve_dispute") { res.status(409).json({ success: false, message: "This request cannot be moderated in its current lifecycle state." }); return; }
  let safetyCase: any;
  if (safetyCaseId) {
    if (!mongoose.isValidObjectId(safetyCaseId)) { res.status(422).json({ success: false, message: "Invalid safety case." }); return; }
    safetyCase = await SafetyCase.findOne({ _id: safetyCaseId, request: request._id });
    if (!safetyCase) { res.status(422).json({ success: false, message: "The safety case must be linked to this request." }); return; }
  }
  if (["reject", "cancel", "resolve_dispute"].includes(action) && !safetyCase) { res.status(422).json({ success: false, message: "A linked safety case is required for this action." }); return; }
  const prior = request.status;
  if (action === "approve" && !ACTIVE.includes(prior)) { res.status(409).json({ success: false, message: "Only an active request can be approved." }); return; }
  if (action === "hold" && !ACTIVE.includes(prior)) { res.status(409).json({ success: false, message: "Only an active request can be placed on hold." }); return; }
  if (action === "restore" && request.moderationStatus !== "held") { res.status(409).json({ success: false, message: "Only a held request can be restored." }); return; }
  if (action === "resolve_dispute" && request.status !== "disputed") { res.status(409).json({ success: false, message: "Only a disputed request can be resolved here." }); return; }

  let nextStatus = prior;
  let moderationStatus: any = request.moderationStatus || "none";
  if (action === "approve") moderationStatus = "approved";
  if (action === "hold") { request.moderationPreviousStatus = prior; nextStatus = "closed"; moderationStatus = "held"; }
  if (action === "restore") { nextStatus = request.moderationPreviousStatus && ACTIVE.includes(request.moderationPreviousStatus) ? request.moderationPreviousStatus as any : "open"; request.moderationPreviousStatus = undefined; moderationStatus = "approved"; }
  if (action === "reject") { nextStatus = "cancelled"; moderationStatus = "rejected"; }
  if (action === "cancel") { nextStatus = "cancelled"; moderationStatus = "cancelled"; }
  if (action === "resolve_dispute") { nextStatus = req.body?.resolutionStatus === "cancelled" ? "cancelled" : "closed"; moderationStatus = nextStatus === "cancelled" ? "cancelled" : "approved"; }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      request.status = nextStatus as any;
      request.moderationStatus = moderationStatus;
      request.moderationReason = reason;
      request.moderatedBy = req.user?._id;
      request.moderatedAt = new Date();
      request.moderationCase = safetyCase?._id;
      await request.save({ session });
      if (["hold", "reject", "cancel"].includes(action) || (action === "resolve_dispute" && nextStatus === "cancelled")) {
        await Bid.updateMany({ request: request._id, status: { $in: ["pending", "submitted", "viewed", "countered"] } }, { $set: { status: "not_selected" } }, { session });
      }
      await RequestStatusHistory.create([{ request: request._id, fromStatus: prior, toStatus: nextStatus, action, reason, actor: req.user?._id, safetyCase: safetyCase?._id }], { session });
    });
  } finally { await session.endSession(); }
  await logAudit({ action: `request_${action}`, actor: req.user?.name, actorId: req.user?._id?.toString(), entity: "Request", targetId: request._id.toString(), metadata: { reason, fromStatus: prior, toStatus: nextStatus, safetyCaseId } });
  await sendNotification(req.app.get("io"), request.student.toString(), { title: "Tuition request update", message: `Your ${request.subject} request was ${action === "hold" ? "placed on hold" : action === "restore" ? "restored" : action}. ${reason}`, type: "general", link: "/dashboard" });
  res.json({ success: true, request });
};

export const getRequestModerationHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  const request = await Request.findById(req.params.id).select("countryCode").lean();
  if (!request || (req.countryScopeCode && request.countryCode !== req.countryScopeCode)) { res.status(404).json({ success: false, message: "Tuition request not found." }); return; }
  const history = await RequestStatusHistory.find({ request: request._id }).populate("actor", "name email").populate("safetyCase", "caseId status").sort("-createdAt").lean();
  res.json({ success: true, history });
};
