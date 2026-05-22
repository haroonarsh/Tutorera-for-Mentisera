import { Response } from "express";
import { AuthRequest } from "../types";
import Notification from "../models/Notification.model";

// @desc    Get my notifications
// @route   GET /api/notifications
// @access  Private
export const getMyNotifications = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const notifications = await Notification.find({ user: req.user?._id })
    .sort("-createdAt")
    .limit(20);

  const unreadCount = await Notification.countDocuments({
    user: req.user?._id,
    isRead: false,
  });

  res.status(200).json({ success: true, notifications, unreadCount });
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