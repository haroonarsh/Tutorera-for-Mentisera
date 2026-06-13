import { Router } from "express";
import {
  createOrUpdateProfile,
  getMyProfile,
  getTutorById,
  getAllTutors,
  saveOnboardingStep,
  getOnboardingStatus,
} from "../controllers/tutor.controller";
import { protect, authorize } from "../middlewares/auth.middleware";
import { validate, tutorProfileSchema } from "../validators/tutor.validator";
import { upload } from "../middlewares/upload.middleware";

const router = Router();

// Public
router.get("/", getAllTutors);
router.get("/:id", getTutorById);

// Onboarding
router.get("/onboarding/status", protect, authorize("tutor"), getOnboardingStatus);
router.post("/onboarding/step", protect, authorize("tutor"), upload.fields([
  { name: "degreeDoc", maxCount: 1 },
  { name: "cnicFront", maxCount: 1 },
  { name: "cnicBack", maxCount: 1 },
  { name: "videoIntro", maxCount: 1 },
  { name: "policeCertificate", maxCount: 1 },
]), saveOnboardingStep);

// Profile
router.post("/profile", protect, authorize("tutor"), validate(tutorProfileSchema), createOrUpdateProfile);
router.get("/profile/me", protect, authorize("tutor"), getMyProfile);

export default router;