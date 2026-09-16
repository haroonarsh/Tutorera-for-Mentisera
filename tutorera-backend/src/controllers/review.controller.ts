import { Response } from "express";
import { AuthRequest } from "../types";
import Review from "../models/Review.model";
import TutorProfile from "../models/TutorProfile.model";
import Booking from "../models/Booking.model";

// @desc    Create review
// @route   POST /api/reviews/:tutorId
// @access  Private (student)
export const createReview = async (req: AuthRequest, res: Response): Promise<void> => {
  const { rating, comment, bookingId } = req.body;
  const tutorId = Array.isArray(req.params.tutorId) ? req.params.tutorId[0] : req.params.tutorId;
  const studentId = req.user?._id;

  // Verify booking exists and is completed
  const booking = await Booking.findOne({
    _id: bookingId,
    student: studentId,
    tutor: tutorId,
    status: "completed",
  });

  if (!booking) {
    res.status(400).json({ success: false, message: "No completed booking found for this tutor" });
    return;
  }

  // Check duplicate review
  const existing = await Review.findOne({ booking: bookingId, student: studentId });
  if (existing) {
    res.status(400).json({ success: false, message: "You already reviewed this session" });
    return;
  }

  // Create review
  const review = await Review.create({
    tutor: tutorId,
    student: studentId,
    booking: bookingId,
    rating,
    comment,
  });

  // Update tutor average rating
  const allReviews = await Review.find({ tutor: tutorId });
  const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

  await TutorProfile.findOneAndUpdate(
    { user: tutorId },
    {
      averageRating: Math.round(avgRating * 10) / 10,
      totalReviews: allReviews.length,
    }
  );

  res.status(201).json({ success: true, message: "Review submitted successfully", review });
};

// @desc    Get reviews for a tutor
// @route   GET /api/reviews/:tutorId
// @access  Public
export const getTutorReviews = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = "1", limit = "10" } = req.query;
  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 10));
  const skip = (pageNum - 1) * limitNum;

  const total = await Review.countDocuments({ tutor: req.params.tutorId });

  const reviews = await Review.find({ tutor: req.params.tutorId })
    .populate("student", "name avatar")
    .sort("-createdAt")
    .skip(skip)
    .limit(limitNum);

  res.status(200).json({
    success: true,
    total,
    reviews,
    pagination: {
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      limit: limitNum,
    },
  });
};

// @desc    Get all tutor ratings (admin only)
// @route   GET /api/admin/tutor-ratings
// @access  Private (admin)
export const getAllTutorRatings = async (req: AuthRequest, res: Response): Promise<void> => {
  const ratings = await Review.find()
    .populate("tutor", "name email avatar")
    .populate("student", "name email")
    .populate("booking", "amount schedule createdAt")
    .sort("-createdAt");

  res.status(200).json({ success: true, total: ratings.length, ratings });
};

// @desc    Get ratings for a specific tutor (admin)
// @route   GET /api/admin/tutor-ratings/:tutorId
// @access  Private (admin)
export const getTutorRatingsForAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  const ratings = await Review.find({ tutor: req.params.tutorId })
    .populate("student", "name email avatar")
    .populate("booking", "amount schedule createdAt")
    .sort("-createdAt");

  const avgRating = ratings.length > 0
    ? Math.round((ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length) * 10) / 10
    : 0;

  res.status(200).json({ success: true, total: ratings.length, avgRating, ratings });
};