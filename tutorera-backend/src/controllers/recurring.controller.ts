import { Response } from "express";
import { AuthRequest } from "../types";
import RecurringPlan from "../models/RecurringPlan.model";
import RecurringBooking from "../models/RecurringBooking.model";
import StudentTutorRelationship from "../models/StudentTutorRelationship.model";
import Booking from "../models/Booking.model";

export const getAvailablePlans = async (_req: AuthRequest, res: Response): Promise<void> => {
  const plans = await RecurringPlan.find({ isActive: true })
    .sort({ sessionCount: 1 })
    .lean();

  res.status(200).json({ success: true, plans });
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

export const subscribeToPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  const { tutorId, subject, planId, dayOfWeek, timeOfDay } = req.body;

  if (!tutorId || !subject || !planId) {
    res.status(400).json({ success: false, message: "tutorId, subject, and planId are required." });
    return;
  }

  const plan = await RecurringPlan.findById(planId);
  if (!plan || !plan.isActive) {
    res.status(404).json({ success: false, message: "Plan not found or inactive." });
    return;
  }

  const existingActive = await RecurringBooking.findOne({
    student: req.user?._id,
    tutor: tutorId,
    subject,
    status: "active",
  });

  if (existingActive) {
    res.status(409).json({ success: false, message: "You already have an active recurring plan for this tutor and subject." });
    return;
  }

  const nextBillingDate = new Date();
  nextBillingDate.setDate(nextBillingDate.getDate() + 7 * plan.durationWeeks);

  const recurringBooking = await RecurringBooking.create({
    student: req.user?._id,
    tutor: tutorId,
    subject,
    plan: plan._id,
    planType: plan.type,
    sessionsRemaining: plan.sessionCount,
    sessionsCompleted: 0,
    sessionsUsed: [],
    dayOfWeek,
    timeOfDay,
    startDate: new Date(),
    nextBillingDate,
    status: "active",
    totalPaid: 0,
  });

  await StudentTutorRelationship.findOneAndUpdate(
    { student: req.user?._id, tutor: tutorId, subject },
    { currentRecurringArrangement: plan.type },
    { upsert: true, new: true }
  );

  res.status(201).json({ success: true, recurringBooking });
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
    { _id: id, student: req.user?._id, status: "paused" },
    { status: "active" },
    { new: true }
  );

  if (!booking) {
    res.status(404).json({ success: false, message: "Paused recurring booking not found." });
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

  const recurringBooking = await RecurringBooking.findOne({
    _id: bookingId,
    tutor: req.user?._id,
    status: "active",
  });

  if (!recurringBooking) {
    res.status(404).json({ success: false, message: "Active recurring booking not found." });
    return;
  }

  const sessionIndex = parseInt(id as string, 10);
  if (recurringBooking.sessionsUsed.includes(sessionIndex)) {
    res.status(400).json({ success: false, message: "Session already recorded." });
    return;
  }

  recurringBooking.sessionsUsed.push(sessionIndex);
  recurringBooking.sessionsCompleted += 1;
  recurringBooking.sessionsRemaining = Math.max(0, recurringBooking.sessionsRemaining - 1);

  if (recurringBooking.sessionsRemaining === 0) {
    recurringBooking.status = "completed";
  }

  await recurringBooking.save();

  await StudentTutorRelationship.findOneAndUpdate(
    { student: recurringBooking.student, tutor: req.user?._id, subject: recurringBooking.subject },
    {
      $inc: { completedBookings: 1, repeatBookingCount: 1 },
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
