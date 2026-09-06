// src/controllers/adminControlTower.controller.ts
// Centralized Controller for Marketplace Control Tower, At-Risk Requests,
// Supply Gaps, Safety Cases, Reconciliation, Markets, and RBAC Roles

import { Response } from "express";
import { AuthRequest } from "../types";
import Request from "../models/Request.model";
import Bid from "../models/Bid.model";
import Booking from "../models/Booking.model";
import TutorProfile from "../models/TutorProfile.model";
import User from "../models/User.model";
import SafetyCase from "../models/SafetyCase.model";
import FeeConfig from "../models/FeeConfig.model";
import MarketConfig from "../models/MarketConfig.model";
import { AtRiskRequestService } from "../services/atRiskRequest.service";
import { ROLE_PERMISSIONS, ALL_PERMISSIONS } from "../config/rbac";
import mongoose from "mongoose";
import logger from "../config/logger";

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
    AtRiskRequestService.getAtRiskRequests(15),
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
    const items = await AtRiskRequestService.getAtRiskRequests(100);
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

  const result = await AtRiskRequestService.executeRescueAction(
    id,
    action,
    req.user?._id?.toString() || "admin",
    io
  );
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

  const [total, bookings] = await Promise.all([
    Booking.countDocuments(filter),
    Booking.find(filter)
      .populate("student", "name email")
      .populate("tutor", "name email")
      .populate("request", "subject level")
      .sort("-createdAt")
      .skip(skip)
      .limit(limitNum)
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
    },
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
      studentFeePercent: 5,
      tutorFeePercent: 15,
      minimumFee: 100,
      maximumFee: 5000,
      taxPercent: 0,
    });
  }
  const history = await FeeConfig.find().sort("-createdAt").limit(10).lean();
  res.json({ success: true, config: active, history });
};

export const updateFeeConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  const { studentFeePercent, tutorFeePercent, minimumFee, maximumFee, taxPercent, notes } = req.body;

  // Deactivate old configs
  await FeeConfig.updateMany({}, { isActive: false });

  const nextVersion = `2026.${Date.now().toString().slice(-4)}`;
  const created = await FeeConfig.create({
    version: nextVersion,
    countryCode: "GLOBAL",
    currency: "PKR",
    studentFeePercent: Number(studentFeePercent || 5),
    tutorFeePercent: Number(tutorFeePercent || 15),
    minimumFee: Number(minimumFee || 100),
    maximumFee: Number(maximumFee || 5000),
    taxPercent: Number(taxPercent || 0),
    notes: notes || "Updated via Admin Console",
    isActive: true,
    updatedBy: req.user?._id,
  });

  res.json({ success: true, message: `Fee configuration updated to version ${nextVersion}`, config: created });
};

// ─── 8. Global Market Configuration ──────────────────────────────────────────

export const getMarketConfigs = async (_req: AuthRequest, res: Response): Promise<void> => {
  let markets = await MarketConfig.find().sort("countryCode").lean();
  if (markets.length === 0) {
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
  const updated = await MarketConfig.findByIdAndUpdate(id, req.body, { new: true });
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
