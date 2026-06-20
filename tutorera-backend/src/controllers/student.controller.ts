import { Response } from "express";
import { AuthRequest } from "../types";
import StudentProfile from "../models/StudentProfile.model";
import User from "../models/User.model";
import TutorProfile from "../models/TutorProfile.model";
import { Types } from "mongoose";

// @desc    Save student onboarding
// @route   POST /api/students/onboarding
// @access  Private (student)
export const saveStudentOnboarding = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const {
    fullName, phone, city, gender, dateOfBirth,
    currentLevel, institution, subjectsNeeded,
    budgetRange, teachingModePreference,
  } = req.body;

  // Update user name
  await User.findByIdAndUpdate(req.user?._id, {
    name: fullName,
    phone,
    city,
  });

  // Create or update student profile
  const profile = await StudentProfile.findOneAndUpdate(
    { user: req.user?._id },
    {
      user: req.user?._id,
      fullName, phone, city, gender, dateOfBirth,
      currentLevel, institution, subjectsNeeded,
      budgetRange, teachingModePreference,
      onboardingComplete: true,
    },
    { upsert: true, new: true }
  );

  res.status(200).json({
    success: true,
    message: "Onboarding completed successfully",
    profile,
  });
};

// @desc    Get student profile
// @route   GET /api/students/profile/me
// @access  Private (student)
export const getMyStudentProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const profile = await StudentProfile.findOne({ user: req.user?._id })
    .populate("user", "name email avatar");

  res.status(200).json({ success: true, profile });
};

// @desc    Toggle a tutor as favourite
// @route   POST /api/students/favourites/:tutorId
// @access  Private (student)
export const toggleFavourite = async (req: AuthRequest, res: Response): Promise<void> => {
  const tutorId = req.params.tutorId as string;

  // Verify tutor exists
  const tutorExists = await TutorProfile.findById(tutorId);
  if (!tutorExists) {
    res.status(404).json({ success: false, message: "Tutor not found" });
    return;
  }

  let profile = await StudentProfile.findOne({ user: req.user?._id });
  if (!profile) {
    profile = await StudentProfile.create({ user: req.user?._id });
  }

  const alreadyFavourited = profile.favouriteTutors.some(
    (id) => id.toString() === tutorId
  );

  if (alreadyFavourited) {
    profile.favouriteTutors = profile.favouriteTutors.filter(
      (id) => id.toString() !== tutorId
    );
  } else {
    profile.favouriteTutors.push(new Types.ObjectId(tutorId));
  }

  await profile.save();

  res.status(200).json({
    success: true,
    isFavourited: !alreadyFavourited,
    message: alreadyFavourited ? "Removed from favourites" : "Added to favourites",
  });
};

// @desc    Get all favourite tutors (full data)
// @route   GET /api/students/favourites
// @access  Private (student)
export const getFavourites = async (req: AuthRequest, res: Response): Promise<void> => {
  const profile = await StudentProfile.findOne({ user: req.user?._id });

  if (!profile || profile.favouriteTutors.length === 0) {
    res.status(200).json({ success: true, total: 0, tutors: [] });
    return;
  }

  const tutors = await TutorProfile.find({
    _id: { $in: profile.favouriteTutors },
  }).populate("user", "name email avatar city");

  res.status(200).json({ success: true, total: tutors.length, tutors });
};

// @desc    Get just the list of favourited tutor IDs (lightweight, for UI state)
// @route   GET /api/students/favourites/ids
// @access  Private (student)
export const getFavouriteIds = async (req: AuthRequest, res: Response): Promise<void> => {
  const profile = await StudentProfile.findOne({ user: req.user?._id });
  res.status(200).json({
    success: true,
    favouriteIds: profile?.favouriteTutors.map((id) => id.toString()) || [],
  });
};