import { Response } from "express";
import { AuthRequest } from "../types";
import StudentProfile from "../models/StudentProfile.model";
import User from "../models/User.model";

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