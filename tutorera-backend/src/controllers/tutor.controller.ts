import { Response } from "express";
import { AuthRequest } from "../types";
import TutorProfile from "../models/TutorProfile.model";
import User from "../models/User.model";
import TutorAvailability from "../models/TutorAvailability.model";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/uploadToCloudinary";
import { verifyFileSignature } from "../middlewares/upload.middleware";

const DOCUMENT_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const VIDEO_TYPES = ["video/mp4"];

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
    let degreeDocPublicId = "";

    if (files?.degreeDoc?.[0]) {
      const { valid, detectedType } = await verifyFileSignature(files.degreeDoc[0].buffer, DOCUMENT_TYPES);
      if (!valid) {
        res.status(400).json({ success: false, message: `Degree document is invalid (detected: ${detectedType || "unknown"})` });
        return;
      }

      // Delete old degree doc if this tutor is re-uploading (education array has one entry currently)
      const oldPublicId = profile.education?.[0]?.degreeDocPublicId;
      if (oldPublicId) {
        await deleteFromCloudinary(oldPublicId).catch(() => {});
      }

      const result = await uploadToCloudinary(
        files.degreeDoc[0].buffer,
        "tutorera/degrees",
        "auto",
        true // private — academic records are sensitive
      );
      degreeDocUrl = result.secure_url;
      degreeDocPublicId = result.public_id;
    }

    const education = [{
      degree: parsedData.degree,
      institution: parsedData.institution,
      year: parseInt(parsedData.year),
      degreeDoc: degreeDocUrl || profile.education?.[0]?.degreeDoc || "",
      degreeDocPublicId: degreeDocPublicId || profile.education?.[0]?.degreeDocPublicId || "",
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

    // ── NEW: Write to TutorAvailability in 24hr format ──
    // Onboarding format: { day: "Monday", slots: ["5:00 PM", "6:00 PM"] }
    // TutorAvailability format: { day: "Monday", startTime: "17:00", endTime: "18:00" }
    if (parsedData.availability?.length > 0) {
      const weeklySlots = (parsedData.availability as { day: string; slots: string[] }[])
        .flatMap(a =>
          a.slots.map(slot => {
            // Convert "5:00 PM" → startTime: "17:00", endTime: "18:00"
            const parts = slot.split(" ");
            const period = parts[1]; // "AM" or "PM"
            const [hourStr, minStr] = parts[0].split(":");
            let hour = parseInt(hourStr);

            if (period === "PM" && hour !== 12) hour += 12;
            if (period === "AM" && hour === 12) hour = 0;

            const startTime = `${String(hour).padStart(2, "0")}:${minStr}`;
            const endHour = hour + 1 > 23 ? 23 : hour + 1; // cap at 23:00
            const endTime = `${String(endHour).padStart(2, "0")}:${minStr}`;

            return { day: a.day, startTime, endTime };
          })
        );

      await TutorAvailability.findOneAndUpdate(
        { tutor: req.user?._id },
        { tutor: req.user?._id, weeklySlots },
        { upsert: true, new: true }
      );
    }
  }

    else if (stepNum === 5) {
    // Verification Docs
    let cnicFrontUrl = "";
    let cnicFrontPublicId = "";
    let cnicBackUrl = "";
    let cnicBackPublicId = "";
    let videoIntroUrl = "";
    let videoIntroPublicId = "";
    let policeCertificateUrl = "";
    let policeCertificatePublicId = "";

    if (files?.cnicFront?.[0]) {
      const { valid, detectedType } = await verifyFileSignature(files.cnicFront[0].buffer, DOCUMENT_TYPES);
      if (!valid) {
        res.status(400).json({ success: false, message: `CNIC front is invalid (detected: ${detectedType || "unknown"})` });
        return;
      }
      if (profile.cnicFrontPublicId) {
        await deleteFromCloudinary(profile.cnicFrontPublicId).catch(() => {});
      }
      const result = await uploadToCloudinary(files.cnicFront[0].buffer, "tutorera/cnic", "auto", true);
      cnicFrontUrl = result.secure_url;
      cnicFrontPublicId = result.public_id;
    }

    if (files?.cnicBack?.[0]) {
      const { valid, detectedType } = await verifyFileSignature(files.cnicBack[0].buffer, DOCUMENT_TYPES);
      if (!valid) {
        res.status(400).json({ success: false, message: `CNIC back is invalid (detected: ${detectedType || "unknown"})` });
        return;
      }
      if (profile.cnicBackPublicId) {
        await deleteFromCloudinary(profile.cnicBackPublicId).catch(() => {});
      }
      const result = await uploadToCloudinary(files.cnicBack[0].buffer, "tutorera/cnic", "auto", true);
      cnicBackUrl = result.secure_url;
      cnicBackPublicId = result.public_id;
    }

    if (files?.videoIntro?.[0]) {
      const { valid, detectedType } = await verifyFileSignature(files.videoIntro[0].buffer, VIDEO_TYPES);
      if (!valid) {
        res.status(400).json({ success: false, message: `Video file is invalid (detected: ${detectedType || "unknown"})` });
        return;
      }
      if (profile.videoIntroPublicId) {
        await deleteFromCloudinary(profile.videoIntroPublicId, "video").catch(() => {});
      }
      const result = await uploadToCloudinary(files.videoIntro[0].buffer, "tutorera/videos", "video", false);
      videoIntroUrl = result.secure_url;
      videoIntroPublicId = result.public_id;
    }

    if (files?.policeCertificate?.[0]) {
      const { valid, detectedType } = await verifyFileSignature(files.policeCertificate[0].buffer, DOCUMENT_TYPES);
      if (!valid) {
        res.status(400).json({ success: false, message: `Police certificate is invalid (detected: ${detectedType || "unknown"})` });
        return;
      }
      if (profile.policeCertificatePublicId) {
        await deleteFromCloudinary(profile.policeCertificatePublicId).catch(() => {});
      }
      const result = await uploadToCloudinary(files.policeCertificate[0].buffer, "tutorera/police-certificates", "auto", true);
      policeCertificateUrl = result.secure_url;
      policeCertificatePublicId = result.public_id;
    }

    // Validation: in-person tutors MUST upload police certificate
    const teachingMode = profile.teachingMode;
    if ((teachingMode === "in-person" || teachingMode === "both") && !policeCertificateUrl && !profile.policeCertificate) {
      res.status(400).json({
        success: false,
        message: "Police clearance certificate is required for in-person tutoring.",
      });
      return;
    }

    updateData = {
      ...(cnicFrontUrl && { cnicFront: cnicFrontUrl, cnicFrontPublicId }),
      ...(cnicBackUrl && { cnicBack: cnicBackUrl, cnicBackPublicId }),
      ...(videoIntroUrl && { videoIntro: videoIntroUrl, videoIntroPublicId }),
      ...(policeCertificateUrl && { policeCertificate: policeCertificateUrl, policeCertificatePublicId }),
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