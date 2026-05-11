import { Router } from "express";
import {
  createOrUpdateProfile,
  getMyProfile,
  getTutorById,
  getAllTutors,
} from "../controllers/tutor.controller";
import { protect, authorize } from "../middlewares/auth.middleware";
import { validate, tutorProfileSchema } from "../validators/tutor.validator";

const router = Router();

// Public routes
router.get("/", getAllTutors);
router.get("/:id", getTutorById);

// Private routes (tutor only)
router.post(
  "/profile",
  protect,
  authorize("tutor"),
  validate(tutorProfileSchema),
  createOrUpdateProfile
);

router.get(
  "/profile/me",
  protect,
  authorize("tutor"),
  getMyProfile
);

export default router;