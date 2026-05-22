import { Response } from "express";
import { AuthRequest } from "../types";
import TutorProfile from "../models/TutorProfile.model";
import StudentProfile from "../models/StudentProfile.model";
import User from "../models/User.model";
import Booking from "../models/Booking.model";
import Contact from "../models/Contact.model";
import { sendNotification } from "../utils/socket";

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
  const { paymentStatus, paymentNote, payoutStatus, payoutNote } = req.body;

  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    res.status(404).json({ success: false, message: "Booking not found" });
    return;
  }

  // Update only fields that are provided
  if (paymentStatus !== undefined) booking.paymentStatus = paymentStatus;
  if (paymentNote !== undefined) booking.paymentNote = paymentNote;
  if (payoutStatus !== undefined) booking.payoutStatus = payoutStatus;
  if (payoutNote !== undefined) booking.payoutNote = payoutNote;

  await booking.save();

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