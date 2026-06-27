import { Router } from "express";
import { createReview, getTutorReviews } from "../controllers/review.controller";
import { protect, authorize } from "../middlewares/auth.middleware";
import { rateStudent } from "../controllers/studentRating.controller";

const router = Router();

router.post("/student-ratings", protect, authorize("tutor"), rateStudent);

router.get("/:tutorId", getTutorReviews);
router.post("/:tutorId", protect, authorize("student"), createReview);

export default router;