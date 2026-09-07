import { Response } from "express";
import { AuthRequest } from "../types";
import Booking from "../models/Booking.model";
import { creditReferrerOnFirstBooking } from "../controllers/referral.controller";
import sendEmail from "../utils/sendEmail";
import { bookingCancelledEmail } from "../utils/emailTemplates";
import User from "../models/User.model";
import { logAudit } from "../utils/logAudit";
import { sendNotification } from "../utils/socket";
import AbandonedJourney from "../models/AbandonedJourney.model";
import { syncStudentTutorRelationship } from "../services/relationship.service";

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
    .populate("request", "subject level status")
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
  await logAudit({ action: status === "cancelled" ? "booking_cancelled" : "booking_started", actor: req.user?.name, actorId: req.user?._id?.toString(), entity: "Booking", targetId: booking.id, metadata: { status, cancelReason } });
  const recipient = booking.student.toString() === userId?.toString() ? booking.tutor.toString() : booking.student.toString();
  await sendNotification(req.app.get("io"), recipient, { title: status === "cancelled" ? "Booking Cancelled" : "Booking Started", message: status === "cancelled" ? "The booking was cancelled. Review the cancellation policy or contact support if needed." : "Your tutoring booking is now in progress.", type: "booking", link: "/dashboard" });

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

// @desc    Build a prefilled repeat-booking request from a completed booking
// @route   POST /api/bookings/:id/book-again
// @access  Private (student)
export const bookAgainFromBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user?.role !== "student") {
    res.status(403).json({ success: false, message: "Only students can rebook a tutor from a completed booking." });
    return;
  }

  const booking = await Booking.findOne({ _id: req.params.id, student: req.user._id })
    .populate("tutor", "name")
    .populate("request", "subject level description curriculum classGrade examType learningObjectives countryCode countryName city area schedule teachingMode currency pricingUnit preferredDays preferredStartTime sessionDurationMinutes sessionsPerWeek");

  if (!booking) {
    res.status(404).json({ success: false, message: "Booking not found." });
    return;
  }

  if (booking.status !== "completed") {
    res.status(400).json({
      success: false,
      code: "BOOKING_NOT_COMPLETED",
      message: "Book Again becomes available after a session is completed.",
    });
    return;
  }

  const request = booking.request as any;
  const tutor = booking.tutor as any;
  const prefill = {
    tutorId: tutor?._id?.toString?.() || booking.tutor.toString(),
    tutorName: tutor?.name || "Tutor",
    subject: request?.subject || "Tutoring",
    level: request?.level || "Other",
    description: request?.description || request?.learningObjectives || `Continue learning with ${tutor?.name || "this tutor"}.`,
    curriculum: request?.curriculum || "",
    classGrade: request?.classGrade || "",
    examType: request?.examType || "",
    learningObjectives: request?.learningObjectives || "",
    teachingMode: booking.teachingMode || request?.teachingMode || "online",
    countryCode: request?.countryCode || "PK",
    countryName: request?.countryName || "Pakistan",
    city: request?.city || "",
    area: request?.area || "",
    schedule: request?.schedule || booking.schedule || "",
    preferredDays: request?.preferredDays || [],
    preferredStartTime: request?.preferredStartTime || "",
    sessionDurationMinutes: request?.sessionDurationMinutes || 60,
    sessionsPerWeek: request?.sessionsPerWeek || 1,
    budget: booking.finalAgreedRate || booking.amount,
    currency: request?.currency || "PKR",
    pricingUnit: booking.pricingUnit || request?.pricingUnit || "hour",
    allowCounterOffers: true,
    sourceBookingId: booking._id.toString(),
    rebooking: true,
  };

  await AbandonedJourney.findOneAndUpdate(
    { user: req.user._id, type: "direct_booking", completedAt: { $exists: false } },
    { $set: { data: prefill }, $setOnInsert: { user: req.user._id, type: "direct_booking", remindersSent: [] } },
    { upsert: true }
  );

  await syncStudentTutorRelationship(booking as any);
  await logAudit({
    action: "book_again_started",
    actor: req.user.name,
    actorId: req.user._id?.toString(),
    entity: "Booking",
    targetId: booking.id,
    metadata: { tutor: prefill.tutorId, subject: prefill.subject },
  });

  res.status(200).json({
    success: true,
    message: "Repeat booking details prepared.",
    prefill,
    redirectTo: "/post-tuition-request",
  });
};
