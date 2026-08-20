import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.model";
import { logAudit } from "../utils/logAudit";
import { sendTokenResponse } from "../utils/generateToken";
import { AuthRequest } from "../types";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail";
import { welcomeEmail, tutorPendingEmail, planUpgradedEmail } from "../utils/emailTemplates";


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

  try {
    if (user.role === "tutor") {
      const { subject, html } = tutorPendingEmail(user.name);
      await sendEmail({ to: user.email, subject, html });
    } else {
      const { subject, html } = welcomeEmail(user.name);
      await sendEmail({ to: user.email, subject, html });
    }
  } catch (err) {
    console.error("Failed to send registration email:", err);
  }

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

// @desc    Request password reset OTP
// @route   POST /api/auth/forgot-password
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  // Always return generic success — prevents email enumeration
  const genericResponse = {
    success: true,
    message: "If that email is registered, a verification code has been sent.",
  };

  if (!user) {
    res.status(200).json(genericResponse);
    return;
  }

  if (user.authProvider === "google" && !user.password) {
    // Don't reveal account type either — same generic message
    res.status(200).json(genericResponse);
    return;
  }

  // Generate 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

  user.resetPasswordToken = hashedOtp;
  user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  await user.save();

  try {
    await sendEmail({
      to: user.email,
      subject: "TUTORERA® — Password Reset Code",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1a1a2e;">Password Reset Code</h2>
          <p style="color: #374151;">Hi ${user.name},</p>
          <p style="color: #374151;">Use the code below to reset your TUTORERA® password. This code expires in 10 minutes.</p>
          <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1a1a2e;">${otp}</span>
          </div>
          <p style="color: #6b7280; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });
  } catch (err) {
    // Roll back the OTP if email fails, so a stale unusable OTP doesn't linger
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    res.status(500).json({ success: false, message: "Failed to send email. Please try again." });
    return;
  }

  res.status(200).json(genericResponse);
};

// @desc    Reset password using OTP
// @route   POST /api/auth/reset-password
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { email, otp, newPassword } = req.body;

  const user = await User.findOne({ email }).select("+password +resetPasswordToken +resetPasswordExpire");

  if (!user || !user.resetPasswordToken || !user.resetPasswordExpire) {
    res.status(400).json({ success: false, message: "Invalid or expired code" });
    return;
  }

  if (user.resetPasswordExpire.getTime() < Date.now()) {
    res.status(400).json({ success: false, message: "Code has expired. Please request a new one." });
    return;
  }

  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
  if (hashedOtp !== user.resetPasswordToken) {
    res.status(400).json({ success: false, message: "Invalid code" });
    return;
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  await logAudit({
    action: "password_reset",
    actor: user.name,
    entity: "User",
    targetId: user._id.toString(),
    targetName: user.name,
  });

  res.status(200).json({ success: true, message: "Password reset successfully. You can now log in." });
};

// @desc    Upgrade user plan — ADMIN ONLY
// @route   PATCH /api/auth/upgrade-plan
// @access  Private (admin)
export const upgradePlan = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
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

  try {
    const { subject, html } = planUpgradedEmail(user.name, plan);
    await sendEmail({ to: user.email, subject, html });
  } catch (err) {
    console.error("Failed to send plan upgrade email:", err);
  }

  res.status(200).json({
    success: true,
    message: `Plan updated to ${plan}`,
    user,
  });
};