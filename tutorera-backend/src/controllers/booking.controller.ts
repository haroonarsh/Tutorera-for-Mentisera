import { Response } from "express";
import { AuthRequest } from "../types";
import Booking from "../models/Booking.model";

// @desc    Get my bookings
// @route   GET /api/bookings
// @access  Private
export const getMyBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?._id;
  const role = req.user?.role;

  const filter = role === "student" ? { student: userId } : { tutor: userId };

  const bookings = await Booking.find(filter)
    .populate("student", "name avatar")
    .populate("tutor", "name avatar")
    .sort("-createdAt");

  res.status(200).json({ success: true, total: bookings.length, bookings });
};

// @desc    Update booking status
// @route   PATCH /api/bookings/:id/status
// @access  Private
export const updateBookingStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const { status, cancelReason } = req.body;
  const userId = req.user?._id;

  const booking = await Booking.findOne({
    _id: req.params.id,
    $or: [{ student: userId }, { tutor: userId }],
  });

  if (!booking) {
    res.status(404).json({ success: false, message: "Booking not found" });
    return;
  }

  booking.status = status;
  if (status === "cancelled" && cancelReason) {
    booking.cancelReason = cancelReason;
  }

  await booking.save();

  res.status(200).json({ success: true, message: "Booking status updated", booking });
};