import { Response } from "express";
import { AuthRequest } from "../types";
import StudentProfile from "../models/StudentProfile.model";
import User from "../models/User.model";
import TutorProfile from "../models/TutorProfile.model";
import { advanceAccountStatus } from "../services/accountLifecycle.service";
import { Types } from "mongoose";
import { resolveMarket } from "../services/market.service";
import { resolveLocationReferences } from "../services/locationReference.service";

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
    countryCode, countryName, timezone, currency, country, region, cityRef, locality,
  } = req.body;

  const market = await resolveMarket(countryCode || req.user?.countryCode || "PK");
  if (!market || !market.isActive || !market.studentRegistration) {
    res.status(422).json({ success: false, code: "MARKET_UNAVAILABLE", message: "Student onboarding is not available in the selected market." });
    return;
  }
  let locationReferences: Record<string, unknown>;
  try {
    locationReferences = await resolveLocationReferences({ country, region, cityRef, locality, city }, market.countryCode);
  } catch (error: any) {
    res.status(422).json({ success: false, code: "INVALID_LOCATION_REFERENCE", message: error.message });
    return;
  }
  const resolvedCity = (locationReferences.city as string | undefined) || city;
  const resolvedTimezone = timezone || (locationReferences.timezone as string | undefined) || market.timezone;

  // Update user name
  await User.findByIdAndUpdate(req.user?._id, {
    name: fullName,
    phone,
    city: resolvedCity,
    countryCode: market.countryCode,
    countryName: market.countryName,
    timezone: resolvedTimezone,
    currency: market.currency,
    ...locationReferences,
  });

  // Create or update student profile
  const profile = await StudentProfile.findOneAndUpdate(
    { user: req.user?._id },
    {
      user: req.user?._id,
      fullName, phone, city: resolvedCity, gender, dateOfBirth,
      countryCode: market.countryCode, countryName: market.countryName, timezone: resolvedTimezone, currency: market.currency,
      ...locationReferences,
      currentLevel, institution, subjectsNeeded,
      budgetRange, teachingModePreference,
      onboardingComplete: true,
    },
    { upsert: true, new: true }
  );

  await advanceAccountStatus(req.user!._id.toString(), "profile_complete");

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

// @desc    Link a parent guardian to my account
// @route   POST /api/students/guardians
// @access  Private (student)
export const linkParentGuardian = async (req: AuthRequest, res: Response): Promise<void> => {
  const { parentProfileId, parentUserId, name, email } = req.body;

  if (!parentProfileId && !parentUserId && !email) {
    res.status(400).json({ success: false, message: "parentProfileId, parentUserId, or email is required." });
    return;
  }

  let parentProfile;
  if (parentProfileId) {
    const ParentProfile = (await import("../models/ParentProfile.model")).default;
    parentProfile = await ParentProfile.findById(parentProfileId);
  } else if (parentUserId) {
    const ParentProfile = (await import("../models/ParentProfile.model")).default;
    parentProfile = await ParentProfile.findOne({ user: new Types.ObjectId(parentUserId) });
  } else if (email) {
    const parentUser = await User.findOne({ email: email.toLowerCase(), role: "parent" });
    if (!parentUser) {
      res.status(404).json({ success: false, message: "No parent account found with that email." });
      return;
    }
    const ParentProfile = (await import("../models/ParentProfile.model")).default;
    parentProfile = await ParentProfile.findOne({ user: parentUser._id });
  }

  if (!parentProfile) {
    res.status(404).json({ success: false, message: "Parent profile not found." });
    return;
  }

  const alreadyLinked = parentProfile.children.some(
    (c) => c.studentUser?.toString() === req.user?._id?.toString()
  );

  if (alreadyLinked) {
    res.status(409).json({ success: false, message: "This parent is already linked to your account." });
    return;
  }

  parentProfile.children.push({
    studentUser: req.user!._id,
    name: name || req.user?.name || "Student",
    level: "",
    subjects: [],
    relationship: "child",
  } as any);

  await parentProfile.save();

  const parentUser = await User.findById(parentProfile.user).select("email");
  await User.findByIdAndUpdate(req.user?._id, {
    parentGuardianEmail: parentUser?.email || email || "",
    parentGuardianName: name || "",
  });

  res.status(200).json({ success: true, message: "Parent guardian linked successfully.", parentProfile });
};

// @desc    Remove a parent guardian from my account
// @route   DELETE /api/students/guardians/:parentProfileId
// @access  Private (student)
export const unlinkParentGuardian = async (req: AuthRequest, res: Response): Promise<void> => {
  const { parentProfileId } = req.params;

  const ParentProfile = (await import("../models/ParentProfile.model")).default;
  const parentProfile = await ParentProfile.findById(parentProfileId);

  if (!parentProfile) {
    res.status(404).json({ success: false, message: "Parent profile not found." });
    return;
  }

  const before = parentProfile.children.length;
  parentProfile.children = parentProfile.children.filter(
    (c) => c.studentUser?.toString() !== req.user?._id?.toString()
  );

  if (parentProfile.children.length === before) {
    res.status(404).json({ success: false, message: "Parent guardian not found in your account." });
    return;
  }

  await parentProfile.save();

  await User.findByIdAndUpdate(req.user?._id, {
    parentGuardianEmail: "",
    parentGuardianName: "",
  });

  res.status(200).json({ success: true, message: "Parent guardian unlinked." });
};

// @desc    Get my linked parent guardians
// @route   GET /api/students/guardians
// @access  Private (student)
export const getMyParentGuardians = async (req: AuthRequest, res: Response): Promise<void> => {
  const UserModel = await import("../models/User.model");
  const ParentProfile = (await import("../models/ParentProfile.model")).default;

  const allParentProfiles = await ParentProfile.find({ "children.studentUser": req.user?._id }).lean();

  const guardians = await Promise.all(
    allParentProfiles.map(async (p) => {
      const parentUser = await UserModel.default.findById(p.user).select("name email").lean();
      const childEntry = p.children.find((c) => c.studentUser?.toString() === req.user?._id?.toString());
      return {
        parentProfileId: p._id,
        parentUserId: p.user,
        parentName: parentUser?.name || "",
        parentEmail: parentUser?.email || "",
        relationship: childEntry?.relationship || "parent",
        linkedAt: childEntry?._id?.getTimestamp ? childEntry._id.getTimestamp() : new Date(),
      };
    })
  );

  res.status(200).json({ success: true, guardians });
};
