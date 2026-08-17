import { Router } from "express";
import { uploadAvatar, uploadVerificationDocs } from "../controllers/upload.controller";
import { protect, authorize } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload.middleware";
import { uploadLimiter } from "../middlewares/rateLimiters";

const router = Router();

// Avatar upload — any logged in user
router.post(
  "/avatar",
  uploadLimiter,
  protect,
  upload.single("avatar"),
  uploadAvatar
);

// Verification docs — tutor only
router.post(
  "/verification",
  protect,
  authorize("tutor"),
  upload.fields([
    { name: "cnic", maxCount: 1 },
    { name: "degree", maxCount: 1 },
    { name: "videoIntro", maxCount: 1 },
  ]),
  uploadVerificationDocs
);

export default router;