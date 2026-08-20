import { Response } from "express";
import { AuthRequest } from "../types";
import Booking from "../models/Booking.model";
import { creditReferrerOnFirstBooking } from "../controllers/referral.controller";
import sendEmail from "../utils/sendEmail";
import { bookingCancelledEmail } from "../utils/emailTemplates";
import User from "../models/User.model";

// @desc    Get my bookings
// @route   GET /api/bookings
// @access  Private
export const getMyBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?._id;
  const role = req.user?.role;
  const { page = "1", limit = "20" } = req.query;

  const filter = role === "student" ? { student: userId } : { tutor: userId };

  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 20));
  const skip = (pageNum - 1) * limitNum;

  const total = await Booking.countDocuments(filter);

  const bookings = await Booking.find(filter)
    .populate("student", "name avatar")
    .populate("tutor", "name avatar")
    .sort("-createdAt")
    .skip(skip)
    .limit(limitNum);

  res.status(200).json({
    success: true,
    total,
    bookings,
    pagination: {
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      limit: limitNum,
    },
  });
};

// @desc    Update booking status (student/tutor — limited, safe transitions only)
// @route   PATCH /api/bookings/:id/status
// @access  Private
export const updateBookingStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const { status, cancelReason } = req.body;
  const userId = req.user?._id;
  const isStudent = req.user?.role === "student";
  const isTutor = req.user?.role === "tutor";

  const booking = await Booking.findOne({
    _id: req.params.id,
    $or: [{ student: userId }, { tutor: userId }],
  });

  if (!booking) {
    res.status(404).json({ success: false, message: "Booking not found" });
    return;
  }

  // ── Explicit, role-restricted state machine ──
  // Students may only cancel an upcoming booking.
  // Tutors may only start (mark ongoing) an upcoming booking, or cancel it.
  // Nobody but admin can mark a booking "completed" — that's a payment-sensitive transition.
  const allowedTransitions: Record<string, string[]> = {
    student: ["cancelled"],
    tutor: ["ongoing", "cancelled"],
  };

  const actorRole = isStudent ? "student" : isTutor ? "tutor" : null;
  if (!actorRole || !allowedTransitions[actorRole].includes(status)) {
    res.status(403).json({
      success: false,
      message: "You are not allowed to set this booking status. Completion must be confirmed by an admin.",
    });
    return;
  }

  if (booking.status !== "upcoming") {
    res.status(400).json({
      success: false,
      message: `Booking is already "${booking.status}" and cannot be changed from here.`,
    });
    return;
  }

  booking.status = status;
  if (status === "cancelled" && cancelReason) {
    booking.cancelReason = cancelReason;
  }

  await booking.save();

  if (status === "cancelled") {
    try {
      const [studentUser, tutorUser] = await Promise.all([
        User.findById(booking.student).select("name email"),
        User.findById(booking.tutor).select("name email"),
      ]);
      if (studentUser && tutorUser) {
        const studentMail = bookingCancelledEmail(studentUser.name, tutorUser.name);
        const tutorMail = bookingCancelledEmail(tutorUser.name, studentUser.name);
        await Promise.all([
          sendEmail({ to: studentUser.email, subject: studentMail.subject, html: studentMail.html }),
          sendEmail({ to: tutorUser.email, subject: tutorMail.subject, html: tutorMail.html }),
        ]);
      }
    } catch (err) {
      console.error("Failed to send cancellation emails:", err);
    }
  }

  res.status(200).json({ success: true, message: "Booking status updated", booking });
};