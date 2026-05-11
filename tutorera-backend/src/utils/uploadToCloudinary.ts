import cloudinary from "../config/cloudinary";
import { UploadApiResponse } from "cloudinary";

export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  folder: string,
  resourceType: "image" | "raw" | "auto" = "image"
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error || !result) return reject(error);
        resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  await cloudinary.uploader.destroy(publicId);
};