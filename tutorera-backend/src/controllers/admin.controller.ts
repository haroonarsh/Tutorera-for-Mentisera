import { Response } from "express";
import { AuthRequest } from "../types";
import TutorProfile from "../models/TutorProfile.model";
import User from "../models/User.model";

// @desc    Get all pending verifications
// @route   GET /api/admin/verifications
// @access  Private (admin only)
export const getPendingVerifications = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const tutors = await TutorProfile.find({
    verificationStatus: "pending",
  }).populate("user", "name email phone city");

  res.status(200).json({ success: true, total: tutors.length, tutors });
};

// @desc    Approve or reject tutor
// @route   PATCH /api/admin/verify/:id
// @access  Private (admin only)
export const verifyTutor = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
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
  await profile.save();

  res.status(200).json({
    success: true,
    message: `Tutor ${status} successfully`,
    profile,
  });
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (admin only)
export const getAllUsers = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { role, page = "1", limit = "20" } = req.query;
  const filter: Record<string, unknown> = {};
  if (role) filter.role = role;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const total = await User.countDocuments(filter);
  const users = await User.find(filter)
    .skip(skip)
    .limit(limitNum)
    .sort("-createdAt");

  res.status(200).json({ success: true, total, page: pageNum, users });
};

// @desc    Deactivate or activate user
// @route   PATCH /api/admin/users/:id/status
// @access  Private (admin only)
export const toggleUserStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404).json({ success: false, message: "User not found" });
    return;
  }

  user.isActive = !user.isActive;
  await user.save();

  res.status(200).json({
    success: true,
    message: `User ${user.isActive ? "activated" : "deactivated"} successfully`,
  });
};