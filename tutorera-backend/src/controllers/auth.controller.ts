import { Request, Response } from "express";
import User from "../models/User.model";
import { sendTokenResponse } from "../utils/generateToken";
import { AuthRequest } from "../types";

// Plan limits reference
const PLAN_BID_LIMITS: Record<string, number> = { free: 3, standard: 10, premium: -1 };
const PLAN_REQUEST_LIMITS: Record<string, number> = { free: 2, standard: 10, premium: -1 };

// @desc    Register user
// @route   POST /api/auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, role, phone, city } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400).json({ success: false, message: "Email already registered" });
    return;
  }

  const user = await User.create({ name, email, password, role, phone, city });
  sendTokenResponse(user, 201, res);
};

// @desc    Login user
// @route   POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    res.status(401).json({ success: false, message: "Invalid email or password" });
    return;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    res.status(401).json({ success: false, message: "Invalid email or password" });
    return;
  }

  if (!user.isActive) {
    res.status(403).json({ success: false, message: "Your account has been deactivated" });
    return;
  }

  sendTokenResponse(user, 200, res);
};

// @desc    Logout user
// @route   POST /api/auth/logout
export const logout = async (req: Request, res: Response): Promise<void> => {
  res.cookie("token", "", { expires: new Date(0), httpOnly: true });
  res.status(200).json({ success: true, message: "Logged out successfully" });
};

// @desc    Get current user
// @route   GET /api/auth/me
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.user?._id);
  res.status(200).json({ success: true, user });
};

// @desc    Get current user's plan usage
// @route   GET /api/auth/me/usage
// @access  Private
export const getMyUsage = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.user?._id);
  if (!user) {
    res.status(404).json({ success: false, message: "User not found" });
    return;
  }
 
  const plan = user.plan || "free";
  const bidLimit = PLAN_BID_LIMITS[plan];
  const requestLimit = PLAN_REQUEST_LIMITS[plan];
 
  res.status(200).json({
    success: true,
    usage: {
      plan,
      // Tutor usage
      bidsThisMonth: user.bidsThisMonth || 0,
      bidLimit, // -1 means unlimited
      // Student usage
      requestsThisMonth: (user as any).requestsThisMonth || 0,
      requestLimit, // -1 means unlimited
    },
  });
};

// @desc    Update personal info
// @route   PATCH /api/auth/update-profile
// @access  Private
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, phone, city } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { name, phone, city },
    { new: true, runValidators: true }
  );

  if (!user) {
    res.status(404).json({ success: false, message: "User not found" });
    return;
  }

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user,
  });
};

// @desc    Change password
// @route   PATCH /api/auth/change-password
// @access  Private
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id).select("+password");
  if (!user) {
    res.status(404).json({ success: false, message: "User not found" });
    return;
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    res.status(400).json({ success: false, message: "Current password is incorrect" });
    return;
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({ success: true, message: "Password changed successfully" });
};

// @desc    Upgrade user plan — ADMIN ONLY
// @route   PATCH /api/auth/upgrade-plan
// @access  Private (admin)
// Used by the admin panel to manually activate a plan after confirming NayaPay payment.
export const upgradePlan = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  // Only admins can upgrade plans — payment is confirmed manually
  if (req.user?.role !== "admin") {
    res.status(403).json({
      success: false,
      message: "Plan upgrades are processed manually after payment confirmation. Please transfer payment to NayaPay and email proof to billing@tutorera.pk",
    });
    return;
  }
 
  const { plan, userId } = req.body;
 
  if (!["free", "standard", "premium"].includes(plan)) {
    res.status(400).json({ success: false, message: "Invalid plan" });
    return;
  }
 
  // Admin can upgrade any user (pass userId in body), or themselves
  const targetId = userId || req.user?._id;
 
  const user = await User.findByIdAndUpdate(
    targetId,
    { plan },
    { new: true }
  );
 
  if (!user) {
    res.status(404).json({ success: false, message: "User not found" });
    return;
  }
 
  res.status(200).json({
    success: true,
    message: `Plan updated to ${plan}`,
    user,
  });
};