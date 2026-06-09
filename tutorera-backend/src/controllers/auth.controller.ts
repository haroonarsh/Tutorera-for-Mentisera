import { Request, Response } from "express";
import User from "../models/User.model";
import { sendTokenResponse } from "../utils/generateToken";
import { AuthRequest } from "../types";

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