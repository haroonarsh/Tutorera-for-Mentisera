import { Response } from "express";
import { AuthRequest } from "../types";
import { verifyFileSignature } from "../middlewares/upload.middleware";
import User from "../models/User.model";
import TutorProfile from "../models/TutorProfile.model";
import { uploadToCloudinary, deleteFromCloudinary, getSignedViewUrl } from "../utils/uploadToCloudinary";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const DOCUMENT_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const VIDEO_TYPES = ["video/mp4"];

// @desc    Upload avatar
// @route   POST /api/upload/avatar
// @access  Private
export const uploadAvatar = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ success: false, message: "No file uploaded" });
    return;
  }

  const { valid, detectedType } = await verifyFileSignature(req.file.buffer, IMAGE_TYPES);
  if (!valid) {
    res.status(400).json({
      success: false,
      message: `File content is not a valid image (detected: ${detectedType || "unknown"})`,
    });
    return;
  }

  const result = await uploadToCloudinary(
    req.file.buffer,
    "tutorera/avatars"
  );

  await User.findByIdAndUpdate(req.user?._id, { avatar: result.secure_url });

  res.status(200).json({
    success: true,
    message: "Avatar uploaded successfully",
    url: result.secure_url,
  });
};

// @desc    Upload tutor verification docs
// @route   POST /api/upload/verification
// @access  Private (tutor only)
export const uploadVerificationDocs = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  if (!files || Object.keys(files).length === 0) {
    res.status(400).json({ success: false, message: "No files uploaded" });
    return;
  }

  const existingProfile = await TutorProfile.findOne({ user: req.user?._id });
  if (!existingProfile) {
    res.status(404).json({ success: false, message: "Tutor profile not found. Please complete onboarding first." });
    return;
  }

  const updateData: Record<string, string> = {};

  // ── CNIC Front (private — sensitive identity document) ──
  if (files.cnicFront?.[0]) {
    const { valid, detectedType } = await verifyFileSignature(files.cnicFront[0].buffer, DOCUMENT_TYPES);
    if (!valid) {
      res.status(400).json({ success: false, message: `CNIC front file is invalid (detected: ${detectedType || "unknown"})` });
      return;
    }
    if (existingProfile.cnicFrontPublicId) {
      await deleteFromCloudinary(existingProfile.cnicFrontPublicId).catch(() => {});
    }
    const result = await uploadToCloudinary(files.cnicFront[0].buffer, "tutorera/verification/cnic", "auto", true);
    updateData.cnicFront = result.secure_url;
    updateData.cnicFrontPublicId = result.public_id;
  }

  // ── CNIC Back (private) ──
  if (files.cnicBack?.[0]) {
    const { valid, detectedType } = await verifyFileSignature(files.cnicBack[0].buffer, DOCUMENT_TYPES);
    if (!valid) {
      res.status(400).json({ success: false, message: `CNIC back file is invalid (detected: ${detectedType || "unknown"})` });
      return;
    }
    if (existingProfile.cnicBackPublicId) {
      await deleteFromCloudinary(existingProfile.cnicBackPublicId).catch(() => {});
    }
    const result = await uploadToCloudinary(files.cnicBack[0].buffer, "tutorera/verification/cnic", "auto", true);
    updateData.cnicBack = result.secure_url;
    updateData.cnicBackPublicId = result.public_id;
  }

  // ── Police Certificate (private) ──
  if (files.policeCertificate?.[0]) {
    const { valid, detectedType } = await verifyFileSignature(files.policeCertificate[0].buffer, DOCUMENT_TYPES);
    if (!valid) {
      res.status(400).json({ success: false, message: `Police certificate file is invalid (detected: ${detectedType || "unknown"})` });
      return;
    }
    if (existingProfile.policeCertificatePublicId) {
      await deleteFromCloudinary(existingProfile.policeCertificatePublicId).catch(() => {});
    }
    const result = await uploadToCloudinary(files.policeCertificate[0].buffer, "tutorera/verification/police", "auto", true);
    updateData.policeCertificate = result.secure_url;
    updateData.policeCertificatePublicId = result.public_id;
  }

  // ── Video Intro (public — not sensitive, students need to view it) ──
  if (files.videoIntro?.[0]) {
    const { valid, detectedType } = await verifyFileSignature(files.videoIntro[0].buffer, VIDEO_TYPES);
    if (!valid) {
      res.status(400).json({ success: false, message: `Video file is invalid (detected: ${detectedType || "unknown"})` });
      return;
    }
    if (existingProfile.videoIntroPublicId) {
      await deleteFromCloudinary(existingProfile.videoIntroPublicId, "video").catch(() => {});
    }
    const result = await uploadToCloudinary(files.videoIntro[0].buffer, "tutorera/verification/videos", "video", false);
    updateData.videoIntro = result.secure_url;
    updateData.videoIntroPublicId = result.public_id;
  }

  if (Object.keys(updateData).length === 0) {
    res.status(400).json({ success: false, message: "No valid files were uploaded." });
    return;
  }

  await TutorProfile.findOneAndUpdate(
    { user: req.user?._id },
    { ...updateData, verificationStatus: "pending" },
    { new: true }
  );

  res.status(200).json({
    success: true,
    message: "Documents uploaded successfully. Pending admin review.",
    uploadedFields: Object.keys(updateData),
  });
};