import { Response } from "express";
import { AuthRequest } from "../types";
import TutorProfile from "../models/TutorProfile.model";
import StudentProfile from "../models/StudentProfile.model";
import User from "../models/User.model";
import { Types } from "mongoose";
import Booking from "../models/Booking.model";
import Contact from "../models/Contact.model";
import { sendNotification } from "../utils/socket";
import { TOTAL_FEE_PERCENT } from "../config/constants";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import Request from "../models/Request.model";
import Review from "../models/Review.model";
import { creditReferrerOnFirstBooking } from "../controllers/referral.controller";
import { logAudit } from "../utils/logAudit";
import AuditLog from "../models/AuditLog.model";
import Broadcast from "../models/Broadcast.model";
import Notification from "../models/Notification.model";

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private (admin)
export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  const [
    totalUsers, totalTutors, totalStudents,
    pendingVerifications, approvedTutors,
    totalBookings, totalContacts,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "tutor" }),
    User.countDocuments({ role: "student" }),
    TutorProfile.countDocuments({ verificationStatus: "pending" }),
    TutorProfile.countDocuments({ verificationStatus: "approved" }),
    Booking.countDocuments(),
    Contact.countDocuments(),
  ]);

  res.status(200).json({
    success: true,
    stats: {
      totalUsers,
      totalTutors,
      totalStudents,
      pendingVerifications,
      approvedTutors,
      totalBookings,
      totalContacts,
    },
  });
};

// @desc    Get all verifications with full data
// @route   GET /api/admin/verifications
// @access  Private (admin)
export const getPendingVerifications = async (req: AuthRequest, res: Response): Promise<void> => {
  const status = (req.query.status as string) || "pending";

  const tutors = await TutorProfile.find({
    verificationStatus: status as "pending" | "approved" | "rejected",
  })
    .populate("user", "name email phone city createdAt")
    .sort("-createdAt");

  res.status(200).json({ success: true, total: tutors.length, tutors });
};

// @desc    Get single tutor full data
// @route   GET /api/admin/tutors/:id
// @access  Private (admin)
export const getTutorFullData = async (req: AuthRequest, res: Response): Promise<void> => {
  const profile = await TutorProfile.findById(req.params.id)
    .populate("user", "name email phone city createdAt isActive");

  if (!profile) {
    res.status(404).json({ success: false, message: "Tutor not found" });
    return;
  }

  res.status(200).json({ success: true, profile });
};

// @desc    Approve or reject tutor
// @route   PATCH /api/admin/verify/:id
// @access  Private (admin)
export const verifyTutor = async (req: AuthRequest, res: Response): Promise<void> => {
  const { status, reason } = req.body;

  if (!["approved", "rejected"].includes(status)) {
    res.status(400).json({ success: false, message: "Status must be approved or rejected" });
    return;
  }

  const profile = await TutorProfile.findById(req.params.id);
  if (!profile) {
    res.status(404).json({ success: false, message: "Tutor profile not found" });
    return;
  }

  profile.verificationStatus = status;
  profile.isVerified = status === "approved";
  if (status === "rejected" && reason) {
    profile.rejectionReason = reason;
  }
  await profile.save();

  await logAudit({
    action: status === "approved" ? "tutor_approved" : "tutor_rejected",
    actor: req.user?.name || "Admin",
    actorId: req.user?._id?.toString(),
    entity: "TutorProfile",
    targetId: profile._id.toString(),
    targetName: (profile.user as any)?.name || profile._id.toString(),
    metadata: status === "rejected" ? { reason } : undefined,
  });

  // Send real-time notification to tutor
  const io = req.app.get("io");
  await sendNotification(io, profile.user.toString(), {
    title: status === "approved" ? "🎉 Profile Approved!" : "❌ Profile Rejected",
    message: status === "approved"
      ? "Congratulations! Your tutor profile has been approved. You are now visible to students."
      : `Your profile was rejected. Reason: ${reason || "Please contact support."}`,
    type: "verification",
    link: "/dashboard",
  });

  res.status(200).json({
    success: true,
    message: `Tutor ${status} successfully`,
    profile,
  });
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (admin)
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  const { role, page = "1", limit = "20" } = req.query;
  const filter: Record<string, unknown> = {};
  if (role) filter.role = role;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const total = await User.countDocuments(filter);
  const users = await User.find(filter).skip(skip).limit(limitNum).sort("-createdAt");

  res.status(200).json({ success: true, total, page: pageNum, users });
};

// @desc    Toggle user status
// @route   PATCH /api/admin/users/:id/status
// @access  Private (admin)
export const toggleUserStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404).json({ success: false, message: "User not found" });
    return;
  }
  user.isActive = !user.isActive;
  await user.save();

  await logAudit({
    action: user.isActive ? "user_activated" : "user_deactivated",
    actor: req.user?.name || "Admin",
    actorId: req.user?._id?.toString(),
    entity: "User",
    targetId: user._id.toString(),
    targetName: user.name,
  });

  res.status(200).json({ success: true, message: `User ${user.isActive ? "activated" : "deactivated"}` });
};

// @desc    Get all bookings
// @route   GET /api/admin/bookings
// @access  Private (admin)
export const getAllBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  const { status, page = "1", limit = "20" } = req.query;
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const total = await Booking.countDocuments(filter);
  const bookings = await Booking.find(filter)
    .populate("student", "name email phone")
    .populate("tutor", "name email phone")
    .sort("-createdAt")
    .skip(skip)
    .limit(limitNum);

  res.status(200).json({ success: true, total, page: pageNum, bookings });
};

// @desc    Update booking payment status
// @route   PATCH /api/admin/bookings/:id/payment
// @access  Private (admin)
export const updatePaymentStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { paymentStatus, paymentNote, payoutStatus, payoutNote, status } = req.body;

  const booking = await Booking.findById(req.params.id)
    .populate("student", "name")
    .populate("tutor", "name");
  if (!booking) {
    res.status(404).json({ success: false, message: "Booking not found" });
    return;
  }

  // Update only fields that are provided
  if (paymentStatus !== undefined) booking.paymentStatus = paymentStatus;
  if (paymentNote !== undefined) booking.paymentNote = paymentNote;
  if (payoutStatus !== undefined) booking.payoutStatus = payoutStatus;
  if (payoutNote !== undefined) booking.payoutNote = payoutNote;

  // Handle booking status change from admin
  if (status !== undefined) {
    booking.status = status;
  }

  // ← ADD: Auto-calculate fees with new 23% when payment confirmed
  if (paymentStatus === "confirmed" && booking.amount) {
    const platformFee = Math.round(booking.amount * TOTAL_FEE_PERCENT / 100);
    const tutorPayout = booking.amount - platformFee;
    booking.platformFee = platformFee;
    booking.tutorPayout = tutorPayout;
  }
  
  await booking.save();

  if (paymentStatus === "confirmed") {
    await logAudit({
      action: "payment_confirmed",
      actor: req.user?.name || "Admin",
      actorId: req.user?._id?.toString(),
      entity: "Booking",
      targetId: booking._id.toString(),
      targetName: `${(booking.student as any)?.name || "Student"} → ${(booking.tutor as any)?.name || "Tutor"}`,
      metadata: { amount: booking.amount },
    });
  }
  if (payoutStatus === "paid") {
    await logAudit({
      action: "payout_marked_paid",
      actor: req.user?.name || "Admin",
      actorId: req.user?._id?.toString(),
      entity: "Booking",
      targetId: booking._id.toString(),
      targetName: `${(booking.student as any)?.name || "Student"} → ${(booking.tutor as any)?.name || "Tutor"}`,
      metadata: { tutorPayout: booking.tutorPayout },
    });
  }

  // ── trigger referral credit when admin marks booking completed ──
  if (status === "completed" && booking.isFirstSession) {
    await creditReferrerOnFirstBooking(booking.student.toString());
  }

  res.status(200).json({
    success: true,
    message: "Updated successfully",
    booking,
  });
};

// @desc    Get all contacts
// @route   GET /api/admin/contacts
// @access  Private (admin)
export const getAllContacts = async (req: AuthRequest, res: Response): Promise<void> => {
  const contacts = await Contact.find().sort("-createdAt");
  res.status(200).json({ success: true, total: contacts.length, contacts });
};


// @desc    Update contact/support request status
// @route   PATCH /api/admin/contacts/:id
// @access  Private (admin)
export const updateContactStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const { status } = req.body;
  const contact = await Contact.findByIdAndUpdate(
    req.params.id,
    { status, isRead: true },
    { new: true }
  );
  if (!contact) {
    res.status(404).json({ success: false, message: "Contact not found" });
    return;
  }
  res.status(200).json({ success: true, contact });
};

// @desc    Update booking status
// @route   PATCH /api/admin/bookings/:id/status
// @access  Private (admin)
export const updateBookingStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { status } = req.body;

  if (!["upcoming", "ongoing", "completed", "cancelled"].includes(status)) {
    res.status(400).json({ success: false, message: "Invalid status" });
    return;
  }

  const booking = await Booking.findById(req.params.id)
    .populate("student", "name")
    .populate("tutor", "name");
  if (!booking) {
    res.status(404).json({ success: false, message: "Booking not found" });
    return;
  }

  const previousStatus = booking.status;
  booking.status = status;
  await booking.save();

  await logAudit({
    action: `booking_${status}`,   // booking_completed, booking_cancelled, etc.
    actor: req.user?.name || "Admin",
    actorId: req.user?._id?.toString(),
    entity: "Booking",
    targetId: booking._id.toString(),
    targetName: `${(booking.student as any)?.name || "Student"} → ${(booking.tutor as any)?.name || "Tutor"}`,
    metadata: { previousStatus },
  });

   // ── Trigger referral credit when admin marks booking as completed ──
  if (status === "completed" && previousStatus !== "completed" && booking.isFirstSession) {
    await creditReferrerOnFirstBooking(booking.student.toString());
  }
  
  // Notify both parties
  const io = req.app.get("io");
  const statusMessages: Record<string, string> = {
    ongoing: "Your session has started.",
    completed: "Your session has been marked as completed.",
    cancelled: "Your booking has been cancelled.",
  };

  if (statusMessages[status]) {
    await sendNotification(io, booking.student.toString(), {
      title: "📅 Booking Update",
      message: statusMessages[status],
      type: "booking",
      link: "/dashboard",
    });
    await sendNotification(io, booking.tutor.toString(), {
      title: "📅 Booking Update",
      message: statusMessages[status],
      type: "booking",
      link: "/dashboard",
    });
  }

  res.status(200).json({
    success: true,
    message: `Booking status updated to ${status}`,
    booking,
  });
};

// @desc    Update a user's plan (admin manually activates after NayaPay payment confirmation)
// @route   PATCH /api/admin/users/:id/plan
// @access  Private (admin)
export const updateUserPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  const { plan } = req.body;
  if (!["free", "standard", "premium"].includes(plan)) {
    res.status(400).json({ success: false, message: "Invalid plan" });
    return;
  }
  const user = await User.findByIdAndUpdate(
    new Types.ObjectId(req.params.id as string),
    { plan },
    { new: true }
  );

  if (user) {
    await logAudit({
      action: "plan_changed",
      actor: req.user?.name || "Admin",
      actorId: req.user?._id?.toString(),
      entity: "User",
      targetId: user._id.toString(),
      targetName: user.name,
      metadata: { newPlan: plan },
    });
  }

  if (!user) {
    res.status(404).json({ success: false, message: "User not found" });
    return;
  }
  res.status(200).json({ success: true, message: `Plan updated to ${plan}`, user });
};

// @desc    Get all payouts (bookings where student payment is confirmed)
// @route   GET /api/admin/payouts
// @access  Private (admin)
export const getPayouts = async (req: AuthRequest, res: Response): Promise<void> => {
  const { status } = req.query; // "pending" | "paid" | undefined (all)

  // Only show bookings where the student has already paid — those are the ones
  // that need a tutor payout. Unconfirmed payments haven't earned a payout yet.
  const filter: Record<string, unknown> = {
    paymentStatus: "confirmed",
  };

  if (status && status !== "all") {
    filter.payoutStatus = status;
  }

  const bookings = await Booking.find(filter)
    .populate("student", "name email")
    .populate("tutor", "name email phone city")
    .sort("-createdAt");

  // ── Summary stats across ALL confirmed bookings (ignore status filter for stats) ──
  const allConfirmed = await Booking.find({ paymentStatus: "confirmed" });
  const pendingOnes  = allConfirmed.filter(b => b.payoutStatus === "pending");
  const paidOnes     = allConfirmed.filter(b => b.payoutStatus === "paid");

  const totalPendingAmount = pendingOnes.reduce((sum, b) => sum + (b.tutorPayout || 0), 0);
  const totalPaidAmount    = paidOnes.reduce((sum, b) => sum + (b.tutorPayout || 0), 0);

  res.status(200).json({
    success: true,
    stats: {
      pendingCount:        pendingOnes.length,
      paidCount:           paidOnes.length,
      totalPendingAmount,
      totalPaidAmount,
    },
    total: bookings.length,
    bookings,
  });
};

// @desc    Get analytics data for admin analytics page
// @route   GET /api/admin/analytics
// @access  Private (admin)
export const getAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  const now = new Date();

  // ── Date boundaries ──
  const weekStart   = new Date(now); weekStart.setDate(now.getDate() - 7);
  const monthStart  = new Date(now.getFullYear(), now.getMonth(), 1);
  const eightWeeksAgo = new Date(now); eightWeeksAgo.setDate(now.getDate() - 56);

  // ── Parallel fetches ──
  const [
    totalUsers,
    newUsersThisWeek,
    newUsersThisMonth,
    totalBookings,
    allBookings,
    monthBookings,
    allUsersForPlan,
    recentSignups,
    pendingPayoutBookings,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: weekStart } }),
    User.countDocuments({ createdAt: { $gte: monthStart } }),
    Booking.countDocuments(),
    Booking.find()
      .select("status paymentStatus amount platformFee tutorPayout tutor createdAt")
      .populate("tutor", "name"),
    Booking.find({ createdAt: { $gte: monthStart }, paymentStatus: "confirmed" })
      .select("amount platformFee tutorPayout"),
    User.find().select("plan"),
    User.find({ createdAt: { $gte: eightWeeksAgo } }).select("createdAt"),
    Booking.find({ paymentStatus: "confirmed", payoutStatus: "pending" }).select("tutorPayout"),
  ]);

  // ── Revenue ──
  const revenueThisMonth     = monthBookings.reduce((sum, b) => sum + (b.amount || 0), 0);
  const platformFeeThisMonth = monthBookings.reduce((sum, b) => sum + (b.platformFee || 0), 0);
  const pendingPayouts       = pendingPayoutBookings.reduce((sum, b) => sum + (b.tutorPayout || 0), 0);

  // ── Plan breakdown ──
  const planCounts: Record<string, number> = { free: 0, standard: 0, premium: 0 };
  allUsersForPlan.forEach(u => {
    const p = (u.plan || "free") as string;
    planCounts[p] = (planCounts[p] || 0) + 1;
  });
  const totalForPlan = allUsersForPlan.length || 1;
  const planBreakdown = Object.entries(planCounts).map(([plan, count]) => ({
    plan,
    count,
    percent: Math.round((count / totalForPlan) * 100),
  }));

  // ── Booking status breakdown ──
  const bookingStatusBreakdown = {
    upcoming:  allBookings.filter(b => b.status === "upcoming").length,
    ongoing:   allBookings.filter(b => b.status === "ongoing").length,
    completed: allBookings.filter(b => b.status === "completed").length,
    cancelled: allBookings.filter(b => b.status === "cancelled").length,
  };

  // ── Signup trend — last 8 weeks ──
  const signupTrend = [];
  for (let i = 7; i >= 0; i--) {
    const weekEnd   = new Date(now); weekEnd.setDate(now.getDate() - i * 7);
    const weekBegin = new Date(weekEnd); weekBegin.setDate(weekEnd.getDate() - 7);
    const count = recentSignups.filter(u => {
      const d = new Date(u.createdAt as unknown as string);
      return d >= weekBegin && d < weekEnd;
    }).length;
    signupTrend.push({
      week:  `W${8 - i}`,
      label: weekEnd.toLocaleDateString("en-PK", { month: "short", day: "numeric" }),
      count,
    });
  }

  // ── Top 5 tutors by bookings ──
  const tutorMap: Record<string, { name: string; count: number; revenue: number }> = {};
  allBookings.forEach(b => {
    if (!b.tutor) return;
    const tutor = b.tutor as unknown as { _id: { toString(): string }; name: string };
    const id = tutor._id.toString();
    if (!tutorMap[id]) tutorMap[id] = { name: tutor.name, count: 0, revenue: 0 };
    tutorMap[id].count++;
    tutorMap[id].revenue += b.amount || 0;
  });
  const topTutors = Object.values(tutorMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // ── Recent confirmed payments ──
  const recentPayments = await Booking.find({ paymentStatus: "confirmed" })
    .populate("student", "name")
    .populate("tutor", "name")
    .sort("-updatedAt")
    .limit(5)
    .select("amount student tutor status createdAt");

  res.status(200).json({
    success: true,
    overview: {
      totalUsers,
      newUsersThisWeek,
      newUsersThisMonth,
      totalBookings,
      revenueThisMonth,
      platformFeeThisMonth,
      pendingPayouts,
    },
    planBreakdown,
    signupTrend,
    bookingStatusBreakdown,
    topTutors,
    recentPayments,
  });
};

// @desc    Get audit logs
// @route   GET /api/admin/audit-logs
// @access  Private (admin)
export const getAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  const { action, entity, page = "1", limit = "50" } = req.query;
 
  const filter: Record<string, unknown> = {};
  if (action && action !== "all") filter.action = action;
  if (entity && entity !== "all") filter.entity = entity;
 
  const pageNum  = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip     = (pageNum - 1) * limitNum;
 
  const [total, logs] = await Promise.all([
    AuditLog.countDocuments(filter),
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
  ]);
 
  // Distinct values for filter dropdowns
  const [actions, entities] = await Promise.all([
    AuditLog.distinct("action"),
    AuditLog.distinct("entity"),
  ]);
 
  res.status(200).json({
    success: true,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    logs,
    filters: { actions, entities },
  });
};

// @desc    Send a broadcast notification to a group of users
// @route   POST /api/admin/broadcasts
// @access  Private (admin)
export const sendBroadcast = async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, message, audience } = req.body;
 
  if (!title?.trim() || !message?.trim() || !audience) {
    res.status(400).json({ success: false, message: "Title, message and audience are required." });
    return;
  }
 
  // Build the user filter based on audience
  const filter: Record<string, unknown> = { isActive: true };
  switch (audience) {
    case "students": filter.role = "student"; break;
    case "tutors":   filter.role = "tutor";   break;
    case "premium":  filter.plan = "premium"; break;
    default:         filter.role = { $in: ["student", "tutor"] }; // "all" excludes admins
  }
 
  const users = await User.find(filter).select("_id");
 
  if (users.length === 0) {
    res.status(400).json({ success: false, message: "No active users found for this audience." });
    return;
  }
 
  // ── Send real-time notification to every matched user ──
  const io = req.app.get("io");
  const notificationDocs = users.map(u => ({
    user:    u._id,
    title,
    message,
    type:    "broadcast",
    link:    "/notifications",
    isRead:  false,
  }));
 
  // Bulk insert into Notification collection (saves to DB for users who are offline)
  await Notification.insertMany(notificationDocs);
 
  // Also emit real-time socket event for online users
  for (const user of users) {
    await sendNotification(io, user._id.toString(), {
      title,
      message,
      type: "broadcast",
      link: "/notifications",
    });
  }
 
  // ── Save broadcast record ──
  const broadcast = await Broadcast.create({
    title,
    message,
    audience,
    sentCount:  users.length,
    sentBy:     req.user?._id,
    sentByName: req.user?.name || "Admin",
  });
 
  // ── Audit log ──
  await logAudit({
    action:     "broadcast_sent",
    actor:      req.user?.name || "Admin",
    actorId:    req.user?._id?.toString(),
    entity:     "Broadcast",
    targetId:   broadcast._id.toString(),
    targetName: title,
    metadata:   { audience, sentCount: users.length },
  });
 
  res.status(201).json({
    success: true,
    message: `Broadcast sent to ${users.length} user${users.length !== 1 ? "s" : ""}.`,
    broadcast,
  });
};
 
// @desc    Get broadcast history
// @route   GET /api/admin/broadcasts
// @access  Private (admin)
export const getBroadcasts = async (req: AuthRequest, res: Response): Promise<void> => {
  const broadcasts = await Broadcast.find()
    .sort({ createdAt: -1 })
    .limit(50);
 
  const totalSent = broadcasts.reduce((sum, b) => sum + b.sentCount, 0);
 
  res.status(200).json({ success: true, total: broadcasts.length, totalSent, broadcasts });
};

// @desc    Generate weekly or monthly report
// @route   GET /api/admin/reports
// @access  Private (admin)
export const generateReport = async (req: AuthRequest, res: Response): Promise<void> => {
  const { period = "monthly", format = "excel" } = req.query;

  // ── Date range ──────────────────────────────────────────────────
  const now = new Date();
  let startDate: Date;
  const periodLabel = period === "weekly" ? "Weekly" : "Monthly";

  if (period === "weekly") {
    startDate = new Date(now);
    startDate.setDate(now.getDate() - 7);
  } else {
    startDate = new Date(now);
    startDate.setMonth(now.getMonth() - 1);
  }

  const dateFilter = { createdAt: { $gte: startDate, $lte: now } };
  const dateRangeLabel = `${startDate.toLocaleDateString("en-PK")} – ${now.toLocaleDateString("en-PK")}`;

  // ── Fetch all data in parallel ────────────────────────────────
  const [bookings, users, tutorProfiles, requests, reviews] = await Promise.all([
    Booking.find(dateFilter)
      .populate("student", "name email")
      .populate("tutor", "name email"),
    User.find(dateFilter),
    TutorProfile.find({
      verificationStatus: "approved",
    }).populate("user", "name email"),
    Request.find(dateFilter).populate("student", "name"),
    Review.find(dateFilter),
  ]);

  // ── Derived calculations ──────────────────────────────────────
  const PLATFORM_FEE_PERCENT = 20;
  const GST_PERCENT = 15;
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.amount || 0), 0);
  const platformFeeTotal = Math.round(totalRevenue * (PLATFORM_FEE_PERCENT / 100));
  const gstTotal = Math.round(platformFeeTotal * (GST_PERCENT / 100));
  const tutorPayoutTotal = totalRevenue - platformFeeTotal;

  const bookingsByStatus = {
    upcoming:  bookings.filter(b => b.status === "upcoming").length,
    ongoing:   bookings.filter(b => b.status === "ongoing").length,
    completed: bookings.filter(b => b.status === "completed").length,
    cancelled: bookings.filter(b => b.status === "cancelled").length,
  };

  const newStudents = users.filter(u => u.role === "student").length;
  const newTutors   = users.filter(u => u.role === "tutor").length;

  // Tutor performance map
  const tutorMap: Record<string, {
    name: string; email: string;
    bookings: number; earnings: number; avgRating: number; totalReviews: number;
  }> = {};

  for (const b of bookings) {
    const tutor = b.tutor as unknown as { _id: { toString(): string }; name: string; email: string } | null;
    if (!tutor) continue;
    const tid = tutor._id.toString();
    if (!tutorMap[tid]) {
      tutorMap[tid] = { name: tutor.name, email: tutor.email, bookings: 0, earnings: 0, avgRating: 0, totalReviews: 0 };
    }
    tutorMap[tid].bookings++;
    tutorMap[tid].earnings += b.amount || 0;
  }

  // Add ratings from TutorProfile
  for (const tp of tutorProfiles) {
    const uid = (tp.user as unknown as { _id: { toString(): string } })._id.toString();
    if (tutorMap[uid]) {
      tutorMap[uid].avgRating = tp.averageRating || 0;
      tutorMap[uid].totalReviews = tp.totalReviews || 0;
    }
  }

  const tutorRows = Object.values(tutorMap).sort((a, b) => b.bookings - a.bookings);

  // Student activity map
  const studentMap: Record<string, {
    name: string; email: string; requests: number; bookings: number;
  }> = {};

  for (const r of requests) {
    const student = r.student as unknown as { _id: { toString(): string }; name: string } | null;
    if (!student) continue;
    const sid = student._id.toString();
    if (!studentMap[sid]) studentMap[sid] = { name: student.name, email: "", requests: 0, bookings: 0 };
    studentMap[sid].requests++;
  }

  for (const b of bookings) {
    const student = b.student as unknown as { _id: { toString(): string }; name: string; email: string } | null;
    if (!student) continue;
    const sid = student._id.toString();
    if (!studentMap[sid]) studentMap[sid] = { name: student.name, email: student.email, requests: 0, bookings: 0 };
    studentMap[sid].bookings++;
    studentMap[sid].email = student.email;
  }

  const studentRows = Object.values(studentMap).sort((a, b) => b.bookings - a.bookings);

  // ── EXCEL FORMAT ──────────────────────────────────────────────
  if (format === "excel") {
    const wb = new ExcelJS.Workbook();
    wb.creator = "TUTORERA®";
    wb.created = new Date();

    // ── Styles helpers ──
    const headerFill: ExcelJS.Fill = {
      type: "pattern", pattern: "solid",
      fgColor: { argb: "FF1A1A2E" },
    };
    const headerFont: Partial<ExcelJS.Font> = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    const sectionFill: ExcelJS.Fill = {
      type: "pattern", pattern: "solid",
      fgColor: { argb: "FFEFF6FF" },
    };
    const sectionFont: Partial<ExcelJS.Font> = { bold: true, color: { argb: "FF2563EB" }, size: 11 };

    const styleHeader = (row: ExcelJS.Row) => {
      row.eachCell(cell => {
        cell.fill = headerFill;
        cell.font = headerFont;
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = {
          bottom: { style: "thin", color: { argb: "FF2563EB" } },
        };
      });
      row.height = 22;
    };

    const styleSection = (row: ExcelJS.Row) => {
      row.eachCell(cell => {
        cell.fill = sectionFill;
        cell.font = sectionFont;
      });
    };

    // ════════════════════════════════════════
    // SHEET 1 — Summary
    // ════════════════════════════════════════
    const ws1 = wb.addWorksheet("Summary");
    ws1.columns = [
      { key: "a", width: 35 },
      { key: "b", width: 25 },
    ];

    ws1.addRow(["TUTORERA® Platform Report", ""]);
    ws1.mergeCells("A1:B1");
    const titleRow = ws1.getRow(1);
    titleRow.getCell(1).font = { bold: true, size: 16, color: { argb: "FF1A1A2E" } };
    titleRow.getCell(1).alignment = { horizontal: "center" };
    titleRow.height = 32;

    ws1.addRow([`${periodLabel} Report · ${dateRangeLabel}`, ""]);
    ws1.mergeCells("A2:B2");
    ws1.getRow(2).getCell(1).font = { size: 11, color: { argb: "FF6B7280" } };
    ws1.getRow(2).getCell(1).alignment = { horizontal: "center" };

    ws1.addRow([]);

    // Bookings summary
    styleSection(ws1.addRow(["📋 BOOKINGS SUMMARY", ""]));
    styleHeader(ws1.addRow(["Metric", "Value"]));
    [
      ["Total Bookings", bookings.length],
      ["Upcoming", bookingsByStatus.upcoming],
      ["Ongoing", bookingsByStatus.ongoing],
      ["Completed", bookingsByStatus.completed],
      ["Cancelled", bookingsByStatus.cancelled],
      ["Total Requests Posted", requests.length],
    ].forEach(([k, v]) => ws1.addRow([k, v]));

    ws1.addRow([]);

    // Revenue summary
    styleSection(ws1.addRow(["💰 REVENUE SUMMARY", ""]));
    styleHeader(ws1.addRow(["Metric", "Amount (PKR)"]));
    [
      ["Total Session Revenue", `Rs. ${totalRevenue.toLocaleString()}`],
      ["Platform Fee (20%)", `Rs. ${platformFeeTotal.toLocaleString()}`],
      ["GST on Platform Fee (15%)", `Rs. ${gstTotal.toLocaleString()}`],
      ["Total Tutor Payouts", `Rs. ${tutorPayoutTotal.toLocaleString()}`],
    ].forEach(([k, v]) => ws1.addRow([k, v]));

    ws1.addRow([]);

    // User summary
    styleSection(ws1.addRow(["👥 USER SUMMARY", ""]));
    styleHeader(ws1.addRow(["Metric", "Count"]));
    [
      ["New Students This Period", newStudents],
      ["New Tutors This Period", newTutors],
      ["Total Reviews This Period", reviews.length],
    ].forEach(([k, v]) => ws1.addRow([k, v]));

    // ════════════════════════════════════════
    // SHEET 2 — Bookings Detail
    // ════════════════════════════════════════
    const ws2 = wb.addWorksheet("Bookings Detail");
    ws2.columns = [
      { header: "Booking ID", key: "id", width: 28 },
      { header: "Student", key: "student", width: 22 },
      { header: "Tutor", key: "tutor", width: 22 },
      { header: "Amount (PKR)", key: "amount", width: 16 },
      { header: "Platform Fee", key: "fee", width: 16 },
      { header: "Tutor Payout", key: "payout", width: 16 },
      { header: "Status", key: "status", width: 14 },
      { header: "Teaching Mode", key: "mode", width: 16 },
      { header: "Date", key: "date", width: 16 },
    ];
    styleHeader(ws2.getRow(1));

    for (const b of bookings) {
      const fee = Math.round((b.amount || 0) * 0.30);
      const payout = (b.amount || 0) - fee;
      const student = b.student as unknown as { name: string } | null;
      const tutor   = b.tutor   as unknown as { name: string } | null;
      ws2.addRow({
        id:      b._id.toString(),
        student: student?.name || "—",
        tutor:   tutor?.name   || "—",
        amount:  b.amount || 0,
        fee,
        payout,
        status:  b.status,
        mode:    b.teachingMode,
        date:    new Date(b.createdAt).toLocaleDateString("en-PK"),
      });
    }

    // ════════════════════════════════════════
    // SHEET 3 — Tutor Performance
    // ════════════════════════════════════════
    const ws3 = wb.addWorksheet("Tutor Performance");
    ws3.columns = [
      { header: "Tutor Name", key: "name", width: 24 },
      { header: "Email", key: "email", width: 28 },
      { header: "Bookings", key: "bookings", width: 14 },
      { header: "Earnings (PKR)", key: "earnings", width: 18 },
      { header: "Avg. Rating", key: "rating", width: 14 },
      { header: "Total Reviews", key: "reviews", width: 16 },
    ];
    styleHeader(ws3.getRow(1));
    tutorRows.forEach(t => ws3.addRow({
      name: t.name, email: t.email,
      bookings: t.bookings, earnings: t.earnings,
      rating: t.avgRating.toFixed(1), reviews: t.totalReviews,
    }));

    // ════════════════════════════════════════
    // SHEET 4 — Student Activity
    // ════════════════════════════════════════
    const ws4 = wb.addWorksheet("Student Activity");
    ws4.columns = [
      { header: "Student Name", key: "name", width: 24 },
      { header: "Email", key: "email", width: 28 },
      { header: "Requests Posted", key: "requests", width: 18 },
      { header: "Bookings Made", key: "bookings", width: 18 },
    ];
    styleHeader(ws4.getRow(1));
    studentRows.forEach(s => ws4.addRow({
      name: s.name, email: s.email,
      requests: s.requests, bookings: s.bookings,
    }));

    // ── Stream response ──
    const filename = `tutorera-${period}-report-${now.toISOString().slice(0, 10)}.xlsx`;
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    await wb.xlsx.write(res);
    res.end();
    return;
  }

  // ── PDF FORMAT ────────────────────────────────────────────────
  if (format === "pdf") {
    const filename = `tutorera-${period}-report-${now.toISOString().slice(0, 10)}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    const doc = new PDFDocument({ margin: 50, size: "A4" });
    doc.pipe(res);

    // ── Helpers ──
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

    const drawTableRow = (
      cols: string[],
      widths: number[],
      isHeader = false,
      y?: number
    ) => {
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
      .text(`${periodLabel} Platform Report`, 50, 68);
    doc.fillColor("#6b7280").fontSize(10)
      .text(dateRangeLabel, 50, 88);
    doc.fillColor("#e94560").fontSize(10)
      .text(`Generated: ${now.toLocaleDateString("en-PK")}`, 50, 104);
    doc.y = 140;

    // ── 1. Bookings Summary ──
    drawSectionTitle("📋  BOOKINGS SUMMARY");
    const bCols = ["Metric", "Value"];
    const bWidths = [350, 145];
    drawTableRow(bCols, bWidths, true);
    [
      ["Total Bookings", bookings.length],
      ["Upcoming", bookingsByStatus.upcoming],
      ["Ongoing", bookingsByStatus.ongoing],
      ["Completed", bookingsByStatus.completed],
      ["Cancelled", bookingsByStatus.cancelled],
      ["Total Requests Posted", requests.length],
    ].forEach(([k, v]) => drawTableRow([String(k), String(v)], bWidths));

    // ── 2. Revenue ──
    drawSectionTitle("💰  REVENUE & FEES");
    const rWidths = [350, 145];
    drawTableRow(["Metric", "Amount (PKR)"], rWidths, true);
    [
      ["Total Session Revenue", `Rs. ${totalRevenue.toLocaleString()}`],
      ["Platform Fee (20%)", `Rs. ${platformFeeTotal.toLocaleString()}`],
      ["GST on Platform Fee (15%)", `Rs. ${gstTotal.toLocaleString()}`],
      ["Total Tutor Payouts", `Rs. ${tutorPayoutTotal.toLocaleString()}`],
    ].forEach(([k, v]) => drawTableRow([k, v], rWidths));

    // ── 3. User Summary ──
    drawSectionTitle("👥  USER SUMMARY");
    drawTableRow(["Metric", "Count"], [350, 145], true);
    [
      ["New Students This Period", newStudents],
      ["New Tutors This Period", newTutors],
      ["Total Reviews This Period", reviews.length],
    ].forEach(([k, v]) => drawTableRow([String(k), String(v)], [350, 145]));

    // ── 4. Tutor Performance ──
    doc.addPage();
    drawSectionTitle("🎓  TUTOR PERFORMANCE");
    const tWidths = [160, 160, 60, 75, 40];
    drawTableRow(["Name", "Email", "Bookings", "Earnings", "Rating"], tWidths, true);
    tutorRows.slice(0, 40).forEach(t =>
      drawTableRow([
        t.name, t.email,
        String(t.bookings),
        `Rs.${t.earnings.toLocaleString()}`,
        t.avgRating.toFixed(1),
      ], tWidths)
    );

    // ── 5. Student Activity ──
    doc.addPage();
    drawSectionTitle("📚  STUDENT ACTIVITY");
    const sWidths = [190, 180, 65, 60];
    drawTableRow(["Name", "Email", "Requests", "Bookings"], sWidths, true);
    studentRows.slice(0, 40).forEach(s =>
      drawTableRow([s.name, s.email, String(s.requests), String(s.bookings)], sWidths)
    );

    // ── Footer ──
    doc.fontSize(8).fillColor(COL_GRAY)
      .text(`TUTORERA® — Confidential · Generated ${now.toLocaleDateString("en-PK")}`, 50, 780, { align: "center" });

    doc.end();
    return;
  }

  res.status(400).json({ success: false, message: "Invalid format. Use pdf or excel." });
};