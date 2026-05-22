import { Types } from "mongoose";
import { Response } from "express";
import { AuthRequest } from "../types";
import Request from "../models/Request.model";
import Bid from "../models/Bid.model";
import Booking from "../models/Booking.model";
import { sendNotification } from "../utils/socket";

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
  const { subject, level, city, page = "1", limit = "10" } = req.query;
  const filter: Record<string, unknown> = { status: "open" };

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
  const request = await Request.findById(req.params.id);
  if (!request || request.status !== "open") {
    res.status(400).json({ success: false, message: "Request not available for bidding" });
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

// After bid is created, add:
const io = req.app.get("io");
await sendNotification(io, request.student.toString(), {
  title: "📬 New Bid Received",
  message: `A tutor has placed a bid of Rs. ${req.body.amount} on your tuition request.`,
  type: "bid",
  link: `/requests/${req.params.id}/bids`,
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
  const request = await Request.findOne({ 
    _id: new Types.ObjectId(req.params.id as string), 
    student: req.user?._id 
  });
  if (!request || request.status !== "open") {
    res.status(400).json({ success: false, message: "Request not available" });
    return;
  }

  const bid = await Bid.findById(new Types.ObjectId(req.params.bidId as string));
  if (!bid) {
    res.status(404).json({ success: false, message: "Bid not found" });
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

  // Auto-create booking
  const booking = await Booking.create({
    student: req.user?._id,
    tutor: bid.tutor,
    request: request._id,
    bid: bid._id,
    amount: bid.amount,
    schedule: request.schedule,
    teachingMode: request.teachingMode,
  });

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
    title: "📅 Booking Confirmed",
    message: "Your booking has been created successfully. Check your dashboard.",
    type: "booking",
    link: "/dashboard",
  });

  res.status(200).json({
    success: true,
    message: "Bid accepted. Booking created successfully.",
    booking,
  });
};