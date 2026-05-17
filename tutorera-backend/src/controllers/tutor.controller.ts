import { Response } from "express";
import { AuthRequest } from "../types";
import TutorProfile from "../models/TutorProfile.model";
import User from "../models/User.model";

// @desc    Create or update tutor profile
// @route   POST /api/tutors/profile
// @access  Private (tutor only)
export const createOrUpdateProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const userId = req.user?._id;

  let profile = await TutorProfile.findOne({ user: userId });

  if (profile) {
    // Update existing profile
    profile = await TutorProfile.findOneAndUpdate(
      { user: userId },
      { ...req.body },
      { new: true, runValidators: true }
    ).populate("user", "name email avatar phone city");

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      profile,
    });
    return;
  }

  // Create new profile
  profile = await TutorProfile.create({
    user: userId,
    ...req.body,
  });

  await profile.populate("user", "name email avatar phone city");

  res.status(201).json({
    success: true,
    message: "Profile created successfully",
    profile,
  });
};

// @desc    Get my tutor profile
// @route   GET /api/tutors/profile/me
// @access  Private (tutor only)
export const getMyProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const profile = await TutorProfile.findOne({ user: req.user?._id }).populate(
    "user",
    "name email avatar phone city"
  );

  if (!profile) {
    res.status(404).json({ success: false, message: "Profile not found" });
    return;
  }

  res.status(200).json({ success: true, profile });
};

// @desc    Get tutor by ID (public)
// @route   GET /api/tutors/:id
// @access  Public
export const getTutorById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const profile =
    (await TutorProfile.findById(req.params.id).populate(
      "user",
      "name email avatar phone city"
    )) ??
    (await TutorProfile.findOne({ user: req.params.id }).populate(
      "user",
      "name email avatar phone city"
    ));

  if (!profile) {
    res.status(404).json({ success: false, message: "Tutor not found" });
    return;
  }

  res.status(200).json({ success: true, profile });
};

// @desc    Get all tutors with search & filter
// @route   GET /api/tutors
// @access  Public
export const getAllTutors = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const {
    subject,
    level,
    city,
    teachingMode,
    minPrice,
    maxPrice,
    minRating,
    page = "1",
    limit = "10",
    sort = "-averageRating",
  } = req.query;

  // Build filter object
  const filter: Record<string, unknown> = {
    verificationStatus: "approved",
  };

  if (subject) {
    filter.subjects = { $in: [new RegExp(subject as string, "i")] };
  }

  if (level) {
    filter.levels = { $in: [level] };
  }

  if (city) {
    filter.city = new RegExp(city as string, "i");
  }

  if (teachingMode) {
    filter.teachingMode = teachingMode;
  }

  if (minPrice || maxPrice) {
    filter.hourlyRate = {
      ...(minPrice ? { $gte: Number(minPrice) } : {}),
      ...(maxPrice ? { $lte: Number(maxPrice) } : {}),
    };
  }

  if (minRating) {
    filter.averageRating = { $gte: Number(minRating) };
  }

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  const total = await TutorProfile.countDocuments(filter);
  const tutors = await TutorProfile.find(filter)
    .populate("user", "name email avatar city")
    .sort(sort as string)
    .skip(skip)
    .limit(limitNum);

  res.status(200).json({
    success: true,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    tutors,
  });
};