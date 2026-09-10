// src/controllers/adminControlTower.controller.ts
// Centralized Controller for Marketplace Control Tower, At-Risk Requests,
// Supply Gaps, Safety Cases, Reconciliation, Markets, and RBAC Roles

import { Response } from "express";
import { AuthRequest } from "../types";
import Request from "../models/Request.model";
import Bid from "../models/Bid.model";
import Booking from "../models/Booking.model";
import TutorProfile from "../models/TutorProfile.model";
import StudentProfile from "../models/StudentProfile.model";
import ParentProfile from "../models/ParentProfile.model";
import User from "../models/User.model";
import SafetyCase from "../models/SafetyCase.model";
import FeeConfig from "../models/FeeConfig.model";
import MarketConfig from "../models/MarketConfig.model";
import Country from "../models/Country.model";
import PaymentLedger from "../models/PaymentLedger.model";
import { AtRiskRequestService } from "../services/atRiskRequest.service";
import { ROLE_PERMISSIONS, ALL_PERMISSIONS, hasPermission, Permission } from "../config/rbac";
import mongoose from "mongoose";
import logger from "../config/logger";
import { logAudit } from "../utils/logAudit";
import { computeCanonicalStatus } from "../services/tracking.service";

// ─── Onboarding operations ────────────────────────────────────────────────

/** Phase-wise tutor pipeline, shared with the application-status state machine. */
export const listTutorOnboarding = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
  const countryCode = String(req.countryScopeCode || req.query.countryCode || "").toUpperCase();
  const userFilter: Record<string, unknown> = { role: "tutor" };
  if (countryCode) userFilter.countryCode = countryCode;
  const users = await User.find(userFilter).select("name email countryCode city accountStatus applicationId applicationSubmittedAt createdAt").lean();
  const profiles = await TutorProfile.find({ user: { $in: users.map((user) => user._id) } }).lean();
  const byUser = new Map(profiles.map((profile) => [profile.user.toString(), profile]));
  const rows = users.map((user: any) => {
    const profile: any = byUser.get(user._id.toString());
    const phase = profile ? computeCanonicalStatus(profile as any) : "APPLICATION_STARTED";
    return {
      userId: user._id, profileId: profile?._id || null, name: user.name, email: user.email,
      countryCode: profile?.countryCode || user.countryCode || null, city: profile?.city || user.city || null,
      applicationId: user.applicationId || null, phase, onboardingStep: profile?.onboardingStep || 1,
      onboardingComplete: Boolean(profile?.onboardingComplete), accountStatus: user.accountStatus || "registered",
      marketplaceEligible: Boolean(profile?.marketplaceEligible), homeTuitionEligible: Boolean(profile?.homeTuitionEligible),
      lastUpdatedAt: profile?.lastStatusChangeAt || profile?.updatedAt || user.createdAt,
      createdAt: user.createdAt,
    };
  });
  const phase = String(req.query.phase || "");
  const search = String(req.query.search || "").trim().toLowerCase();
  const filteredRows = rows.filter((row: any) =>
    (!phase || row.phase === phase) &&
    (!search || [row.name, row.email, row.applicationId, row.city, row.countryCode].filter(Boolean).join(" ").toLowerCase().includes(search))
  ).sort((a: any, b: any) => new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime());
  const summary = rows.reduce<Record<string, number>>((counts, row: any) => { counts[row.phase] = (counts[row.phase] || 0) + 1; return counts; }, {});
  const start = (page - 1) * limit;
  res.json({ success: true, total: filteredRows.length, page, pages: Math.max(1, Math.ceil(filteredRows.length / limit)), summary, rows: filteredRows.slice(start, start + limit) });
};

/** Student demand-readiness pipeline; no duplicate student application is created. */
export const listStudentOnboarding = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
  const countryCode = String(req.countryScopeCode || req.query.countryCode || "").toUpperCase();
  const userFilter: Record<string, unknown> = { role: "student" };
  if (countryCode) userFilter.countryCode = countryCode;
  const users = await User.find(userFilter).select("name email countryCode city accountStatus createdAt").lean();
  const profiles = await StudentProfile.find({ user: { $in: users.map((user) => user._id) } }).lean();
  const byUser = new Map(profiles.map((profile) => [profile.user.toString(), profile]));
  const requestCounts = await Request.aggregate([
    { $match: { student: { $in: users.map((user) => user._id) } } },
    { $group: { _id: "$student", count: { $sum: 1 }, lastRequestAt: { $max: "$createdAt" } } },
  ]);
  const requestsByUser = new Map(requestCounts.map((entry) => [entry._id.toString(), entry]));
  const rows = users.map((user: any) => {
    const profile: any = byUser.get(user._id.toString());
    const requestInfo: any = requestsByUser.get(user._id.toString());
    const phase = requestInfo?.count ? "ACTIVE_REQUESTER" : profile?.onboardingComplete ? "READY_TO_POST" : profile ? "PROFILE_STARTED" : "REGISTERED";
    return {
      userId: user._id, profileId: profile?._id || null, name: user.name, email: user.email,
      countryCode: profile?.countryCode || user.countryCode || null, city: profile?.city || user.city || null,
      phase, onboardingComplete: Boolean(profile?.onboardingComplete), accountStatus: user.accountStatus || "registered",
      requestCount: requestInfo?.count || 0, lastRequestAt: requestInfo?.lastRequestAt || null,
      lastUpdatedAt: profile?.updatedAt || requestInfo?.lastRequestAt || user.createdAt, createdAt: user.createdAt,
    };
  });
  const phase = String(req.query.phase || "");
  const search = String(req.query.search || "").trim().toLowerCase();
  const filteredRows = rows.filter((row: any) =>
    (!phase || row.phase === phase) &&
    (!search || [row.name, row.email, row.city, row.countryCode].filter(Boolean).join(" ").toLowerCase().includes(search))
  ).sort((a: any, b: any) => new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime());
  const summary = rows.reduce<Record<string, number>>((counts, row: any) => { counts[row.phase] = (counts[row.phase] || 0) + 1; return counts; }, {});
  const start = (page - 1) * limit;
  res.json({ success: true, total: filteredRows.length, page, pages: Math.max(1, Math.ceil(filteredRows.length / limit)), summary, rows: filteredRows.slice(start, start + limit) });
};

/** Parent/guardian readiness pipeline, including consented learner links. */
export const listParentOnboarding = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
  const countryCode = String(req.countryScopeCode || req.query.countryCode || "").toUpperCase();
  const userFilter: Record<string, unknown> = { role: "parent" };
  if (countryCode) userFilter.countryCode = countryCode;
  const users = await User.find(userFilter).select("name email countryCode city accountStatus createdAt").lean();
  const profiles = await ParentProfile.find({ user: { $in: users.map((user) => user._id) } }).lean();
  const byUser = new Map(profiles.map((profile) => [profile.user.toString(), profile]));
  const rows = users.map((user: any) => {
    const profile: any = byUser.get(user._id.toString());
    const linkedLearners = profile?.children?.length || 0;
    const phase = !profile ? "REGISTERED" : linkedLearners > 0 ? "LEARNER_LINKED" : "PROFILE_STARTED";
    return {
      userId: user._id, profileId: profile?._id || null, name: user.name, email: user.email,
      countryCode: profile?.countryCode || user.countryCode || null, city: profile?.city || user.city || null,
      phase, linkedLearners, approvalRequiredForBookings: Boolean(profile?.approvalRequiredForBookings),
      accountStatus: user.accountStatus || "registered", lastUpdatedAt: profile?.updatedAt || user.createdAt, createdAt: user.createdAt,
    };
  });
  const phase = String(req.query.phase || "");
  const search = String(req.query.search || "").trim().toLowerCase();
  const filteredRows = rows.filter((row: any) =>
    (!phase || row.phase === phase) &&
    (!search || [row.name, row.email, row.city, row.countryCode].filter(Boolean).join(" ").toLowerCase().includes(search))
  ).sort((a: any, b: any) => new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime());
  const summary = rows.reduce<Record<string, number>>((counts, row: any) => { counts[row.phase] = (counts[row.phase] || 0) + 1; return counts; }, {});
  const start = (page - 1) * limit;
  res.json({ success: true, total: filteredRows.length, page, pages: Math.max(1, Math.ceil(filteredRows.length / limit)), summary, rows: filteredRows.slice(start, start + limit) });
};

// ─── 1. Control Tower Operational Pulse & Action Triage ───────────────────────

export const getControlTowerPulse = async (_req: AuthRequest, res: Response): Promise<void> => {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 3600000);
  const twoDaysAgo = new Date(now.getTime() - 48 * 3600000);
  const expiringCutoff = new Date(now.getTime() + 24 * 3600000);

  const [
    activeRequests,
    successfulBookings,
    zeroOfferRequests,
    expiringToday,
    verificationBacklog,
    failedPayments,
    openSafetyCases,
    atRiskItems,
  ] = await Promise.all([
    Request.countDocuments({
      status: { $in: ["open", "published", "receiving_offers", "negotiating"] },
      expiresAt: { $gt: now },
    }),
    Booking.countDocuments({ status: { $in: ["upcoming", "ongoing", "completed"] } }),
    Request.countDocuments({
      status: { $in: ["open", "published", "receiving_offers"] },
      expiresAt: { $gt: now },
      createdAt: { $lte: dayAgo },
    }),
    Request.countDocuments({
      status: { $in: ["open", "published", "receiving_offers", "negotiating"] },
      expiresAt: { $gt: now, $lte: expiringCutoff },
    }),
    TutorProfile.countDocuments({
      verificationStatus: "pending",
      createdAt: { $lte: twoDaysAgo },
    }),
    Booking.countDocuments({ paymentStatus: "failed" }),
    SafetyCase.countDocuments({ status: { $in: ["open", "under_investigation"] } }),
    AtRiskRequestService.getAtRiskRequests(15, _req.app.get("io")),
  ]);

  // Compile "Requires Action Now" list
  const urgentActions = [];

  if (zeroOfferRequests > 0) {
    urgentActions.push({
      id: "zero-offers",
      type: "liquidity",
      severity: "high",
      title: `${zeroOfferRequests} tuition requests have received no tutor offers >24h`,
      detail: "Students risk abandoning platform without relevant tutor outreach.",
      actionLabel: "Triage Requests",
      link: "/admin/at-risk-requests",
    });
  }

  if (expiringToday > 0) {
    urgentActions.push({
      id: "expiring-today",
      type: "lifecycle",
      severity: "medium",
      title: `${expiringToday} requests expire within 24 hours`,
      detail: "Review pending offers or extend request validity.",
      actionLabel: "Review Expiring",
      link: "/admin/at-risk-requests?filter=expiring",
    });
  }

  if (verificationBacklog > 0) {
    urgentActions.push({
      id: "verification-sla",
      type: "verification",
      severity: "high",
      title: `${verificationBacklog} tutor applications exceed 48-hour review SLA`,
      detail: "Tutors are waiting for marketplace credential approval.",
      actionLabel: "Review Tutors",
      link: "/admin/applications?status=UNDER_REVIEW",
    });
  }

  if (failedPayments > 0) {
    urgentActions.push({
      id: "failed-payments",
      type: "finance",
      severity: "critical",
      title: `${failedPayments} student checkouts failed payment processing`,
      detail: "Follow up with students to assist with gateway completion.",
      link: "/admin/payments?status=failed",
      actionLabel: "Inspect Payments",
    });
  }

  if (openSafetyCases > 0) {
    urgentActions.push({
      id: "safety-cases",
      type: "safety",
      severity: "critical",
      title: `${openSafetyCases} trust & safety incident cases require investigation`,
      detail: "Conduct or harassment reports awaiting officer resolution.",
      link: "/admin/safety-cases",
      actionLabel: "Manage Cases",
    });
  }

  res.json({
    success: true,
    pulse: {
      activeRequests,
      successfulBookings,
      requestsAtRisk: atRiskItems.length,
      zeroOfferRequests,
      expiringToday,
      verificationBacklog,
      failedPayments,
      openSafetyCases,
    },
    urgentActions,
    atRiskPreview: atRiskItems.slice(0, 5),
  });
};

// ─── 2. At-Risk Requests Queue & Actions ─────────────────────────────────────

export const listAtRiskRequests = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const io = _req.app.get("io");
    const items = await AtRiskRequestService.getAtRiskRequests(100, io);
    res.json({ success: true, count: items.length, items });
  } catch (err: any) {
    logger.error({ err }, "Failed to load at-risk requests");
    res.status(500).json({ success: false, message: "Failed to evaluate at-risk requests" });
  }
};

export const handleAtRiskAction = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const { action } = req.body;
  const io = req.app.get("io");

  if (!["rematch", "extend", "suggest_online", "escalate"].includes(action)) {
    res.status(400).json({ success: false, message: "Invalid rescue action." });
    return;
  }

  const permissionByAction: Record<string, Permission> = {
    rematch: "request.rematch",
    suggest_online: "request.rematch",
    extend: "request.extend",
    escalate: "request.escalate",
  };
  const requiredPermission = permissionByAction[action];
  if (!hasPermission(req.user?.adminRole, req.user?.adminPermissions, requiredPermission)) {
    res.status(403).json({
      success: false,
      code: "PERMISSION_DENIED",
      message: `You do not have permission to ${action.replace("_", " ")} this request.`,
    });
    return;
  }

  const result = await AtRiskRequestService.executeRescueAction(
    id,
    action,
    req.user?._id?.toString() || "admin",
    io
  );
  if (result.success) {
    await logAudit({
      action: `request_${action}`,
      actor: req.user?.name || "Administrator",
      actorId: req.user?._id?.toString(),
      entity: "Request",
      targetId: id,
      metadata: { source: "admin_control_tower" },
    });
  }
  res.json(result);
};

// ─── 3. Supply Gaps Intelligence ─────────────────────────────────────────────

export const getSupplyGapsIntelligence = async (_req: AuthRequest, res: Response): Promise<void> => {
  const now = new Date();
  // Aggregate demand by subject and city
  const demandAgg = await Request.aggregate([
    {
      $match: {
        status: { $in: ["open", "published", "receiving_offers", "negotiating"] },
        expiresAt: { $gt: now },
      },
    },
    {
      $group: {
        _id: { subject: "$subject", city: { $ifNull: ["$city", "All Cities"] }, mode: "$teachingMode" },
        requestCount: { $sum: 1 },
      },
    },
    { $sort: { requestCount: -1 } },
    { $limit: 40 },
  ]);

  // Aggregate tutor supply by subject and city
  const tutorAgg = await TutorProfile.aggregate([
    {
      $match: {
        isVerified: true,
      },
    },
    { $unwind: "$subjects" },
    {
      $group: {
        _id: { subject: "$subjects", city: { $ifNull: ["$city", "All Cities"] } },
        tutorCount: { $sum: 1 },
        policeVerifiedCount: {
          $sum: { $cond: [{ $eq: ["$policeVerificationStatus", "approved"] }, 1, 0] },
        },
      },
    },
  ]);

  const tutorMap = new Map<string, { tutorCount: number; policeVerifiedCount: number }>();
  for (const t of tutorAgg) {
    const key = `${t._id.subject.toLowerCase()}|${t._id.city.toLowerCase()}`;
    tutorMap.set(key, { tutorCount: t.tutorCount, policeVerifiedCount: t.policeVerifiedCount });
  }

  const gaps = demandAgg.map((d) => {
    const sub = d._id.subject;
    const city = d._id.city;
    const key = `${sub.toLowerCase()}|${city.toLowerCase()}`;
    const supply = tutorMap.get(key) || { tutorCount: 0, policeVerifiedCount: 0 };
    const ratio = d.requestCount > 0 ? supply.tutorCount / d.requestCount : 1;

    let gapStatus: "CRITICAL_GAP" | "MODERATE_GAP" | "HEALTHY" = "HEALTHY";
    if (ratio < 0.25) gapStatus = "CRITICAL_GAP";
    else if (ratio < 0.6) gapStatus = "MODERATE_GAP";

    return {
      subject: sub,
      city,
      teachingMode: d._id.mode,
      activeRequests: d.requestCount,
      eligibleTutors: supply.tutorCount,
      policeVerifiedTutors: supply.policeVerifiedCount,
      supplyDemandRatio: Number(ratio.toFixed(2)),
      gapStatus,
    };
  });

  // Sort critical gaps first
  gaps.sort((a, b) => a.supplyDemandRatio - b.supplyDemandRatio);

  res.json({ success: true, gaps });
};

// ─── 4. Finance Reconciliation Ledger ────────────────────────────────────────

export const getFinanceReconciliation = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = "1", limit = "30", status } = req.query;
  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 30));
  const skip = (pageNum - 1) * limitNum;

  const filter: Record<string, unknown> = {};
  if (status) filter.paymentStatus = status;

  const [total, bookings, ledgerStatusRows, recentLedgerRows] = await Promise.all([
    Booking.countDocuments(filter),
    Booking.find(filter)
      .populate("student", "name email")
      .populate("tutor", "name email")
      .populate("request", "subject level")
      .sort("-createdAt")
      .skip(skip)
      .limit(limitNum)
      .lean(),
    PaymentLedger.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 }, grossAmount: { $sum: "$grossAmount" }, platformNet: { $sum: "$platformNet" }, tutorPayable: { $sum: "$tutorPayable" } } },
    ]),
    PaymentLedger.find()
      .populate("student", "name email")
      .populate("tutor", "name email")
      .sort("-createdAt")
      .limit(20)
      .lean(),
  ]);

  // Reconciliation summary
  const allBookings = await Booking.find().select("studentTotal subtotal tutorFee studentFee platformFee tax paymentStatus").lean();
  let totalGMV = 0;
  let totalTutorNet = 0;
  let totalPlatformGross = 0;
  let totalEstimatedGatewayFees = 0;

  for (const b of allBookings) {
    if (["received", "confirmed"].includes(b.paymentStatus)) {
      const gmv = b.studentTotal || b.subtotal || 0;
      totalGMV += gmv;
      totalTutorNet += (b.subtotal || 0) - (b.tutorFee || 0);
      totalPlatformGross += (b.studentFee || 0) + (b.tutorFee || b.platformFee || 0);
      totalEstimatedGatewayFees += gmv * 0.029 + 30; // 2.9% + PKR 30
    }
  }

  res.json({
    success: true,
    summary: {
      totalGMV,
      totalTutorNet,
      totalPlatformGross,
      totalEstimatedGatewayFees,
      netPlatformSettlement: totalPlatformGross - totalEstimatedGatewayFees,
      ledger: ledgerStatusRows.reduce((acc, row) => {
        acc[row._id || "unknown"] = {
          count: row.count,
          grossAmount: row.grossAmount,
          platformNet: row.platformNet,
          tutorPayable: row.tutorPayable,
        };
        return acc;
      }, {} as Record<string, { count: number; grossAmount: number; platformNet: number; tutorPayable: number }>),
    },
    ledger: recentLedgerRows,
    bookings: bookings.map((b) => {
      const gmv = b.studentTotal || b.subtotal || 0;
      const expectedSettlement = gmv - (gmv * 0.029 + 30);
      return {
        ...b,
        estimatedGatewayFee: Math.round(gmv * 0.029 + 30),
        expectedSettlement: Math.round(expectedSettlement),
        settlementDiscrepancy: (b as any).gatewaySettlementStatus === "discrepancy",
      };
    }),
    pagination: {
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      limit: limitNum,
    },
  });
};

// ─── 5. System Health & Jobs ─────────────────────────────────────────────────

export const getSystemHealth = async (_req: AuthRequest, res: Response): Promise<void> => {
  const dbStatus = mongoose.connection.readyState === 1 ? "healthy" : "degraded";
  const memoryUsage = process.memoryUsage();
  const uptimeSeconds = Math.floor(process.uptime());

  res.json({
    success: true,
    health: {
      api: "healthy",
      database: dbStatus,
      uptimeSeconds,
      uptimeFormatted: `${Math.floor(uptimeSeconds / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m`,
      memory: {
        rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
        heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      },
      jobs: [
        { name: "request_lifecycle_worker", interval: "15 minutes", status: "running" },
        { name: "day_5_liquidity_escalation", interval: "15 minutes", status: "running" },
        { name: "24h_expiry_warning_worker", interval: "15 minutes", status: "running" },
        { name: "offer_24h_expiry_cleaner", interval: "15 minutes", status: "running" },
      ],
    },
  });
};

// ─── 6. Trust & Safety Cases ─────────────────────────────────────────────────

export const listSafetyCases = async (req: AuthRequest, res: Response): Promise<void> => {
  const { status, severity, category } = req.query;
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (severity) filter.severity = severity;
  if (category) filter.category = category;

  const cases = await SafetyCase.find(filter)
    .populate("reporter", "name email avatar")
    .populate("reportedUser", "name email avatar role")
    .populate("assignedOfficer", "name")
    .sort("-createdAt")
    .limit(100)
    .lean();

  res.json({ success: true, cases });
};

export const createSafetyCase = async (req: AuthRequest, res: Response): Promise<void> => {
  const count = await SafetyCase.countDocuments();
  const caseId = `CASE-2026-${String(count + 1).padStart(4, "0")}`;

  const newCase = await SafetyCase.create({
    caseId,
    reporter: req.user?._id,
    reportedUser: req.body.reportedUserId,
    booking: req.body.bookingId,
    request: req.body.requestId,
    category: req.body.category,
    severity: req.body.severity || "medium",
    evidence: req.body.evidence || [],
    internalNotes: req.body.initialNote
      ? [{ author: req.user?._id, text: req.body.initialNote, createdAt: new Date() }]
      : [],
  });

  res.status(201).json({ success: true, case: newCase });
};

export const resolveSafetyCase = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { actionTaken, resolutionSummary } = req.body;

  const safetyCase = await SafetyCase.findById(id);
  if (!safetyCase) {
    res.status(404).json({ success: false, message: "Safety case not found" });
    return;
  }

  safetyCase.status = "resolved";
  safetyCase.actionTaken = actionTaken || "none";
  safetyCase.resolutionSummary = resolutionSummary;
  safetyCase.resolvedAt = new Date();

  // If action is suspend/ban, update reported user
  if (["account_suspended", "account_banned"].includes(actionTaken)) {
    await User.findByIdAndUpdate(safetyCase.reportedUser, { isActive: false });
  }

  await safetyCase.save();
  res.json({ success: true, message: "Safety case resolved successfully." });
};

// ─── 7. Fee Configuration ────────────────────────────────────────────────────

export const getFeeConfig = async (_req: AuthRequest, res: Response): Promise<void> => {
  let active = await FeeConfig.findOne({ isActive: true }).sort("-updatedAt").lean();
  if (!active) {
    active = await FeeConfig.create({
      version: "2026.1",
      countryCode: "GLOBAL",
      currency: "PKR",
      studentFeePercent: 0,
      tutorFeePercent: 20,
      minimumFee: 0,
      maximumFee: 5000,
      taxPercent: 15,
    });
  }
  const history = await FeeConfig.find().sort("-createdAt").limit(10).lean();
  res.json({ success: true, config: active, history });
};

export const updateFeeConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  const { studentFeePercent, tutorFeePercent, minimumFee, maximumFee, taxPercent, notes } = req.body;
  const values = {
    studentFeePercent: Number(studentFeePercent ?? 0),
    tutorFeePercent: Number(tutorFeePercent ?? 20),
    minimumFee: Number(minimumFee ?? 0),
    maximumFee: Number(maximumFee ?? 5000),
    taxPercent: Number(taxPercent ?? 15),
  };
  if (!Object.values(values).every(Number.isFinite) || values.studentFeePercent < 0 || values.studentFeePercent > 100 || values.tutorFeePercent < 0 || values.tutorFeePercent > 100 || values.taxPercent < 0 || values.taxPercent > 100 || values.minimumFee < 0 || values.maximumFee < values.minimumFee) {
    res.status(400).json({ success: false, message: "Provide valid fee percentages and a maximum fee greater than or equal to the minimum fee." });
    return;
  }
  const nextVersion = `2026.${Date.now().toString().slice(-4)}`;
  const session = await mongoose.startSession();
  let created: any;
  try {
    await session.withTransaction(async () => {
      await FeeConfig.updateMany({ isActive: true }, { isActive: false }, { session });
      [created] = await FeeConfig.create([{ version: nextVersion, countryCode: "GLOBAL", currency: "PKR", ...values, notes: notes || "Updated via Admin Console", isActive: true, updatedBy: req.user?._id }], { session });
    });
  } finally {
    await session.endSession();
  }
  await logAudit({ action: "fee_config_updated", actor: req.user?.name || "Administrator", actorId: req.user?._id?.toString(), entity: "FeeConfig", targetId: created._id.toString(), metadata: { version: nextVersion, ...values } });

  res.json({ success: true, message: `Fee configuration updated to version ${nextVersion}`, config: created });
};

// ─── 8. Global Market Configuration ──────────────────────────────────────────

export const getMarketConfigs = async (req: AuthRequest, res: Response): Promise<void> => {
  const { ensureLaunchMarkets } = await import("../services/market.service");
  await ensureLaunchMarkets();
  let markets = await MarketConfig.find(req.countryScopeCode ? { countryCode: req.countryScopeCode } : {}).sort("countryCode").lean();
  // Launch markets are seeded by ensureLaunchMarkets. Never create legacy markets for a scoped administrator.
  if (markets.length === 0 && !req.countryScopeCode) {
    // Seed standard initial markets
    await MarketConfig.create([
      {
        countryCode: "PK",
        countryName: "Pakistan",
        currency: "PKR",
        currencySymbol: "Rs",
        timezone: "Asia/Karachi",
        onlineEnabled: true,
        homeTuitionEnabled: true,
        backgroundCheckRequired: true,
        platformFeePercent: 15,
        taxPercent: 0,
        isActive: true,
        launchStatus: "live",
        supportedCities: ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad"],
      },
      {
        countryCode: "SA",
        countryName: "Kingdom of Saudi Arabia",
        currency: "SAR",
        currencySymbol: "SR",
        timezone: "Asia/Riyadh",
        onlineEnabled: true,
        homeTuitionEnabled: true,
        backgroundCheckRequired: true,
        platformFeePercent: 15,
        taxPercent: 15,
        isActive: true,
        launchStatus: "live",
        supportedCities: ["Riyadh", "Jeddah", "Dammam", "Mecca", "Medina"],
      },
      {
        countryCode: "AE",
        countryName: "United Arab Emirates",
        currency: "AED",
        currencySymbol: "AED",
        timezone: "Asia/Dubai",
        onlineEnabled: true,
        homeTuitionEnabled: true,
        backgroundCheckRequired: true,
        platformFeePercent: 15,
        taxPercent: 5,
        isActive: true,
        launchStatus: "live",
        supportedCities: ["Dubai", "Abu Dhabi", "Sharjah"],
      },
      {
        countryCode: "GB",
        countryName: "United Kingdom",
        currency: "GBP",
        currencySymbol: "£",
        timezone: "Europe/London",
        onlineEnabled: true,
        homeTuitionEnabled: false,
        backgroundCheckRequired: true,
        platformFeePercent: 12,
        taxPercent: 20,
        isActive: true,
        launchStatus: "beta",
        supportedCities: ["London", "Manchester", "Birmingham"],
      },
    ]);
    markets = await MarketConfig.find().sort("countryCode").lean();
  }
  res.json({ success: true, markets });
};

export const updateMarketConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const current = await MarketConfig.findById(id);
  if (!current) { res.status(404).json({ success: false, message: "Market configuration not found." }); return; }
  if (req.countryScopeCode && current.countryCode !== req.countryScopeCode) { res.status(404).json({ success: false, message: "Market configuration not found." }); return; }
  const allowed = ["onlineEnabled", "homeTuitionEnabled", "studentRegistration", "tutorRegistration", "backgroundCheckRequired", "platformFeePercent", "taxPercent", "isActive", "launchStatus", "supportedCities", "supportedLanguages", "defaultLanguage", "verificationPolicy"];
  const changes = Object.fromEntries(allowed.filter((key) => req.body[key] !== undefined).map((key) => [key, req.body[key]]));
  if (changes.defaultLanguage && changes.defaultLanguage !== "en") {
    res.status(400).json({ success: false, message: "English is the only reviewed interface locale currently available." });
    return;
  }
  if (Array.isArray(changes.supportedLanguages) && changes.supportedLanguages.some((language) => language !== "en")) {
    res.status(400).json({ success: false, message: "Only English can be enabled as an interface language until additional translations are reviewed." });
    return;
  }
  // Payment activation is intentionally code/provider gated; an admin toggle cannot make an unconfigured market transactional.
  if (["AE", "GB"].includes(current.countryCode)) Object.assign(changes, { paymentsEnabled: false, payoutsEnabled: false, paymentProvider: "none", launchStatus: "beta", "featureFlags.acceptance": false });
  const updated = await MarketConfig.findByIdAndUpdate(id, { $set: changes }, { new: true, runValidators: true });
  if (updated) {
    await Country.updateOne(
      { iso2: updated.countryCode },
      { $set: { enabled: updated.isActive, launchStatus: updated.launchStatus } },
    );
  }
  await logAudit({ action: "market_config_updated", actor: req.user?.name || "Administrator", actorId: req.user?._id?.toString(), entity: "MarketConfig", targetId: id as string, metadata: { countryCode: current.countryCode, changes } });
  res.json({ success: true, market: updated });
};

// ─── 9. Admin RBAC Roles Management ──────────────────────────────────────────

export const getAdminRolesOverview = async (_req: AuthRequest, res: Response): Promise<void> => {
  const adminUsers = await User.find({ role: "admin" })
    .select("name email avatar adminRole adminPermissions createdAt")
    .lean();

  res.json({
    success: true,
    availableRoles: Object.keys(ROLE_PERMISSIONS),
    allPermissions: ALL_PERMISSIONS,
    rolePermissions: ROLE_PERMISSIONS,
    adminUsers,
  });
};

export const updateAdminUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId } = req.params;
  const { adminRole, adminPermissions } = req.body;

  const target = await User.findById(userId);
  if (!target || target.role !== "admin") {
    res.status(404).json({ success: false, message: "Admin user not found" });
    return;
  }

  target.adminRole = adminRole || target.adminRole;
  if (adminPermissions) target.adminPermissions = adminPermissions;
  await target.save();

  res.json({ success: true, message: `Admin role updated to '${target.adminRole}'` });
};

// ─── 10. Student & Tutor 360° Profiles ───────────────────────────────────────

export const getStudent360 = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = await User.findById(id).select("-password").lean();
  if (!user) {
    res.status(404).json({ success: false, message: "Student not found" });
    return;
  }

  const [requests, bookings] = await Promise.all([
    Request.find({ student: id }).sort("-createdAt").lean(),
    Booking.find({ student: id }).populate("tutor", "name email").sort("-createdAt").lean(),
  ]);

  const totalSpent = bookings
    .filter((b) => ["received", "confirmed"].includes(b.paymentStatus))
    .reduce((s, b) => s + (b.studentTotal || b.subtotal || 0), 0);

  res.json({
    success: true,
    student: {
      ...user,
      requests,
      bookings,
      lifetimeSpend: totalSpent,
      totalRequestsCount: requests.length,
      completedBookingsCount: bookings.filter((b) => b.status === "completed").length,
    },
  });
};

export const getTutor360 = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const tutorProfile = await TutorProfile.findOne({ user: id }).populate("user", "-password").lean();
  if (!tutorProfile) {
    res.status(404).json({ success: false, message: "Tutor profile not found" });
    return;
  }

  const [bids, bookings] = await Promise.all([
    Bid.find({ tutor: id }).populate("request", "subject level budget").sort("-createdAt").lean(),
    Booking.find({ tutor: id }).populate("student", "name email").sort("-createdAt").lean(),
  ]);

  const acceptedBids = bids.filter((b) => b.status === "accepted").length;
  const winRate = bids.length ? Math.round((acceptedBids / bids.length) * 100) : 0;
  const totalEarnings = bookings
    .filter((b) => ["received", "confirmed"].includes(b.paymentStatus))
    .reduce((s, b) => s + (b.tutorNet || b.tutorPayout || 0), 0);

  res.json({
    success: true,
    tutor: {
      ...tutorProfile,
      bids,
      bookings,
      winRate,
      totalEarnings,
      offersSubmittedCount: bids.length,
      completedBookingsCount: bookings.filter((b) => b.status === "completed").length,
    },
  });
};
