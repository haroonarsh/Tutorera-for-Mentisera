import multer from "multer";
import { Request } from "express";
import * as FileType from "file-type";

const storage = multer.memoryStorage();

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf", "video/mp4"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only images (jpg, png, webp, jpeg, mp4) and PDFs are allowed"));
  }
};

// Separate multer instances per use case — different size limits for different content
export const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB — avatars don't need to be huge
});

export const uploadDocument = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB — CNIC/degree scans, especially PDFs
});

export const uploadVideo = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB — video intros need real headroom
});

// For the combined verification route (cnic + degree + videoIntro in one request),
// multer needs one instance whose limit covers the largest file among the fields.
export const uploadVerification = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});

// Real content verification — checks actual file bytes, not the client-supplied mimetype header
export const verifyFileSignature = async (
  buffer: Buffer,
  expectedTypes: string[]
): Promise<{ valid: boolean; detectedType?: string }> => {
  const detected = await FileType.fromBuffer(buffer)
  if (!detected) {
    // Some valid small text-based files (rare here) may not be detectable by magic bytes;
    // for our allowed set (images/pdf/mp4) this should always resolve if the file is genuine.
    return { valid: false };
  }
  return { valid: expectedTypes.includes(detected.mime), detectedType: detected.mime };
};