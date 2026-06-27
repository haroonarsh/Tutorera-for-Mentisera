import { Response } from "express";
import { AuthRequest } from "../types";
import StudentRating from "../models/StudentRating.model";
import Booking from "../models/Booking.model";

// @desc    Tutor rates a student
// @route   POST /api/student-ratings
// @access  Private (tutor)
export const rateStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  const { studentId, bookingId, rating, comment } = req.body;

  if (!rating || !comment || !bookingId || !studentId) {
    res.status(400).json({ success: false, message: "All fields are required." });
    return;
  }

  if (comment.trim().length < 10) {
    res.status(400).json({ success: false, message: "Comment must be at least 10 characters." });
    return;
  }

  // Verify booking exists, belongs to this tutor, and is completed
  const booking = await Booking.findOne({
    _id: bookingId,
    tutor: req.user?._id,
    student: studentId,
    status: "completed",
  });

  if (!booking) {
    res.status(400).json({ success: false, message: "No completed booking found for this student." });
    return;
  }

  // Check duplicate
  const existing = await StudentRating.findOne({ booking: bookingId, tutor: req.user?._id });
  if (existing) {
    res.status(400).json({ success: false, message: "You already rated this student for this session." });
    return;
  }

  const studentRating = await StudentRating.create({
    student: studentId,
    tutor: req.user?._id,
    booking: bookingId,
    rating,
    comment,
  });

  res.status(201).json({ success: true, message: "Student rated successfully.", studentRating });
};

// @desc    Get all student ratings (admin only)
// @route   GET /api/admin/student-ratings
// @access  Private (admin)
export const getAllStudentRatings = async (req: AuthRequest, res: Response): Promise<void> => {
  const ratings = await StudentRating.find()
    .populate("student", "name email avatar")
    .populate("tutor", "name email")
    .populate("booking", "amount schedule createdAt")
    .sort("-createdAt");

  res.status(200).json({ success: true, total: ratings.length, ratings });
};

// @desc    Get ratings for a specific student (admin)
// @route   GET /api/admin/student-ratings/:studentId
// @access  Private (admin)
export const getStudentRatings = async (req: AuthRequest, res: Response): Promise<void> => {
  const ratings = await StudentRating.find({ student: req.params.studentId })
    .populate("tutor", "name email avatar")
    .populate("booking", "amount schedule createdAt")
    .sort("-createdAt");

  const avgRating = ratings.length > 0
    ? Math.round((ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length) * 10) / 10
    : 0;

  res.status(200).json({ success: true, total: ratings.length, avgRating, ratings });
};