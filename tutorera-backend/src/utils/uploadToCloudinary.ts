import cloudinary from "../config/cloudinary";
import { UploadApiResponse } from "cloudinary";

export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  folder: string,
  resourceType: "image" | "raw" | "video" | "auto" = "image",
  isPrivate: boolean = false,
  moderationType: "cloudinary" | "aws_rek" | "metascan" | null = "cloudinary"
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