import cloudinary from "../config/cloudinary";
import { UploadApiResponse } from "cloudinary";

export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  folder: string,
  resourceType: "image" | "raw" | "video" | "auto" = "image",
  isPrivate: boolean = false,
  // Defaulting this to "cloudinary" made every upload in the app request the
  // paid Cloudinary AI-moderation add-on, even though no CLOUDINARY_MODERATION
  // env var is set and the add-on was never provisioned on the account. An
  // unconfigured add-on makes Cloudinary reject the upload_stream call
  // outright, which bubbles up as an uncaught error and surfaces to users as
  // a generic "Something went wrong" on every document/image/video submission
  // (degree docs, CNIC, police certs, avatars, blog covers, etc). Default to
  // no moderation; callers that actually have the add-on enabled can opt in
  // explicitly, and CLOUDINARY_MODERATION still works as a global opt-in.
  moderationType: "cloudinary" | "aws_rek" | "metascan" | null = null
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const moderationSetting = moderationType
      ? { moderation: moderationType }
      : process.env.CLOUDINARY_MODERATION
        ? { moderation: process.env.CLOUDINARY_MODERATION }
        : {};
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        type: isPrivate ? "authenticated" : "upload",
        ...moderationSetting,
      },
      (error, result) => {
        if (error || !result) return reject(error);
        const moderationResult = result.moderation as unknown as Array<{ status: string }> | null;
        if (moderationResult?.[0]?.status === "rejected") {
          return reject(new Error("Upload rejected due to content policy violation"));
        }
        resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

export const deleteFromCloudinary = async (
  publicId: string,
  resourceType: "image" | "raw" | "video" = "image"
): Promise<void> => {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

// Generates a short-lived signed URL for viewing a private/authenticated asset.
// Use this whenever admin needs to actually view a CNIC or degree document.
export const getSignedViewUrl = (
  publicId: string,
  resourceType: "image" | "raw" | "video" = "image",
  expiresInSeconds: number = 300 // 5 minutes
): string => {
  const timestamp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  return cloudinary.utils.private_download_url(publicId, "", {
    resource_type: resourceType,
    type: "authenticated",
    expires_at: timestamp,
  });
};