import { Response } from "express";
import { AuthRequest } from "../types";
import Booking from "../models/Booking.model";

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