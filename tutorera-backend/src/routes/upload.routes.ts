import { Router } from "express";
import { uploadAvatar, uploadVerificationDocs } from "../controllers/upload.controller";
import { protect, authorize } from "../middlewares/auth.middleware";
import { uploadAvatar as uploadAvatarMulter, uploadVerification as uploadVerificationMulter } from "../middlewares/upload.middleware";
import { uploadLimiter } from "../middlewares/rateLimiters";

const router = Router();

// Avatar upload — any logged in user
router.post(
  "/avatar",
  uploadLimiter,
  protect,
  uploadAvatarMulter.single("avatar"),
  uploadAvatar
);

// Verification docs — tutor only (initial submission or resubmission)
const verificationFields = uploadVerificationMulter.fields([
  { name: "cnicFront", maxCount: 1 },
  { name: "cnicBack", maxCount: 1 },
  { name: "degree", maxCount: 1 },
  { name: "policeCertificate", maxCount: 1 },
  { name: "videoIntro", maxCount: 1 },
]);

router.post(
  "/verification",
  uploadLimiter,
  protect,
  authorize("tutor"),
  verificationFields,
  uploadVerificationDocs
);

// Alias: /resubmit — same handler, same file fields, used from the resubmit panel
router.post(
  "/resubmit",
  uploadLimiter,
  protect,
  authorize("tutor"),
  verificationFields,
  uploadVerificationDocs
);

export default router;