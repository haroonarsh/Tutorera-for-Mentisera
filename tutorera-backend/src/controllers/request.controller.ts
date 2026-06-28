import { Types } from "mongoose";
import { Response } from "express";
import { AuthRequest } from "../types";
import Request from "../models/Request.model";
import Bid from "../models/Bid.model";
import Booking from "../models/Booking.model";
import { sendNotification } from "../utils/socket";
import { TOTAL_FEE_PERCENT } from "../config/constants";
import { incrementBidCount } from "../middlewares/bidLimit.middleware";
import BookedSlot from "../models/BookedSlot.model";

// @desc    Create tuition request
// @route   POST /api/requests
// @access  Private (student)
export const createRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  const request = await Request.create({ student: req.user?._id, ...req.body });
  res.status(201).json({ success: true, message: "Request created", request });
};

// @desc    Get all open requests (tutors browse)
// @route   GET /api/requests
// @access  Private
export const getAllRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  // Block unapproved tutors
  if (req.user?.role === "tutor") {
    const TutorProfile = (await import("../models/TutorProfile.model")).default;
    const profile = await TutorProfile.findOne({ user: req.user._id });
    if (!profile || profile.verificationStatus !== "approved") {
      res.status(403).json({
        success: false,
        code: "TUTOR_NOT_APPROVED",
        message: "Your profile must be approved before you can browse requests.",
      });
      return;
    }
  }

  const { subject, level, city, page = "1", limit = "10" } = req.query;
  const filter: Record<string, unknown> = { status: "open", isDirect: { $ne: true }, };

  if (subject) filter.subject = new RegExp(subject as string, "i");
  if (level) filter.level = level;
  if (city) filter.city = new RegExp(city as string, "i");

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const total = await Request.countDocuments(filter);
  const requests = await Request.find(filter)
    .populate("student", "name city avatar")
    .sort("-createdAt")
    .skip(skip)
    .limit(limitNum);

  res.status(200).json({ success: true, total, page: pageNum, requests });
};

// @desc    Get my requests (student)
// @route   GET /api/requests/my
// @access  Private (student)
export const getMyRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  const requests = await Request.find({ student: req.user?._id }).sort("-createdAt");
  res.status(200).json({ success: true, requests });
};

// @desc    Cancel request
// @route   PATCH /api/requests/:id/cancel
// @access  Private (student)
export const cancelRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  const request = await Request.findOne({ _id: req.params.id, student: req.user?._id });
  if (!request) {
    res.status(404).json({ success: false, message: "Request not found" });
    return;
  }
  request.status = "cancelled";
  await request.save();
  res.status(200).json({ success: true, message: "Request cancelled" });
};

// @desc    Place a bid on a request
// @route   POST /api/requests/:id/bids
// @access  Private (tutor)
export const placeBid = async (req: AuthRequest, res: Response): Promise<void> => {
  // Block unapproved tutors
  const TutorProfile = (await import("../models/TutorProfile.model")).default;
  const tutorProfile = await TutorProfile.findOne({ user: req.user?._id });
  if (!tutorProfile || tutorProfile.verificationStatus !== "approved") {
    res.status(403).json({
      success: false,
      code: "TUTOR_NOT_APPROVED",
      message: "Your profile must be approved before you can place bids.",
    });
    return;
  }

  const request = await Request.findById(req.params.id);
  if (!request || request.status !== "open") {
    res.status(400).json({ success: false, message: "Request not available for bidding" });
    return;
  }

  // ← NEW: block bidding on direct requests not targeted at this tutor
  if (request.isDirect && request.targetTutor?.toString() !== req.user?._id?.toString()) {
    res.status(403).json({ success: false, message: "This is a private booking request." });
    return;
  }

  // Check if tutor already bid
  const existingBid = await Bid.findOne({ request: req.params.id, tutor: req.user?._id });
  if (existingBid) {
    res.status(400).json({ success: false, message: "You already placed a bid on this request" });
    return;
  }

const bid = await Bid.create({
    request: new Types.ObjectId(req.params.id as string),
    tutor: req.user?._id,
    amount: req.body.amount,
    message: req.body.message,
});

await incrementBidCount(req.user?._id?.toString() || "");

// After bid is created, add:
const io = req.app.get("io");
await sendNotification(io, request.student.toString(), {
  title: "📬 New Bid Received",
  message: `A tutor has placed a bid of Rs. ${req.body.amount} on your tuition request.`,
  type: "bid",
  link: "/dashboard",
});

  res.status(201).json({ success: true, message: "Bid placed successfully", bid });
};

// @desc    Get all bids for a request
// @route   GET /api/requests/:id/bids
// @access  Private (student who owns the request)
export const getBidsForRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  const request = await Request.findOne({ _id: req.params.id, student: req.user?._id });
  if (!request) {
    res.status(404).json({ success: false, message: "Request not found" });
    return;
  }

  const bids = await Bid.find({ request: req.params.id })
    .populate("tutor", "name avatar city")
    .sort("-createdAt");

  res.status(200).json({ success: true, total: bids.length, bids });
};

// @desc    Accept a bid → creates booking automatically
// @route   PATCH /api/requests/:id/bids/:bidId/accept
// @access  Private (student)
export const acceptBid = async (req: AuthRequest, res: Response): Promise<void> => {
  const request = await Request.findById(new Types.ObjectId(req.params.id as string));

  if (!request || request.status !== "open") {
    res.status(400).json({ success: false, message: "Request not available" });
    return;
  }

  const bid = await Bid.findById(new Types.ObjectId(req.params.bidId as string));
  if (!bid) {
    res.status(404).json({ success: false, message: "Bid not found" });
    return;
  }

  // Authorization: either the student who owns the request, OR the tutor on a direct request accepting their own bid
  const isOwner = request.student.toString() === req.user?._id?.toString();
  const isDirectTutorAccept = request.isDirect && bid.tutor.toString() === req.user?._id?.toString();

  if (!isOwner && !isDirectTutorAccept) {
    res.status(403).json({ success: false, message: "Not authorized to accept this bid" });
    return;
  }

  // Accept this bid
  bid.status = "accepted";
  await bid.save();

  // Reject all other bids
  await Bid.updateMany(
  { request: new Types.ObjectId(req.params.id as string), _id: { $ne: bid._id } },
  { status: "rejected" }
);

  // Close the request
  request.status = "closed";
  await request.save();

  // Auto-detect if this is the first booking between this student and this tutor
  const existingBookingsCount = await Booking.countDocuments({
     student: request.student,
    tutor: bid.tutor,
  });

  // When creating booking
  const platformFee = Math.round(bid.amount * TOTAL_FEE_PERCENT / 100);
  const tutorPayout = bid.amount - platformFee;

  // Auto-create booking
  const booking = await Booking.create({
    student: request.student,
    tutor: bid.tutor,
    request: request._id,
    bid: bid._id,
    amount: bid.amount,
    platformFee,
    tutorPayout,
    schedule: request.schedule,
    teachingMode: request.teachingMode,
    isFirstSession: existingBookingsCount === 0,
  });

  // lock the slot if it's a direct booking with a slot
if (request.isDirect && request.selectedDate && request.selectedStartTime && request.selectedEndTime) {
  await BookedSlot.create({
    tutor: bid.tutor,
    student: request.student,
    booking: booking._id,
    date: new Date(request.selectedDate),
    startTime: request.selectedStartTime,
    endTime: request.selectedEndTime,
  });
}

  const io = req.app.get("io");

  // Notify tutor
  await sendNotification(io, bid.tutor.toString(), {
    title: "✅ Bid Accepted!",
    message: "Your bid has been accepted! A booking has been created.",
    type: "booking",
    link: "/dashboard",
  });

  // Notify student
  await sendNotification(io, request.student.toString(), {
    title: "📅 Booking Confirmed — Payment Required",
    message: `Your booking has been created! Please send Rs. ${bid.amount.toLocaleString()} to NayaPay ID: mentisera@nayapay and email proof to billing@tutorera.pk.`,
    type: "booking",
    link: "/dashboard",
  });

  res.status(200).json({
    success: true,
    message: "Bid accepted. Booking created successfully.",
    booking,
  });
};

// @desc    Create a direct booking request targeted at a specific tutor
// @route   POST /api/requests/direct
// @access  Private (student)
export const createDirectBookingRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  const { tutorId, subject, level, description, teachingMode, city, schedule, selectedDate, selectedStartTime, selectedEndTime } = req.body;

  if (!tutorId || !subject || !level || !description || !schedule) {
    res.status(400).json({ success: false, message: "Missing required fields." });
    return;
  }

  // Fetch tutor's profile to get their listed rate + verify they're approved
  const TutorProfile = (await import("../models/TutorProfile.model")).default;
  const tutorProfile = await TutorProfile.findOne({ user: tutorId });
  if (!tutorProfile || tutorProfile.verificationStatus !== "approved") {
    res.status(404).json({ success: false, message: "Tutor not found or not available for booking." });
    return;
  }

  // Prevent duplicate direct requests to the same tutor while one is still pending
  const existingPending = await Request.findOne({
    student: req.user?._id,
    targetTutor: tutorId,
    status: "open",
  });
  if (existingPending) {
    res.status(400).json({
      success: false,
      message: "You already have a pending booking request with this tutor.",
    });
    return;
  }

  // Create the private request
  const request = await Request.create({
    student: req.user?._id,
    subject,
    level,
    description,
    budget: tutorProfile.hourlyRate,
    teachingMode: teachingMode || tutorProfile.teachingMode,
    city: city || tutorProfile.city,
    schedule: selectedDate && selectedStartTime
      ? `${selectedDate} ${selectedStartTime}–${selectedEndTime}`
      : schedule,
    targetTutor: tutorId,
    isDirect: true,
    selectedDate: selectedDate || "",
    selectedStartTime: selectedStartTime || "",
    selectedEndTime: selectedEndTime || "",
  });

  // Auto-create the bid at the tutor's listed rate
  const bid = await Bid.create({
    request: request._id,
    tutor: tutorId,
    amount: tutorProfile.hourlyRate,
    message: "Direct booking request",
    isDirect: true,
  });

  // Notify tutor
  const io = req.app.get("io");
  await sendNotification(io, tutorId, {
    title: "📩 New Direct Booking Request",
    message: `${req.user?.name} wants to book a session with you for ${subject}.`,
    type: "booking",
    link: "/dashboard?tab=requests",
  });

  res.status(201).json({
    success: true,
    message: "Booking request sent to the tutor. You'll be notified once they respond.",
    request,
    bid,
  });
};

// @desc    Get direct booking requests for the logged-in tutor
// @route   GET /api/requests/direct/my
// @access  Private (tutor)
export const getMyDirectRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  const requests = await Request.find({
    targetTutor: req.user?._id,
    isDirect: true,
    status: "open",
  })
    .populate("student", "name city avatar")
    .sort("-createdAt");

  // Attach the bid (always exactly one — the auto-created one) for each request
  const requestsWithBid = await Promise.all(
    requests.map(async (r) => {
      const bid = await Bid.findOne({ request: r._id, tutor: req.user?._id });
      return { ...r.toObject(), bid };
    })
  );

  res.status(200).json({ success: true, total: requestsWithBid.length, requests: requestsWithBid });
};

// @desc    Reject a bid (used for direct booking decline, or general reject)
// @route   PATCH /api/requests/:id/bids/:bidId/reject
// @access  Private (student who owns the request, OR the tutor on a direct request)
export const rejectBid = async (req: AuthRequest, res: Response): Promise<void> => {
  const bid = await Bid.findById(req.params.bidId);
  if (!bid) {
    res.status(404).json({ success: false, message: "Bid not found" });
    return;
  }

  const request = await Request.findById(req.params.id);
  if (!request) {
    res.status(404).json({ success: false, message: "Request not found" });
    return;
  }

  // Allow either the student who owns the request, or the tutor (only for direct requests)
  const isOwner = request.student.toString() === req.user?._id?.toString();
  const isTargetTutorDecline = request.isDirect && bid.tutor.toString() === req.user?._id?.toString();

  if (!isOwner && !isTargetTutorDecline) {
    res.status(403).json({ success: false, message: "Not authorized to reject this bid" });
    return;
  }

  bid.status = "rejected";
  await bid.save();

  // If this was a direct request and the tutor declined, close the request entirely
  if (request.isDirect && isTargetTutorDecline) {
    request.status = "cancelled";
    await request.save();

    const io = req.app.get("io");
    await sendNotification(io, request.student.toString(), {
      title: "Booking Request Declined",
      message: `The tutor was unable to accept your booking request for ${request.subject}.`,
      type: "booking",
      link: "/dashboard",
    });
  }

  res.status(200).json({ success: true, message: "Bid rejected", bid });
};