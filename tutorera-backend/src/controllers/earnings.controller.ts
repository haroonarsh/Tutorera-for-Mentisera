import { Response } from "express";
import { AuthRequest } from "../types";
import Booking from "../models/Booking.model";
import PDFDocument from "pdfkit";
import User from "../models/User.model";
import sendEmail from "../utils/sendEmail";
import { payoutRequestedEmail } from "../utils/emailTemplates";
import { sendNotification } from "../utils/socket";
import logger from "../config/logger";
import StudentTutorRelationship from "../models/StudentTutorRelationship.model";
import { generateTutorPayoutReport, resolvePayoutReportPeriod } from "../services/payoutReport.service";
import { logAudit } from "../utils/logAudit";

// @desc    Get my earnings (tutor) or progress (student)
// @route   GET /api/earnings
// @access  Private (student | tutor)
export const getMyEarnings = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?._id;
  const role   = req.user?.role;

  if (!["tutor", "student"].includes(role || "")) {
    res.status(403).json({ success: false, message: "Access denied." });
    return;
  }

  // ── TUTOR ─────────────────────────────────────────────────────────────────
  if (role === "tutor") {
    const completedBookings = await Booking.find({
      tutor: userId,
      status: "completed",
      paymentStatus: "confirmed",
    })
      .populate("student", "name avatar")
      .populate("request", "subject level")
      .sort("-createdAt");

    const currencyTotals = Object.values(completedBookings.reduce((totals, booking) => {
      const currency = booking.currency || "PKR";
      const current = totals[currency] || { currency, totalEarnings: 0, onHoldAmount: 0 };
      current.totalEarnings += booking.tutorPayout || 0;
      if (["pending", "approved", "processing", "held"].includes(booking.payoutStatus)) current.onHoldAmount += booking.tutorPayout || 0;
      totals[currency] = current;
      return totals;
    }, {} as Record<string, { currency: string; totalEarnings: number; onHoldAmount: number }>));
    const sessionsCount = completedBookings.length;
    const hoursTaught   = sessionsCount; // 1 hr per session

    // ── On-hold payments: completed + payment confirmed, but not yet paid out ──
    const onHoldBookings = completedBookings.filter(b => b.payoutStatus === "pending");
    const onHoldCount = onHoldBookings.length;

    // Subjects taught breakdown
    const subjectMap: Record<string, number> = {};
    for (const b of completedBookings) {
      const req  = b.request as unknown as { subject?: string } | null;
      const subj = req?.subject || "General";
      subjectMap[subj] = (subjectMap[subj] || 0) + 1;
    }
    const subjectBreakdown = Object.entries(subjectMap)
      .map(([subject, count]) => ({ subject, count }))
      .sort((a, b) => b.count - a.count);

    // Monthly earnings — last 6 months
    const now = new Date();
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd   = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthBkgs  = completedBookings.filter(b => {
        const d = new Date(b.createdAt as unknown as string);
        return d >= monthStart && d < monthEnd;
      });
      monthlyData.push({
        month:    monthStart.toLocaleDateString("en-PK", { month: "short", year: "2-digit" }),
        earnings: monthBkgs.reduce((sum, b) => sum + (b.tutorPayout || 0), 0),
        sessions: monthBkgs.length,
      });
    }

    // Recent 5 sessions
    const recentSessions = completedBookings.slice(0, 5).map(b => ({
      _id:         b._id,
      studentName: (b.student as unknown as { name: string } | null)?.name || "Student",
      subject:     (b.request as unknown as { subject?: string } | null)?.subject || "General",
      amount:      b.amount,
      tutorPayout: b.tutorPayout,
      currency: b.currency || "PKR",
      createdAt:   b.createdAt,
    }));

    // Tutor retention metrics — how many students rebook
    const tutorRelationships = await StudentTutorRelationship.find({ tutor: userId });
    const repeatStudents = tutorRelationships.filter(r => r.repeatBookingCount > 0);
    const rebookRate = tutorRelationships.length > 0
      ? Math.round((repeatStudents.length / tutorRelationships.length) * 100)
      : 0;
    const repeatStudentCount = repeatStudents.length;

    const tutorRetentionStats = {
      totalStudentsWorkedWith: tutorRelationships.length,
      repeatStudentCount,
      rebookRate,
    };

    res.status(200).json({
      success: true,
      role: "tutor",
      stats: {
        currencyTotals,
        sessionsCount,
        hoursTaught,
        subjectsCount: Object.keys(subjectMap).length,
        onHoldCount,
      },
      monthlyData,
      subjectBreakdown,
      recentSessions,
      tutorRetentionStats,
    });
    return;
  }

  // ── STUDENT ───────────────────────────────────────────────────────────────
  const completedBookings = await Booking.find({
    student: userId,
    status:  "completed",
  })
    .populate("tutor",   "name avatar")
    .populate("request", "subject level")
    .sort("-createdAt");

  const sessionsCount = completedBookings.length;
  const hoursLearned  = sessionsCount; // 1 hr per session
  const totalSpent    = completedBookings.reduce((sum, b) => sum + (b.amount || 0), 0);

  // Subjects learned
  const subjectMap: Record<string, number> = {};
  for (const b of completedBookings) {
    const req  = b.request as unknown as { subject?: string } | null;
    const subj = req?.subject || "General";
    subjectMap[subj] = (subjectMap[subj] || 0) + 1;
  }
  const subjectBreakdown = Object.entries(subjectMap)
    .map(([subject, count]) => ({ subject, count }))
    .sort((a, b) => b.count - a.count);

  // Tutors worked with
  const tutorMap: Record<string, { name: string; sessions: number }> = {};
  for (const b of completedBookings) {
    const tutor = b.tutor as unknown as { _id: { toString(): string }; name: string } | null;
    if (!tutor) continue;
    const id = tutor._id.toString();
    if (!tutorMap[id]) tutorMap[id] = { name: tutor.name, sessions: 0 };
    tutorMap[id].sessions++;
  }
  const tutorsWorkedWith = Object.values(tutorMap).sort((a, b) => b.sessions - a.sessions);

  // Monthly sessions — last 6 months
  const now = new Date();
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const monthBkgs  = completedBookings.filter(b => {
      const d = new Date(b.createdAt as unknown as string);
      return d >= monthStart && d < monthEnd;
    });
    monthlyData.push({
      month:    monthStart.toLocaleDateString("en-PK", { month: "short", year: "2-digit" }),
      sessions: monthBkgs.length,
      spent:    monthBkgs.reduce((sum, b) => sum + (b.amount || 0), 0),
    });
  }

  // Recent 5 sessions
  const recentSessions = completedBookings.slice(0, 5).map(b => ({
    _id:       b._id,
    tutorName: (b.tutor as unknown as { name: string } | null)?.name || "Tutor",
    subject:   (b.request as unknown as { subject?: string } | null)?.subject || "General",
    amount:    b.amount,
    createdAt: b.createdAt,
  }));

  // Student retention metrics from relationship model
  const relationships = await StudentTutorRelationship.find({ student: userId });
  const repeatRelationships = relationships.filter(r => r.repeatBookingCount > 0);
  const retentionRate = relationships.length > 0
    ? Math.round((repeatRelationships.length / relationships.length) * 100)
    : 0;

  const retentionStats = {
    totalRelationships: relationships.length,
    repeatRelationships: repeatRelationships.length,
    retentionRate,
  };

  res.status(200).json({
    success: true,
    role: "student",
    stats: {
      sessionsCount,
      hoursLearned,
      subjectsCount:  Object.keys(subjectMap).length,
      tutorsCount:    Object.keys(tutorMap).length,
      totalSpent,
    },
    monthlyData,
    subjectBreakdown,
    tutorsWorkedWith,
    recentSessions,
    retentionStats,
  });
};

// @desc    Download tutor's earnings/progress report as PDF
// @route   GET /api/earnings/report/pdf
// @access  Private (tutor)
export const downloadEarningsPDF = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?._id;

  if (req.user?.role !== "tutor") {
    res.status(403).json({ success: false, message: "Only tutors can download this report." });
    return;
  }

  if (!userId) {
    res.status(401).json({ success: false, message: "Unauthorized." });
    return;
  }

  const tutorUser = await User.findById(userId).select("name email");
  if (!tutorUser) {
    res.status(404).json({ success: false, message: "Tutor not found." });
    return;
  }

  try {
    const { periodStart, periodEnd } = resolvePayoutReportPeriod(req.query.from, req.query.to);

    const { data: reportData, pdfBuffer } = await generateTutorPayoutReport(userId.toString(), periodStart, periodEnd, { userId: userId.toString(), role: "tutor" }, req.query.currency as string | undefined);

    const filename = `tutorera-payout-report-${reportData.reportId}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Length", pdfBuffer.length.toString());
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error("Failed to generate payout report:", error);
    res.status(error?.statusCode || 500).json({ success: false, message: error?.statusCode ? error.message : "Failed to generate payout report." });
  }
};

// @desc    Tutor requests payout for a completed booking
// @route   POST /api/earnings/payouts/:bookingId/request
// @access  Private (tutor)
export const requestPayout = async (req: AuthRequest, res: Response): Promise<void> => {
  const { bookingId } = req.params;
  const tutorId = req.user?._id;

  if (req.user?.role !== "tutor") {
    res.status(403).json({ success: false, message: "Only tutors can request a payout." });
    return;
  }

  const requestedAt = new Date();
  // Keep the payout pending until finance approves it. This conditional update also
  // makes duplicate clicks and concurrent requests harmless.
  const booking = await Booking.findOneAndUpdate({
    _id: bookingId,
    tutor: tutorId,
    status: "completed",
    paymentStatus: "confirmed",
    payoutStatus: "pending",
    payoutRequestedAt: { $exists: false },
  }, {
    $set: {
      payoutNote: "Payout requested by tutor",
      payoutRequestedAt: requestedAt,
    },
  }, { new: true });

  if (!booking) {
    res.status(404).json({ success: false, message: "Eligible booking not found for payout request." });
    return;
  }

  await logAudit({
    action: "payout_requested",
    actor: req.user?.name || "Tutor",
    actorId: tutorId?.toString(),
    entity: "Booking",
    targetId: booking._id.toString(),
    metadata: { tutorPayout: booking.tutorPayout || booking.tutorNet || 0, currency: booking.currency || "PKR" },
  });

  const tutorUser = await User.findById(tutorId).select("name email");
  if (tutorUser) {
    try {
      const mail = payoutRequestedEmail(tutorUser.name, booking.tutorPayout || 0, booking._id.toString(), booking.currency || "PKR");
      await sendEmail({ to: tutorUser.email, subject: mail.subject, html: mail.html, eventType: "payout.requested", relatedEntityType: "Booking", relatedEntityId: booking._id.toString() });
    } catch (err) {
      logger.error({ err, bookingId: booking._id }, "Failed to send payout request email");
    }
  }

  res.status(200).json({ success: true, message: "Payout request submitted successfully.", booking });
};

// @desc    Get my payout history (tutor)
// @route   GET /api/earnings/payouts
// @access  Private (tutor)
export const getMyPayouts = async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user?.role !== "tutor") {
    res.status(403).json({ success: false, message: "Only tutors can view payout history." });
    return;
  }

  const tutorId = req.user?._id;
  const { page = "1", limit = "20", status } = req.query;
  const allowedStatuses = new Set(["all", "pending", "approved", "processing", "paid", "failed", "held"]);
  if (status && !allowedStatuses.has(String(status))) {
    res.status(400).json({ success: false, message: "Invalid payout status." });
    return;
  }

  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 20));
  const skip = (pageNum - 1) * limitNum;

  const filter: Record<string, unknown> = {
    tutor: tutorId,
    status: "completed",
    paymentStatus: "confirmed",
  };

  if (status && status !== "all") {
    filter.payoutStatus = status;
  }

  const [total, payouts, summaryRows] = await Promise.all([
    Booking.countDocuments(filter),
    Booking.find(filter)
    .populate("student", "name")
    .populate("request", "subject level")
    .sort("-createdAt")
    .skip(skip)
    .limit(limitNum)
    .lean(),
    Booking.find(filter).select("payoutStatus tutorPayout currency").lean(),
  ]);

  const currencyTotals = Object.values(summaryRows.reduce((totals, b) => {
    const currency = b.currency || "PKR";
    const current = totals[currency] || { currency, totalPayoutAmount: 0, pendingAmount: 0, paidAmount: 0 };
    current.totalPayoutAmount += b.tutorPayout || 0;
    if (["pending", "approved", "processing", "held"].includes(b.payoutStatus)) current.pendingAmount += b.tutorPayout || 0;
    if (b.payoutStatus === "paid") current.paidAmount += b.tutorPayout || 0;
    totals[currency] = current;
    return totals;
  }, {} as Record<string, { currency: string; totalPayoutAmount: number; pendingAmount: number; paidAmount: number }>));

  res.status(200).json({
    success: true,
    stats: {
      totalPayouts: total,
      // Never add unlike currencies. Consumers must use currencyTotals.
      currencyTotals,
    },
    pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum), limit: limitNum },
    payouts: payouts.map(p => ({
      _id: p._id,
      studentName: (p.student as unknown as { name?: string } | null)?.name || "Student",
      subject: (p.request as unknown as { subject?: string } | null)?.subject || "General",
      amount: p.amount,
      currency: "PKR",
      subtotal: p.subtotal,
      tutorFee: p.tutorFee,
      tax: p.tax,
      tutorNet: p.tutorNet,
      tutorPayout: p.tutorPayout,
      payoutStatus: p.payoutStatus,
      payoutNote: p.payoutNote,
      payoutRequestedAt: p.payoutRequestedAt,
      payoutApprovedAt: p.payoutApprovedAt,
      payoutProcessingAt: p.payoutProcessingAt,
      payoutPaidAt: p.payoutPaidAt,
      payoutFailedAt: p.payoutFailedAt,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })),
  });
};
