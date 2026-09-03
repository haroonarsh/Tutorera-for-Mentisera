import { Response } from "express";
import { AuthRequest } from "../types";
import User from "../models/User.model";
import TutorProfile from "../models/TutorProfile.model";
import TutorApplicationStatusHistory from "../models/TutorApplicationStatusHistory.model";
import { logAudit } from "../utils/logAudit";
import { sendNotification } from "../utils/socket";
import sendEmail from "../utils/sendEmail";
import {
  buildAuthenticatedTrackingPayload,
  buildPublicTrackingPayload,
  generateTrackingToken,
  hashTrackingToken,
  isHomeTuitionEligible,
  isMarketplaceEligible,
  recordStatusEvent,
  policeIsRequired,
} from "../services/tracking.service";
import {
  applicationSubmittedEmail,
  cnicRejectedEmail,
  cnicVerifiedEmail,
  demoVideoApprovedEmail,
  demoVideoRejectedEmail,
  educationalDocumentsRejectedEmail,
  educationalDocumentsVerifiedEmail,
  homeTuitionActivatedEmail,
  homeTuitionDeactivatedEmail,
  marketplaceActivatedEmail,
  marketplaceDeactivatedEmail,
  policeRejectedEmail,
  policeVerifiedEmail,
  profileSuspendedEmail,
  reVerificationRequiredEmail,
  trackingWelcomeEmail,
} from "../utils/trackingEmails";


const TRACKING_BASE_URL = process.env.CLIENT_URL || "https://tutorera.ac.pk";
const APPLICATION_STATUS_URL = `${TRACKING_BASE_URL}/tutor/application-status`;

function ctaArgs(user: { applicationId?: string; name: string }) {
  return {
    applicationId: user.applicationId || "TUT-PENDING",
    statusUrl: APPLICATION_STATUS_URL,
  };
}

function maskIp(ip: string | undefined): string {
  if (!ip) return "unknown";
  const parts = ip.split(".");
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
  return "redacted";
}

async function sendEmailSafely(build: () => { subject: string; html: string }, to: string) {
  try {
    const { subject, html } = build();
    await sendEmail({ to, subject, html });
  } catch (err) {
    console.error("[Tracking] Failed to send email:", err);
  }
}

async function notifyTutor(
  req: AuthRequest,
  userId: string,
  notification: { title: string; message: string; link: string; type: "verification" | "general" }
) {
  try {
    const io = req.app.get("io");
    await sendNotification(io, userId, notification);
  } catch (err) {
    console.error("[Tracking] Failed to send notification:", err);
  }
}

// ─── Tutor-facing endpoints ───────────────────────────────────────────────────

export const getApplicationStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Authentication required" });
    return;
  }
  const payload = await buildAuthenticatedTrackingPayload(req.user._id.toString());
  if (!payload) {
    res.status(404).json({ success: false, message: "Tutor profile not found" });
    return;
  }
  res.status(200).json({ success: true, payload });
};

export const rotateTrackingToken = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Authentication required" });
    return;
  }
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404).json({ success: false, message: "User not found" });
    return;
  }
  const profile = await TutorProfile.findOne({ user: user._id });
  const t = generateTrackingToken();
  user.trackingTokenHash = t.hash;
  user.trackingTokenCreatedAt = user.trackingTokenCreatedAt || new Date();
  user.trackingTokenRotatedAt = new Date();
  await user.save();

  await recordStatusEvent({
    tutorId: user._id.toString(),
    tutorProfileId: profile?._id.toString(),
    actor: { name: user.name, role: "tutor", id: user._id.toString() },
    event: "TOKEN_ROTATED",
    message: "Tracking link rotated",
    isPublic: false,
  });

  await logAudit({
    action: "tracking_token_rotated",
    actor: user.name,
    actorId: user._id.toString(),
    entity: "User",
    targetId: user._id.toString(),
    targetName: user.name,
  });

  res.status(200).json({
    success: true,
    message: "Tracking link rotated. Save the new URL — the old one no longer works.",
    trackingToken: t.plaintext,
    trackingUrl: `${TRACKING_BASE_URL}/track/tutor/${t.plaintext}`,
  });
};

// ─── Public token endpoint ────────────────────────────────────────────────────

export const getPublicTracking = async (req: AuthRequest, res: Response): Promise<void> => {
  const token = String(req.params.token || "");
  if (!token) {
    res.status(404).json({ success: false, message: "Tracking link not found" });
    return;
  }
  const payload = await buildPublicTrackingPayload(token);
  if (!payload) {
    res.status(404).json({ success: false, message: "Tracking link not found" });
    return;
  }
  await logAudit({
    action: "tracking_view",
    actor: "Public",
    entity: "TutorProfile",
    targetId: payload.applicationId,
    targetName: payload.tutorName,
    metadata: { ip: maskIp(req.ip), ua: req.headers["user-agent"]?.toString().slice(0, 80) },
  });
  res.status(200).json({ success: true, payload });
};

// ─── Admin per-component endpoints ────────────────────────────────────────────

async function ensureAdmin(req: AuthRequest, res: Response): Promise<boolean> {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ success: false, message: "Admin access required" });
    return false;
  }
  return true;
}

async function loadProfileOr404(req: AuthRequest, res: Response): Promise<{ user: any; profile: any } | null> {
  if (!(await ensureAdmin(req, res))) return null;
  const profile = await TutorProfile.findById(req.params.id);
  if (!profile) {
    res.status(404).json({ success: false, message: "Tutor profile not found" });
    return null;
  }
  const user = await User.findById(profile.user);
  if (!user) {
    res.status(404).json({ success: false, message: "Tutor user not found" });
    return null;
  }
  return { user, profile };
}

function actorFromReq(req: AuthRequest) {
  return {
    name: req.user?.name || "Admin",
    role: "admin" as const,
    id: req.user?._id?.toString(),
  };
}

export const listApplications = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!(await ensureAdmin(req, res))) return;
  const { status, marketplace, homeTuition, search, from, to, page = "1", limit = "20" } = req.query;
  const filter: Record<string, unknown> = {};
  const profileFilter: Record<string, unknown> = {};

  if (status && status !== "all") {
    const map: Record<string, Record<string, unknown>> = {
      APPLICATION_STARTED: { onboardingStep: 1, onboardingComplete: false },
      DOCUMENTS_REQUIRED: { onboardingComplete: false, onboardingStep: { $gt: 1 } },
      APPLICATION_SUBMITTED: { onboardingComplete: true, verificationStatus: "pending" },
      UNDER_REVIEW: { verificationStatus: "pending" },
      ACTION_REQUIRED: { $or: [
        { cnicVerificationStatus: "rejected" },
        { degreeVerificationStatus: "rejected" },
        { demoVideoStatus: "rejected" },
        { policeVerificationStatus: "rejected" },
      ] },
      VERIFICATION_IN_PROGRESS: { $or: [
        { cnicVerificationStatus: "pending" },
        { degreeVerificationStatus: "pending" },
        { demoVideoStatus: "pending" },
        { policeVerificationStatus: "pending" },
      ] },
      APPROVED_FOR_MARKETPLACE: { verificationStatus: "approved" },
      HOME_TUITION_VERIFICATION_REQUIRED: { verificationStatus: "approved", policeVerificationStatus: { $in: ["not_submitted", "pending", "rejected"] } },
      HOME_TUITION_ELIGIBLE: { policeVerificationStatus: "approved" },
      REJECTED: { verificationStatus: "rejected" },
      SUSPENDED: { suspendedAt: { $exists: true, $ne: null } },
      RE_VERIFICATION_REQUIRED: { reVerificationRequired: true },
    };
    Object.assign(profileFilter, map[String(status)] || {});
  }
  if (marketplace === "eligible") Object.assign(profileFilter, { demoVideoStatus: "approved", cnicVerificationStatus: "approved", verificationStatus: "approved" });
  if (marketplace === "blocked") Object.assign(profileFilter, { $or: [{ demoVideoStatus: { $ne: "approved" } }, { cnicVerificationStatus: { $ne: "approved" } }, { verificationStatus: { $ne: "approved" } }] });
  if (homeTuition === "eligible") Object.assign(profileFilter, { policeVerificationStatus: "approved" });
  if (homeTuition === "blocked") Object.assign(profileFilter, { policeVerificationStatus: { $ne: "approved" }, teachingMode: { $in: ["in-person", "both"] } });

  if (from) Object.assign(profileFilter, { createdAt: { ...((profileFilter.createdAt as object) || {}), $gte: new Date(String(from)) } });
  if (to) Object.assign(profileFilter, { createdAt: { ...((profileFilter.createdAt as object) || {}), $lte: new Date(String(to)) } });

  const pageNum = Math.max(1, parseInt(String(page)) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(String(limit)) || 20));
  const skip = (pageNum - 1) * limitNum;

  let userQuery: Record<string, unknown> = { role: "tutor" };
  if (search) {
    const pattern = new RegExp(String(search), "i");
    const matchingUsers = await User.find({ $or: [{ name: pattern }, { applicationId: String(search).toUpperCase() }] }).select("_id");
    userQuery = { ...userQuery, _id: { $in: matchingUsers.map(u => u._id) } };
  }

  const userIds = (await User.find(userQuery).select("_id applicationId name createdAt").lean()).map(u => u._id);
  const finalFilter = { ...profileFilter, user: { $in: userIds } };

  const [total, profiles] = await Promise.all([
    TutorProfile.countDocuments(finalFilter),
    TutorProfile.find(finalFilter)
      .populate("user", "name email phone city applicationId createdAt isActive")
      .sort("-updatedAt")
      .skip(skip)
      .limit(limitNum),
  ]);

  const rows = profiles.map(p => {
    const user = p.user as any;
    return {
      _id: p._id,
      applicationId: user?.applicationId,
      tutorName: user?.name,
      tutorEmail: user?.email,
      tutorUserId: user?._id,
      canonicalStatus: p.suspendedAt ? "SUSPENDED" :
        p.reVerificationRequired ? "RE_VERIFICATION_REQUIRED" :
        p.verificationStatus === "rejected" ? "REJECTED" :
        isHomeTuitionEligible(p) ? "HOME_TUITION_ELIGIBLE" :
        isMarketplaceEligible(p) ? (policeIsRequired(p) ? "HOME_TUITION_VERIFICATION_REQUIRED" : "APPROVED_FOR_MARKETPLACE") :
        (p.cnicVerificationStatus === "rejected" || p.degreeVerificationStatus === "rejected" || p.demoVideoStatus === "rejected" || p.policeVerificationStatus === "rejected") ? "ACTION_REQUIRED" :
        p.onboardingComplete ? "UNDER_REVIEW" : "APPLICATION_STARTED",
      submittedAt: p.createdAt,
      lastUpdated: p.updatedAt,
      progress: computeSimpleProgress(p),
      marketplaceEligible: isMarketplaceEligible(p),
      homeTuitionEligible: isHomeTuitionEligible(p),
      teachingMode: p.teachingMode,
    };
  });

  res.status(200).json({
    success: true,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    applications: rows,
  });
};

function computeSimpleProgress(profile: any): number {
  let done = 0;
  let total = 5;
  if (profile.fullName && profile.fullName.trim() !== "") done++;
  if (profile.education && profile.education.length > 0 && profile.education[0].degree) done++;
  if (profile.cnicFront && profile.cnicBack) done++;
  if (profile.videoIntro) done++;
  if (profile.policeCertificate) { total++; done++; }
  return Math.round((done / total) * 100);
}

export const getApplicationDetail = async (req: AuthRequest, res: Response): Promise<void> => {
  const data = await loadProfileOr404(req, res);
  if (!data) return;
  const { user, profile } = data;
  const history = await TutorApplicationStatusHistory.find({ tutor: user._id }).sort({ createdAt: -1 }).limit(50);
  res.status(200).json({
    success: true,
    application: {
      applicationId: user.applicationId,
      tutorUserId: user._id,
      tutorName: user.name,
      tutorEmail: user.email,
      isActive: user.isActive,
      profile,
      history: history.map(h => ({
        id: h._id,
        at: h.createdAt,
        event: h.event,
        message: h.message,
        actor: h.actor,
        actorRole: h.actorRole,
      })),
    },
  });
};

export const updateCnic = async (req: AuthRequest, res: Response): Promise<void> => {
  const data = await loadProfileOr404(req, res);
  if (!data) return;
  const { status, reason } = req.body;
  if (!["approved", "rejected", "pending"].includes(status)) {
    res.status(400).json({ success: false, message: "Invalid status" });
    return;
  }
  const { user, profile } = data;
  profile.cnicVerificationStatus = status;
  profile.cnicRejectionReason = status === "rejected" ? (reason || "") : "";
  profile.cnicReviewedAt = new Date();
  profile.lastStatusChangeAt = new Date();
  await profile.save();

  const actor = actorFromReq(req);
  if (status === "approved") {
    await recordStatusEvent({
      tutorId: user._id.toString(),
      tutorProfileId: profile._id.toString(),
      actor,
      event: "CNIC_VERIFIED",
      message: "CNIC verified",
      statusAfter: "approved",
    });
    await sendEmailSafely(() => cnicVerifiedEmail(user.name, ctaArgs(user)), user.email);
    await notifyTutor(req, user._id.toString(), { title: "🛡️ CNIC verified", message: "Your ID verification is complete.", link: "/tutor/application-status", type: "verification" });
  } else if (status === "rejected") {
    await recordStatusEvent({
      tutorId: user._id.toString(),
      tutorProfileId: profile._id.toString(),
      actor,
      event: "CNIC_REJECTED",
      message: `CNIC needs to be re-uploaded${reason ? `: ${reason}` : ""}`,
      statusAfter: "rejected",
    });
    await sendEmailSafely(() => cnicRejectedEmail(user.name, reason || "", ctaArgs(user)), user.email);
    await notifyTutor(req, user._id.toString(), { title: "Action required: CNIC re-upload", message: reason || "Please re-upload your CNIC.", link: "/tutor/application-status", type: "verification" });
  }
  await logAudit({
    action: `cnic_${status}`,
    actor: actor.name,
    actorId: actor.id,
    entity: "TutorProfile",
    targetId: profile._id.toString(),
    targetName: user.name,
    metadata: reason ? { reason } : undefined,
  });
  await syncMarketplaceAndHomeTuition(req, user, profile);
  res.status(200).json({ success: true, profile });
};

export const updateDegree = async (req: AuthRequest, res: Response): Promise<void> => {
  const data = await loadProfileOr404(req, res);
  if (!data) return;
  const { status, reason } = req.body;
  if (!["approved", "rejected", "pending"].includes(status)) {
    res.status(400).json({ success: false, message: "Invalid status" });
    return;
  }
  const { user, profile } = data;
  profile.degreeVerificationStatus = status;
  profile.degreeRejectionReason = status === "rejected" ? (reason || "") : "";
  profile.degreeReviewedAt = new Date();
  profile.lastStatusChangeAt = new Date();
  await profile.save();

  const actor = actorFromReq(req);
  if (status === "approved") {
    await recordStatusEvent({ tutorId: user._id.toString(), tutorProfileId: profile._id.toString(), actor, event: "EDUCATIONAL_DOCUMENTS_VERIFIED", message: "Educational documents verified", statusAfter: "approved" });
    await sendEmailSafely(() => educationalDocumentsVerifiedEmail(user.name, ctaArgs(user)), user.email);
    await notifyTutor(req, user._id.toString(), { title: "Educational documents verified ✅", message: "Your educational documents are verified.", link: "/tutor/application-status", type: "verification" });
  } else if (status === "rejected") {
    await recordStatusEvent({ tutorId: user._id.toString(), tutorProfileId: profile._id.toString(), actor, event: "EDUCATIONAL_DOCUMENTS_REJECTED", message: `Educational documents rejected${reason ? `: ${reason}` : ""}`, statusAfter: "rejected" });
    await sendEmailSafely(() => educationalDocumentsRejectedEmail(user.name, reason || "", ctaArgs(user)), user.email);
    await notifyTutor(req, user._id.toString(), { title: "Action required: Educational documents", message: reason || "Please re-upload your documents.", link: "/tutor/application-status", type: "verification" });
  }
  await logAudit({ action: `degree_${status}`, actor: actor.name, actorId: actor.id, entity: "TutorProfile", targetId: profile._id.toString(), targetName: user.name, metadata: reason ? { reason } : undefined });
  await syncMarketplaceAndHomeTuition(req, user, profile);
  res.status(200).json({ success: true, profile });
};

export const updateDemoVideo = async (req: AuthRequest, res: Response): Promise<void> => {
  const data = await loadProfileOr404(req, res);
  if (!data) return;
  const { status, reason } = req.body;
  if (!["approved", "rejected", "pending"].includes(status)) {
    res.status(400).json({ success: false, message: "Invalid status" });
    return;
  }
  const { user, profile } = data;
  profile.demoVideoStatus = status;
  profile.demoVideoRejectionReason = status === "rejected" ? (reason || "") : "";
  profile.demoVideoReviewedAt = new Date();
  profile.lastStatusChangeAt = new Date();
  await profile.save();

  const actor = actorFromReq(req);
  if (status === "approved") {
    await recordStatusEvent({ tutorId: user._id.toString(), tutorProfileId: profile._id.toString(), actor, event: "DEMO_VIDEO_APPROVED", message: "Demo video approved", statusAfter: "approved" });
    await sendEmailSafely(() => demoVideoApprovedEmail(user.name, ctaArgs(user)), user.email);
    await notifyTutor(req, user._id.toString(), { title: "Demo video approved 🎬", message: "Your demo video is live on your public profile.", link: "/tutor/application-status", type: "verification" });
  } else if (status === "rejected") {
    await recordStatusEvent({ tutorId: user._id.toString(), tutorProfileId: profile._id.toString(), actor, event: "DEMO_VIDEO_REJECTED", message: `Demo video rejected${reason ? `: ${reason}` : ""}`, statusAfter: "rejected" });
    await sendEmailSafely(() => demoVideoRejectedEmail(user.name, reason || "", ctaArgs(user)), user.email);
    await notifyTutor(req, user._id.toString(), { title: "Action required: Demo video", message: reason || "Please re-record your demo video.", link: "/tutor/application-status", type: "verification" });
  }
  await logAudit({ action: `demo_video_${status}`, actor: actor.name, actorId: actor.id, entity: "TutorProfile", targetId: profile._id.toString(), targetName: user.name, metadata: reason ? { reason } : undefined });
  await syncMarketplaceAndHomeTuition(req, user, profile);
  res.status(200).json({ success: true, profile });
};

export const updatePolice = async (req: AuthRequest, res: Response): Promise<void> => {
  const data = await loadProfileOr404(req, res);
  if (!data) return;
  const { status, reason } = req.body;
  if (!["approved", "rejected", "pending"].includes(status)) {
    res.status(400).json({ success: false, message: "Invalid status" });
    return;
  }
  const { user, profile } = data;
  profile.policeVerificationStatus = status;
  profile.policeRejectionReason = status === "rejected" ? (reason || "") : "";
  profile.policeReviewedAt = new Date();
  profile.lastStatusChangeAt = new Date();
  await profile.save();

  const actor = actorFromReq(req);
  if (status === "approved") {
    await recordStatusEvent({ tutorId: user._id.toString(), tutorProfileId: profile._id.toString(), actor, event: "POLICE_VERIFICATION_APPROVED", message: "Police verification approved", statusAfter: "approved" });
    await sendEmailSafely(() => policeVerifiedEmail(user.name, ctaArgs(user)), user.email);
    await notifyTutor(req, user._id.toString(), { title: "Police verification approved 🛡️", message: "You can now offer Home and In-Person Tuition.", link: "/tutor/application-status", type: "verification" });
  } else if (status === "rejected") {
    await recordStatusEvent({ tutorId: user._id.toString(), tutorProfileId: profile._id.toString(), actor, event: "POLICE_VERIFICATION_REJECTED", message: `Police verification rejected${reason ? `: ${reason}` : ""}`, statusAfter: "rejected" });
    await sendEmailSafely(() => policeRejectedEmail(user.name, reason || "", ctaArgs(user)), user.email);
    await notifyTutor(req, user._id.toString(), { title: "Action required: Police verification", message: reason || "Please re-submit your police certificate.", link: "/tutor/application-status", type: "verification" });
  }
  await logAudit({ action: `police_${status}`, actor: actor.name, actorId: actor.id, entity: "TutorProfile", targetId: profile._id.toString(), targetName: user.name, metadata: reason ? { reason } : undefined });
  await syncMarketplaceAndHomeTuition(req, user, profile);
  res.status(200).json({ success: true, profile });
};

export const setMarketplaceEligibility = async (req: AuthRequest, res: Response): Promise<void> => {
  const data = await loadProfileOr404(req, res);
  if (!data) return;
  const { eligible, reason } = req.body;
  if (typeof eligible !== "boolean") {
    res.status(400).json({ success: false, message: "eligible must be boolean" });
    return;
  }
  const { user, profile } = data;
  const wasEligible = profile.marketplaceEligible;
  profile.marketplaceEligible = eligible;
  if (eligible) {
    profile.marketplaceEligibleAt = profile.marketplaceEligibleAt || new Date();
  } else {
    profile.marketplaceEligibleAt = undefined as any;
  }
  profile.lastStatusChangeAt = new Date();
  await profile.save();

  const actor = actorFromReq(req);
  if (eligible && !wasEligible) {
    await recordStatusEvent({ tutorId: user._id.toString(), tutorProfileId: profile._id.toString(), actor, event: "MARKETPLACE_ACTIVATED", message: "Marketplace profile activated" });
    await sendEmailSafely(() => marketplaceActivatedEmail(user.name, ctaArgs(user)), user.email);
    await notifyTutor(req, user._id.toString(), { title: "🎉 You're live on TUTORERA", message: "Your profile is now active on the marketplace.", link: "/tutor/application-status", type: "verification" });
  } else if (!eligible && wasEligible) {
    await recordStatusEvent({ tutorId: user._id.toString(), tutorProfileId: profile._id.toString(), actor, event: "MARKETPLACE_DEACTIVATED", message: `Marketplace profile deactivated${reason ? `: ${reason}` : ""}` });
    await sendEmailSafely(() => marketplaceDeactivatedEmail(user.name, reason || "", ctaArgs(user)), user.email);
    await notifyTutor(req, user._id.toString(), { title: "Marketplace visibility paused", message: reason || "Your marketplace visibility has been paused.", link: "/tutor/application-status", type: "verification" });
  }
  await logAudit({ action: `marketplace_${eligible ? "activated" : "deactivated"}`, actor: actor.name, actorId: actor.id, entity: "TutorProfile", targetId: profile._id.toString(), targetName: user.name, metadata: reason ? { reason } : undefined });
  res.status(200).json({ success: true, profile });
};

export const setHomeTuitionEligibility = async (req: AuthRequest, res: Response): Promise<void> => {
  const data = await loadProfileOr404(req, res);
  if (!data) return;
  const { eligible, reason } = req.body;
  if (typeof eligible !== "boolean") {
    res.status(400).json({ success: false, message: "eligible must be boolean" });
    return;
  }
  const { user, profile } = data;
  const wasEligible = profile.homeTuitionEligible;
  profile.homeTuitionEligible = eligible;
  if (eligible) {
    profile.homeTuitionEligibleAt = profile.homeTuitionEligibleAt || new Date();
  } else {
    profile.homeTuitionEligibleAt = undefined as any;
  }
  profile.lastStatusChangeAt = new Date();
  await profile.save();

  const actor = actorFromReq(req);
  if (eligible && !wasEligible) {
    await recordStatusEvent({ tutorId: user._id.toString(), tutorProfileId: profile._id.toString(), actor, event: "HOME_TUITION_ACTIVATED", message: "Home tuition eligibility activated" });
    await sendEmailSafely(() => homeTuitionActivatedEmail(user.name, ctaArgs(user)), user.email);
    await notifyTutor(req, user._id.toString(), { title: "Home tuition approved 🏠", message: "You are eligible to respond to Home and In-Person Tuition opportunities.", link: "/tutor/application-status", type: "verification" });
  }
  if (!eligible && wasEligible) {
    await recordStatusEvent({ tutorId: user._id.toString(), tutorProfileId: profile._id.toString(), actor, event: "HOME_TUITION_DEACTIVATED", message: `Home tuition eligibility deactivated${reason ? `: ${reason}` : ""}` });
    await sendEmailSafely(() => homeTuitionDeactivatedEmail(user.name, reason || "Your Home and In-Person Tuition eligibility has been paused.", ctaArgs(user)), user.email);
    await notifyTutor(req, user._id.toString(), { title: "Home tuition paused", message: reason || "Your Home and In-Person Tuition eligibility has been paused.", link: "/tutor/application-status", type: "verification" });
  }
  await logAudit({ action: `home_tuition_${eligible ? "activated" : "deactivated"}`, actor: actor.name, actorId: actor.id, entity: "TutorProfile", targetId: profile._id.toString(), targetName: user.name, metadata: reason ? { reason } : undefined });
  res.status(200).json({ success: true, profile });
};

export const setSuspended = async (req: AuthRequest, res: Response): Promise<void> => {
  const data = await loadProfileOr404(req, res);
  if (!data) return;
  const { suspended, reason } = req.body;
  if (typeof suspended !== "boolean") {
    res.status(400).json({ success: false, message: "suspended must be boolean" });
    return;
  }
  const { user, profile } = data;
  const wasSuspended = Boolean(profile.suspendedAt);
  if (suspended) {
    profile.suspendedAt = new Date();
    profile.suspendedReason = reason || "";
    profile.marketplaceEligible = false;
    profile.homeTuitionEligible = false;
  } else {
    profile.suspendedAt = undefined as any;
    profile.suspendedReason = "";
  }
  profile.lastStatusChangeAt = new Date();
  await profile.save();

  const actor = actorFromReq(req);
  if (suspended && !wasSuspended) {
    await recordStatusEvent({ tutorId: user._id.toString(), tutorProfileId: profile._id.toString(), actor, event: "PROFILE_SUSPENDED", message: `Profile suspended${reason ? `: ${reason}` : ""}` });
    await sendEmailSafely(() => profileSuspendedEmail(user.name, reason || "", ctaArgs(user)), user.email);
    await notifyTutor(req, user._id.toString(), { title: "Profile suspended", message: reason || "Your profile has been suspended.", link: "/tutor/application-status", type: "verification" });
  } else if (!suspended && wasSuspended) {
    await recordStatusEvent({ tutorId: user._id.toString(), tutorProfileId: profile._id.toString(), actor, event: "PROFILE_UNSUSPENDED", message: "Profile re-instated" });
    await notifyTutor(req, user._id.toString(), { title: "Profile re-instated", message: "Your profile is active again.", link: "/tutor/application-status", type: "verification" });
  }
  await logAudit({ action: suspended ? "profile_suspended" : "profile_unsuspended", actor: actor.name, actorId: actor.id, entity: "TutorProfile", targetId: profile._id.toString(), targetName: user.name, metadata: reason ? { reason } : undefined });
  res.status(200).json({ success: true, profile });
};

export const setReverification = async (req: AuthRequest, res: Response): Promise<void> => {
  const data = await loadProfileOr404(req, res);
  if (!data) return;
  const { required, reason } = req.body;
  if (typeof required !== "boolean") {
    res.status(400).json({ success: false, message: "required must be boolean" });
    return;
  }
  const { user, profile } = data;
  profile.reVerificationRequired = required;
  profile.reVerificationReason = required ? (reason || "") : "";
  profile.lastStatusChangeAt = new Date();
  await profile.save();

  const actor = actorFromReq(req);
  if (required) {
    await recordStatusEvent({ tutorId: user._id.toString(), tutorProfileId: profile._id.toString(), actor, event: "RE_VERIFICATION_REQUESTED", message: `Re-verification requested${reason ? `: ${reason}` : ""}` });
    await sendEmailSafely(() => reVerificationRequiredEmail(user.name, reason || "", ctaArgs(user)), user.email);
    await notifyTutor(req, user._id.toString(), { title: "Re-verification required", message: reason || "Please re-submit your verification.", link: "/tutor/application-status", type: "verification" });
  }
  await logAudit({ action: `re_verification_${required ? "requested" : "cleared"}`, actor: actor.name, actorId: actor.id, entity: "TutorProfile", targetId: profile._id.toString(), targetName: user.name, metadata: reason ? { reason } : undefined });
  res.status(200).json({ success: true, profile });
};

export const getApplicationHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  const data = await loadProfileOr404(req, res);
  if (!data) return;
  const { user } = data;
  const history = await TutorApplicationStatusHistory.find({ tutor: user._id }).sort({ createdAt: -1 }).limit(100);
  res.status(200).json({ success: true, history });
};

async function syncMarketplaceAndHomeTuition(req: AuthRequest, user: any, profile: any) {
  const actor = actorFromReq(req);
  const now = new Date();
  const mpEligible = isMarketplaceEligible(profile);
  const htEligible = isHomeTuitionEligible(profile);
  if (mpEligible && !profile.marketplaceEligible) {
    profile.marketplaceEligible = true;
    profile.marketplaceEligibleAt = now;
    profile.lastStatusChangeAt = now;
    await profile.save();
    await recordStatusEvent({ tutorId: user._id.toString(), tutorProfileId: profile._id.toString(), actor, event: "MARKETPLACE_ACTIVATED", message: "Marketplace profile auto-activated after verification requirements were met" });
    await sendEmailSafely(() => marketplaceActivatedEmail(user.name, ctaArgs(user)), user.email);
    await notifyTutor(req, user._id.toString(), { title: "🎉 You're live on TUTORERA", message: "Your profile is now active on the marketplace.", link: "/tutor/application-status", type: "verification" });
  } else if (!mpEligible && profile.marketplaceEligible) {
    profile.marketplaceEligible = false;
    profile.marketplaceEligibleAt = undefined as any;
    profile.lastStatusChangeAt = now;
    await profile.save();
    await recordStatusEvent({ tutorId: user._id.toString(), tutorProfileId: profile._id.toString(), actor, event: "MARKETPLACE_DEACTIVATED", message: "Marketplace profile auto-deactivated after a verification requirement lapsed" });
    await sendEmailSafely(() => marketplaceDeactivatedEmail(user.name, "Your marketplace access was paused because a verification requirement is no longer met.", ctaArgs(user)), user.email);
    await notifyTutor(req, user._id.toString(), { title: "Marketplace visibility paused", message: "Your marketplace access was paused because a verification requirement is no longer met.", link: "/tutor/application-status", type: "verification" });
  }
  if (htEligible && !profile.homeTuitionEligible) {
    profile.homeTuitionEligible = true;
    profile.homeTuitionEligibleAt = now;
    profile.lastStatusChangeAt = now;
    await profile.save();
    await recordStatusEvent({ tutorId: user._id.toString(), tutorProfileId: profile._id.toString(), actor, event: "HOME_TUITION_ACTIVATED", message: "Home tuition eligibility auto-activated" });
    await sendEmailSafely(() => homeTuitionActivatedEmail(user.name, ctaArgs(user)), user.email);
    await notifyTutor(req, user._id.toString(), { title: "Home tuition approved 🏠", message: "You are eligible to respond to Home and In-Person Tuition opportunities.", link: "/tutor/application-status", type: "verification" });
  } else if (!htEligible && profile.homeTuitionEligible) {
    profile.homeTuitionEligible = false;
    profile.homeTuitionEligibleAt = undefined as any;
    profile.lastStatusChangeAt = now;
    await profile.save();
    await recordStatusEvent({ tutorId: user._id.toString(), tutorProfileId: profile._id.toString(), actor, event: "HOME_TUITION_DEACTIVATED", message: "Home tuition eligibility auto-deactivated after a verification requirement lapsed" });
    await sendEmailSafely(() => homeTuitionDeactivatedEmail(user.name, "Your home tuition access was paused because a verification requirement is no longer met.", ctaArgs(user)), user.email);
    await notifyTutor(req, user._id.toString(), { title: "Home tuition paused", message: "Your home tuition access was paused because a verification requirement is no longer met.", link: "/tutor/application-status", type: "verification" });
  }
}
