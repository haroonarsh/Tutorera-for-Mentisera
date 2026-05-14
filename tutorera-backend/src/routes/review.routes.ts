import { Router } from "express";
import { createReview, getTutorReviews } from "../controllers/review.controller";
import { protect, authorize } from "../middlewares/auth.middleware";

const router = Router();

router.get("/:tutorId", getTutorReviews);
router.post("/:tutorId", protect, authorize("student"), createReview);

export default router;