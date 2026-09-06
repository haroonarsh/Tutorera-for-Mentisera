import { Response } from "express";
import { AuthRequest } from "../types";
import Notification from "../models/Notification.model";
import User from "../models/User.model";

// @desc    Get my notifications
// @route   GET /api/notifications
// @access  Private
export const getMyNotifications = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { page = "1", limit = "20" } = req.query;
  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 20));
  const skip = (pageNum - 1) * limitNum;

  const total = await Notification.countDocuments({ user: req.user?._id });

  const notifications = await Notification.find({ user: req.user?._id })
    .sort("-createdAt")
    .skip(skip)
    .limit(limitNum);

  const unreadCount = await Notification.countDocuments({
    user: req.user?._id,
    isRead: false,
  });

  res.status(200).json({
    success: true,
    notifications,
    unreadCount,
    pagination: {
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      limit: limitNum,
    },
  });
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
export const markAsRead = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user?._id },
    { isRead: true }
  );
  res.status(200).json({ success: true });
};

// @desc    Mark all as read
// @route   PATCH /api/notifications/read-all
// @access  Private
export const markAllAsRead = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  await Notification.updateMany(
    { user: req.user?._id, isRead: false },
    { isRead: true }
  );
  res.status(200).json({ success: true, message: "All marked as read" });
};

// @desc    Get notification preferences
// @route   GET /api/notifications/preferences
// @access  Private
export const getNotificationPreferences = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const user = await User.findById(req.user?._id).select("notificationPreferences");
  const defaults = {
    emailNotifications: true,
    pushNotifications: true,
    bookingUpdates: true,
    bidNotifications: true,
    chatMessages: true,
    paymentUpdates: true,
    securityAlerts: true,
    platformUpdates: false,
  };

  res.status(200).json({
    success: true,
    preferences: user?.notificationPreferences || defaults,
  });
};

// @desc    Update notification preferences
// @route   PATCH /api/notifications/preferences
// @access  Private
export const updateNotificationPreferences = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { preferences } = req.body;
  if (!preferences || typeof preferences !== "object") {
    res.status(400).json({ success: false, message: "Invalid preferences data" });
    return;
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { notificationPreferences: preferences } },
    { new: true, runValidators: true }
  ).select("notificationPreferences");

  res.status(200).json({
    success: true,
    preferences: updatedUser?.notificationPreferences,
    message: "Notification preferences updated successfully",
  });
};