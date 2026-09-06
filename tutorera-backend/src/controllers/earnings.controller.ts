import { Response } from "express";
import { AuthRequest } from "../types";
import Booking from "../models/Booking.model";
import PDFDocument from "pdfkit";
import User from "../models/User.model";
import sendEmail from "../utils/sendEmail";
import { payoutProcessedEmail } from "../utils/emailTemplates";
import { sendNotification } from "../utils/socket";
import logger from "../config/logger";

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

    const totalEarnings = completedBookings.reduce((sum, b) => sum + (b.tutorPayout || 0), 0);
    const sessionsCount = completedBookings.length;
    const hoursTaught   = sessionsCount; // 1 hr per session

    // ── On-hold payments: completed + payment confirmed, but not yet paid out ──
    const onHoldBookings = completedBookings.filter(b => b.payoutStatus === "pending");
    const onHoldAmount = onHoldBookings.reduce((sum, b) => sum + (b.tutorPayout || 0), 0);
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
      createdAt:   b.createdAt,
    }));

    res.status(200).json({
      success: true,
      role: "tutor",
      stats: {
        totalEarnings,
        sessionsCount,
        hoursTaught,
        subjectsCount: Object.keys(subjectMap).length,
        onHoldAmount,
        onHoldCount,
      },
      monthlyData,
      subjectBreakdown,
      recentSessions,
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

  const tutorUser = await User.findById(userId).select("name email");
  const completedBookings = await Booking.find({
    tutor: userId,
    status: "completed",
    paymentStatus: "confirmed",
  })
    .populate("student", "name")
    .populate("request", "subject level")
    .sort("-createdAt");

  const totalEarnings = completedBookings.reduce((sum, b) => sum + (b.tutorPayout || 0), 0);
  const sessionsCount = completedBookings.length;

  // Subjects breakdown
  const subjectMap: Record<string, number> = {};
  for (const b of completedBookings) {
    const reqData = b.request as unknown as { subject?: string } | null;
    const subj = reqData?.subject || "General";
    subjectMap[subj] = (subjectMap[subj] || 0) + 1;
  }
  const subjectBreakdown = Object.entries(subjectMap)
    .map(([subject, count]) => ({ subject, count }))
    .sort((a, b) => b.count - a.count);

  // Monthly earnings — all months with activity, oldest first
  const monthlyMap: Record<string, { earnings: number; sessions: number }> = {};
  for (const b of completedBookings) {
    const d = new Date(b.createdAt as unknown as string);
    const key = d.toLocaleDateString("en-PK", { month: "short", year: "numeric" });
    if (!monthlyMap[key]) monthlyMap[key] = { earnings: 0, sessions: 0 };
    monthlyMap[key].earnings += b.tutorPayout || 0;
    monthlyMap[key].sessions += 1;
  }
  const monthlyRows = Object.entries(monthlyMap)
    .map(([month, data]) => ({ month, ...data }))
    .reverse(); // oldest first for a report reading top-to-bottom

  const onHoldBookings = completedBookings.filter(b => b.payoutStatus === "pending");
  const onHoldAmount = onHoldBookings.reduce((sum, b) => sum + (b.tutorPayout || 0), 0);
  const paidOutAmount = totalEarnings - onHoldAmount;

  const now = new Date();
  const filename = `tutorera-earnings-report-${now.toISOString().slice(0, 10)}.pdf`;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  const doc = new PDFDocument({ margin: 50, size: "A4" });
  doc.pipe(res);

  const COL_DARK = "#1a1a2e";
  const COL_ACCENT = "#2563eb";
  const COL_GRAY = "#6b7280";

  const drawSectionTitle = (title: string) => {
    doc.moveDown(0.5);
    doc.rect(50, doc.y, 495, 22).fill("#eff6ff");
    doc.fillColor(COL_ACCENT).fontSize(11).font("Helvetica-Bold")
      .text(title, 58, doc.y - 18);
    doc.moveDown(0.3);
    doc.fillColor(COL_DARK);
  };

  const drawTableRow = (cols: string[], widths: number[], isHeader = false, y?: number) => {
    const rowY = y ?? doc.y;
    let x = 50;
    if (isHeader) {
      doc.rect(50, rowY, 495, 18).fill(COL_DARK);
    }
    cols.forEach((col, i) => {
      doc
        .fillColor(isHeader ? "#ffffff" : COL_DARK)
        .fontSize(9)
        .font(isHeader ? "Helvetica-Bold" : "Helvetica")
        .text(col, x + 4, rowY + 4, { width: widths[i] - 8, lineBreak: false });
      x += widths[i];
    });
    doc.moveDown(0.1);
    if (!isHeader) {
      doc.moveTo(50, doc.y + 2).lineTo(545, doc.y + 2)
        .strokeColor("#e5e7eb").lineWidth(0.5).stroke();
    }
  };

  // ── Cover ──
  doc.rect(0, 0, 595, 120).fill(COL_DARK);
  doc.fillColor("white").fontSize(26).font("Helvetica-Bold")
    .text("TUTORERA®", 50, 35);
  doc.fillColor("#9ca3af").fontSize(13).font("Helvetica")
    .text("Tutor Earnings & Progress Report", 50, 68);
  doc.fillColor("#6b7280").fontSize(10)
    .text(tutorUser?.name || "Tutor", 50, 88);
  doc.fillColor("#e94560").fontSize(10)
    .text(`Generated: ${now.toLocaleDateString("en-PK")}`, 50, 104);
  doc.y = 140;

  // ── 1. Overview ──
  drawSectionTitle("📊  OVERVIEW");
  const oWidths = [350, 145];
  drawTableRow(["Metric", "Value"], oWidths, true);
  [
    ["Total Sessions Completed", String(sessionsCount)],
    ["Total Earnings", `Rs. ${totalEarnings.toLocaleString()}`],
    ["Paid Out", `Rs. ${paidOutAmount.toLocaleString()}`],
    ["On Hold (Pending Payout)", `Rs. ${onHoldAmount.toLocaleString()}`],
    ["Subjects Taught", String(subjectBreakdown.length)],
  ].forEach(([k, v]) => drawTableRow([k, v], oWidths));

  // ── 2. Monthly Breakdown ──
  drawSectionTitle("📅  MONTHLY BREAKDOWN");
  const mWidths = [200, 150, 145];
  drawTableRow(["Month", "Sessions", "Earnings (PKR)"], mWidths, true);
  if (monthlyRows.length === 0) {
    drawTableRow(["No completed sessions yet", "—", "—"], mWidths);
  } else {
    monthlyRows.forEach(m =>
      drawTableRow([m.month, String(m.sessions), `Rs. ${m.earnings.toLocaleString()}`], mWidths)
    );
  }

  // ── 3. Subjects Taught ──
  drawSectionTitle("📖  SUBJECTS TAUGHT");
  const sWidths = [350, 145];
  drawTableRow(["Subject", "Sessions"], sWidths, true);
  if (subjectBreakdown.length === 0) {
    drawTableRow(["No subjects yet", "—"], sWidths);
  } else {
    subjectBreakdown.forEach(s =>
      drawTableRow([s.subject, String(s.count)], sWidths)
    );
  }

  // ── 4. Session History ──
  if (completedBookings.length > 0) {
    doc.addPage();
    drawSectionTitle("📋  SESSION HISTORY");
    const hWidths = [140, 150, 90, 115];
    drawTableRow(["Student", "Subject", "Amount", "Date"], hWidths, true);
    completedBookings.slice(0, 60).forEach(b => {
      const student = b.student as unknown as { name?: string } | null;
      const reqData = b.request as unknown as { subject?: string } | null;
      drawTableRow([
        student?.name || "Student",
        reqData?.subject || "General",
        `Rs. ${(b.tutorPayout || 0).toLocaleString()}`,
        new Date(b.createdAt as unknown as string).toLocaleDateString("en-PK"),
      ], hWidths);
    });
  }

  // ── Footer ──
  doc.fontSize(8).fillColor(COL_GRAY)
    .text(`TUTORERA® — Confidential · Generated ${now.toLocaleDateString("en-PK")}`, 50, 780, { align: "center" });

  doc.end();
};

// @desc    Tutor requests payout for a completed booking
// @route   POST /api/earnings/payouts/:bookingId/request
// @access  Private (tutor)
export const requestPayout = async (req: AuthRequest, res: Response): Promise<void> => {
  const { bookingId } = req.params;
  const tutorId = req.user?._id;

  const booking = await Booking.findOne({
    _id: bookingId,
    tutor: tutorId,
    status: "completed",
    paymentStatus: "confirmed",
    payoutStatus: "pending",
  });

  if (!booking) {
    res.status(404).json({ success: false, message: "Eligible booking not found for payout request." });
    return;
  }

  booking.payoutStatus = "processing";
  booking.payoutNote = "Payout requested by tutor";
  await booking.save();

  const tutorUser = await User.findById(tutorId).select("name email");
  if (tutorUser) {
    try {
      const mail = payoutProcessedEmail(tutorUser.name, booking.tutorPayout || 0, booking._id.toString());
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
  const tutorId = req.user?._id;
  const { page = "1", limit = "20", status } = req.query;

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

  const total = await Booking.countDocuments(filter);

  const payouts = await Booking.find(filter)
    .populate("student", "name email")
    .populate("request", "subject level")
    .sort("-createdAt")
    .skip(skip)
    .limit(limitNum)
    .lean();

  const totalPayoutAmount = payouts.reduce((sum, b) => sum + (b.tutorPayout || 0), 0);
  const pendingAmount = payouts.filter(b => b.payoutStatus === "pending" || b.payoutStatus === "processing").reduce((sum, b) => sum + (b.tutorPayout || 0), 0);
  const paidAmount = payouts.filter(b => b.payoutStatus === "paid").reduce((sum, b) => sum + (b.tutorPayout || 0), 0);

  res.status(200).json({
    success: true,
    stats: {
      totalPayouts: total,
      totalPayoutAmount,
      pendingAmount,
      paidAmount,
    },
    pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum), limit: limitNum },
    payouts: payouts.map(p => ({
      _id: p._id,
      studentName: (p.student as unknown as { name?: string } | null)?.name || "Student",
      subject: (p.request as unknown as { subject?: string } | null)?.subject || "General",
      amount: p.amount,
      tutorPayout: p.tutorPayout,
      payoutStatus: p.payoutStatus,
      payoutNote: p.payoutNote,
      createdAt: p.createdAt,
    })),
  });
};