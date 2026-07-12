import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.model";
import { logAudit } from "../utils/logAudit";
import { sendTokenResponse } from "../utils/generateToken";
import { AuthRequest } from "../types";

// Plan limits reference
const PLAN_BID_LIMITS: Record<string, number> = { free: 3, standard: 10, premium: -1 };
const PLAN_REQUEST_LIMITS: Record<string, number> = { free: 2, standard: 10, premium: -1 };

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

  await logAudit({
    action: "user_registered",
    actor: "System",
    entity: "User",
    targetId: user._id.toString(),
    targetName: user.name,
    metadata: { role: user.role, email: user.email },
  });
  
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

  if (user.authProvider === "google" && !user.password) {
    res.status(400).json({
      success: false,
      message: "This account uses Google Sign-In. Please log in with Google.",
    });
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

// @desc    Google Sign-In / Sign-Up
// @route   POST /api/auth/google
export const googleAuth = async (req: Request, res: Response): Promise<void> => {
  const { idToken } = req.body;

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    res.status(401).json({ success: false, message: "Invalid Google token" });
    return;
  }

  if (!payload || !payload.email) {
    res.status(401).json({ success: false, message: "Could not verify Google account" });
    return;
  }

  const { sub: googleId, email, name, picture } = payload;

  // 1. Existing user linked to this Google account
  let user = await User.findOne({ googleId });

  // 2. Existing local account with the same email — link it
  if (!user) {
    user = await User.findOne({ email });
    if (user) {
      user.googleId = googleId;
      if (!user.avatar) user.avatar = picture || "";
      await user.save();
    }
  }

  let isNewUser = false;

  // 3. No existing user at all — create one, role undecided
  if (!user) {
    isNewUser = true;
    user = await User.create({
      name: name || email.split("@")[0],
      email,
      googleId,
      authProvider: "google",
      role: "pending",
      avatar: picture || "",
    });

    await logAudit({
      action: "user_registered",
      actor: "System",
      entity: "User",
      targetId: user._id.toString(),
      targetName: user.name,
      metadata: { role: user.role, email: user.email, via: "google" },
    });
  }

  if (!user.isActive) {
    res.status(403).json({ success: false, message: "Your account has been deactivated" });
    return;
  }

  const token = require("../utils/generateToken").generateToken(user._id.toString(), user.role);
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
  };
  res.cookie("token", token, cookieOptions);

  res.status(isNewUser ? 201 : 200).json({
    success: true,
    token,
    needsRole: user.role === "pending",
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      isApproved: user.isApproved,
      avatar: user.avatar,
    },
  });
};

// @desc    Set role for a Google user who registered as "pending"
// @route   PATCH /api/auth/select-role
export const selectRole = async (req: AuthRequest, res: Response): Promise<void> => {
  const { role } = req.body;

  const user = await User.findById(req.user?._id);
  if (!user) {
    res.status(404).json({ success: false, message: "User not found" });
    return;
  }

  if (user.role !== "pending") {
    res.status(400).json({ success: false, message: "Role has already been set for this account" });
    return;
  }

  user.role = role;
  await user.save();

  await logAudit({
    action: "user_role_selected",
    actor: user.name,
    entity: "User",
    targetId: user._id.toString(),
    targetName: user.name,
    metadata: { role },
  });

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
      bidsThisMonth: user.bidsThisMonth || 0,
      bidLimit,
      requestsThisMonth: (user as any).requestsThisMonth || 0,
      requestLimit,
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

  if (user.authProvider === "google" && !user.password) {
    res.status(400).json({
      success: false,
      message: "This account uses Google Sign-In and has no password to change",
    });
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
export const upgradePlan = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
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