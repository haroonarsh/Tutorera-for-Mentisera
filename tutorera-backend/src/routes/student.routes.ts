import { Router } from "express";
import { saveStudentOnboarding, getMyStudentProfile } from "../controllers/student.controller";
import { protect, authorize } from "../middlewares/auth.middleware";

const router = Router();

router.post("/onboarding", protect, authorize("student"), saveStudentOnboarding);
router.get("/profile/me", protect, authorize("student"), getMyStudentProfile);

export default router;