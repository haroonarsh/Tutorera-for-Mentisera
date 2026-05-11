import { Response } from "express";
import { AuthRequest } from "../types";
import { uploadToCloudinary } from "../utils/uploadToCloudinary";
import User from "../models/User.model";
import TutorProfile from "../models/TutorProfile.model";

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

  const result = await uploadToCloudinary(
    req.file.buffer,
    "tutorera/avatars"
  );

  // Update user avatar in DB
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

  const updateData: Record<string, string> = {};

  // Upload CNIC if provided
  if (files.cnic?.[0]) {
    const result = await uploadToCloudinary(
      files.cnic[0].buffer,
      "tutorera/verification/cnic"
    );
    updateData["verificationDocs.cnic"] = result.secure_url;
  }

  // Upload degree if provided
  if (files.degree?.[0]) {
    const result = await uploadToCloudinary(
      files.degree[0].buffer,
      "tutorera/verification/degrees",
      "auto"
    );
    updateData["verificationDocs.degree"] = result.secure_url;
  }

  // Upload video intro if provided
  if (files.videoIntro?.[0]) {
    const result = await uploadToCloudinary(
      files.videoIntro[0].buffer,
      "tutorera/verification/videos",
      "auto"
    );
    updateData["verificationDocs.videoIntro"] = result.secure_url;
  }

  // Update tutor profile with doc URLs + set status to pending
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