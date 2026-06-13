import { Response } from "express";
import { AuthRequest } from "../types";
import TutorProfile from "../models/TutorProfile.model";
import User from "../models/User.model";
import { uploadToCloudinary } from "../utils/uploadToCloudinary";

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

// @desc    Get onboarding status
// @route   GET /api/tutors/onboarding/status
// @access  Private (tutor)
export const getOnboardingStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  let profile = await TutorProfile.findOne({ user: req.user?._id });

  if (!profile) {
    // Create empty profile
    profile = await TutorProfile.create({ user: req.user?._id });
  }

  res.status(200).json({
    success: true,
    onboardingStep: profile.onboardingStep,
    onboardingComplete: profile.onboardingComplete,
    verificationStatus: profile.verificationStatus,
    rejectionReason: profile.rejectionReason || "",
  });
};

// @desc    Save onboarding step data
// @route   POST /api/tutors/onboarding/step
// @access  Private (tutor)
export const saveOnboardingStep = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { step, data } = req.body;
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  let profile = await TutorProfile.findOne({ user: req.user?._id });
  if (!profile) {
    profile = await TutorProfile.create({ user: req.user?._id });
  }

  const stepNum = parseInt(step);
  let updateData: Record<string, unknown> = {};

  // Parse data
  const parsedData = typeof data === "string" ? JSON.parse(data) : data;

  if (stepNum === 1) {
    // Personal Info
    updateData = {
      fullName: parsedData.fullName,
      phone: parsedData.phone,
      city: parsedData.city,
      gender: parsedData.gender,
      dateOfBirth: parsedData.dateOfBirth,
      onboardingStep: 2,
    };
    // Update user name too
    await User.findByIdAndUpdate(req.user?._id, {
      name: parsedData.fullName,
      phone: parsedData.phone,
      city: parsedData.city,
    });
  }

  else if (stepNum === 2) {
    // Education
    let degreeDocUrl = "";
    if (files?.degreeDoc?.[0]) {
      const result = await uploadToCloudinary(
        files.degreeDoc[0].buffer,
        "tutorera/degrees",
        "auto"
      );
      degreeDocUrl = result.secure_url;
    }

    const education = [{
      degree: parsedData.degree,
      institution: parsedData.institution,
      year: parseInt(parsedData.year),
      degreeDoc: degreeDocUrl,
    }];

    updateData = { education, onboardingStep: 3 };
  }

  else if (stepNum === 3) {
    // Experience
    updateData = {
      experience: parseInt(parsedData.experience),
      previousInstitutions: parsedData.previousInstitutions || [],
      subjects: parsedData.subjects || [],
      levels: parsedData.levels || [],
      onboardingStep: 4,
    };
  }

  else if (stepNum === 4) {
    // Profile Setup
    updateData = {
      bio: parsedData.bio,
      hourlyRate: parseInt(parsedData.hourlyRate),
      teachingMode: parsedData.teachingMode,
      availability: parsedData.availability || [],
      onboardingStep: 5,
    };
  }

  else if (stepNum === 5) {
    // Verification Docs
    let cnicFrontUrl = "";
    let cnicBackUrl = "";
    let videoIntroUrl = "";
    let policeCertificateUrl = "";

    if (files?.cnicFront?.[0]) {
      const result = await uploadToCloudinary(files.cnicFront[0].buffer, "tutorera/cnic");
      cnicFrontUrl = result.secure_url;
    }
    if (files?.cnicBack?.[0]) {
      const result = await uploadToCloudinary(files.cnicBack[0].buffer, "tutorera/cnic");
      cnicBackUrl = result.secure_url;
    }
    if (files?.videoIntro?.[0]) {
      const result = await uploadToCloudinary(files.videoIntro[0].buffer, "tutorera/videos", "auto");
      videoIntroUrl = result.secure_url;
    }
    if (files?.policeCertificate?.[0]) {
      const result = await uploadToCloudinary(
        files.policeCertificate[0].buffer,
        "tutorera/police-certificates",
        "auto"   // accepts both image and PDF
      );
      policeCertificateUrl = result.secure_url;
    }
    // Validation: in-person tutors MUST upload police certificate
    const teachingMode = profile.teachingMode;
      if ((teachingMode === "in-person" || teachingMode === "both") && !policeCertificateUrl) {
        res.status(400).json({
        success: false,
        message: "Police clearance certificate is required for in-person tutoring.",
      });
      return;
    }

    updateData = {
      ...(cnicFrontUrl && { cnicFront: cnicFrontUrl }),
      ...(cnicBackUrl && { cnicBack: cnicBackUrl }),
      ...(videoIntroUrl && { videoIntro: videoIntroUrl }),
      ...(policeCertificateUrl && { policeCertificate: policeCertificateUrl }),
      onboardingStep: 5,
      onboardingComplete: true,
      verificationStatus: "pending",
    };
  }

  // Save to DB
  const updated = await TutorProfile.findOneAndUpdate(
    { user: req.user?._id },
    updateData,
    { new: true }
  );

  res.status(200).json({
    success: true,
    message: `Step ${stepNum} saved successfully`,
    profile: updated,
  });
};