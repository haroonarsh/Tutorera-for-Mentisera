import { Response } from "express";
import { AuthRequest } from "../types";
import RecurringPlan from "../models/RecurringPlan.model";
import RecurringBooking from "../models/RecurringBooking.model";
import StudentTutorRelationship from "../models/StudentTutorRelationship.model";

const recurringBillingCapability = {
  enabled: false,
  code: "RECURRING_BILLING_UNAVAILABLE",
  message: "Recurring plan checkout is not available yet. Book an individual lesson instead.",
} as const;

export const getAvailablePlans = async (_req: AuthRequest, res: Response): Promise<void> => {
  const plans = await RecurringPlan.find({ isActive: true })
    .sort({ sessionCount: 1 })
    .lean();

  res.status(200).json({ success: true, plans, subscription: recurringBillingCapability });
};

export const getMyRecurringBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  const { status } = req.query;
  const filter: any = { student: req.user?._id };

  if (status) filter.status = status;

  const bookings = await RecurringBooking.find(filter)
    .populate("tutor", "name")
    .populate("plan", "name type sessionCount totalPrice")
    .sort("-createdAt")
    .lean();

  res.status(200).json({ success: true, bookings });
};

export const getRecurringBookingsForTutor = async (req: AuthRequest, res: Response): Promise<void> => {
  const { status } = req.query;
  const filter: any = { tutor: req.user?._id };

  if (status) filter.status = status;

  const bookings = await RecurringBooking.find(filter)
    .populate("student", "name")
    .populate("plan", "name type sessionCount totalPrice")
    .sort("-createdAt")
    .lean();

  res.status(200).json({ success: true, bookings });
};

export const subscribeToPlan = async (_req: AuthRequest, res: Response): Promise<void> => {
  // A subscription must only be created by a verified payment callback. There
  // is no recurring mandate/checkout provider configured yet, so this endpoint
  // deliberately fails closed instead of creating an unpaid active booking.
  res.status(503).json({ success: false, ...recurringBillingCapability });
};

export const pauseRecurringBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const booking = await RecurringBooking.findOneAndUpdate(
    { _id: id, student: req.user?._id, status: "active" },
    { status: "paused" },
    { new: true }
  );

  if (!booking) {
    res.status(404).json({ success: false, message: "Active recurring booking not found." });
    return;
  }

  await StudentTutorRelationship.findOneAndUpdate(
    { student: req.user?._id, tutor: booking.tutor, subject: booking.subject },
    { currentRecurringArrangement: "none", relationshipStatus: "paused" }
  );

  res.status(200).json({ success: true, booking });
};

export const resumeRecurringBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const booking = await RecurringBooking.findOneAndUpdate(
    { _id: id, student: req.user?._id, status: "paused", paymentStatus: "confirmed" },
    { status: "active" },
    { new: true }
  );

  if (!booking) {
    res.status(409).json({ success: false, message: "Only a paid, paused recurring booking can be resumed." });
    return;
  }

  await StudentTutorRelationship.findOneAndUpdate(
    { student: req.user?._id, tutor: booking.tutor, subject: booking.subject },
    { currentRecurringArrangement: booking.planType, relationshipStatus: "active" }
  );

  res.status(200).json({ success: true, booking });
};

export const cancelRecurringBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const booking = await RecurringBooking.findOneAndUpdate(
    { _id: id, student: req.user?._id },
    { status: "cancelled" },
    { new: true }
  );

  if (!booking) {
    res.status(404).json({ success: false, message: "Recurring booking not found." });
    return;
  }

  await StudentTutorRelationship.findOneAndUpdate(
    { student: req.user?._id, tutor: booking.tutor, subject: booking.subject },
    { currentRecurringArrangement: "none", relationshipStatus: "ended" }
  );

  res.status(200).json({ success: true, booking });
};

export const recordSessionUse = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id, bookingId } = req.params;

  const sessionIndex = Number(id);
  if (!Number.isSafeInteger(sessionIndex) || sessionIndex < 1) {
    res.status(400).json({ success: false, message: "A valid positive session number is required." });
    return;
  }

  const recurringBooking = await RecurringBooking.findOneAndUpdate(
    {
      _id: bookingId,
      tutor: req.user?._id,
      status: "active",
      paymentStatus: "confirmed",
      sessionsRemaining: { $gt: 0 },
      sessionsUsed: { $ne: sessionIndex },
    },
    {
      $addToSet: { sessionsUsed: sessionIndex },
      $inc: { sessionsCompleted: 1, sessionsRemaining: -1 },
    },
    { new: true }
  );

  if (!recurringBooking) {
    res.status(409).json({ success: false, message: "This session was already recorded, or the recurring plan is not active and paid." });
    return;
  }

  if (recurringBooking.sessionsRemaining === 0) {
    recurringBooking.status = "completed";
    await recurringBooking.save();
  }

  await StudentTutorRelationship.findOneAndUpdate(
    { student: recurringBooking.student, tutor: req.user?._id, subject: recurringBooking.subject },
    {
      lastSessionAt: new Date(),
    }
  );

  res.status(200).json({ success: true, recurringBooking });
};

export const getPlanStats = async (req: AuthRequest, res: Response): Promise<void> => {
  const tutorId = req.user?.role === "tutor" ? req.user._id : req.params.tutorId;

  const activeBookings = await RecurringBooking.countDocuments({
    tutor: tutorId,
    status: "active",
  });

  const totalSessionsDelivered = await RecurringBooking.aggregate([
    { $match: { tutor: tutorId as any, status: { $in: ["active", "completed"] } } },
    { $group: { _id: null, total: { $sum: "$sessionsCompleted" } } },
  ]);

  const revenueData = await RecurringBooking.aggregate([
    { $match: { tutor: tutorId as any, status: { $in: ["active", "completed"] } } },
    { $group: { _id: null, totalRevenue: { $sum: "$totalPaid" } } },
  ]);

  res.status(200).json({
    success: true,
    stats: {
      activeRecurringBookings: activeBookings,
      totalSessionsDelivered: totalSessionsDelivered[0]?.total ?? 0,
      totalRevenue: revenueData[0]?.totalRevenue ?? 0,
    },
  });
};
