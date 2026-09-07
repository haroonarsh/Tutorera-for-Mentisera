import { Router } from "express";
import { saveStudentOnboarding, getMyStudentProfile, toggleFavourite, getFavourites, getFavouriteIds, linkParentGuardian, unlinkParentGuardian, getMyParentGuardians } from "../controllers/student.controller";
import { protect, authorize } from "../middlewares/auth.middleware";

const router = Router();

router.post("/onboarding", protect, authorize("student"), saveStudentOnboarding);
router.get("/profile/me", protect, authorize("student"), getMyStudentProfile);
router.post("/favourites/:tutorId", protect, toggleFavourite);
router.get("/favourites", protect, authorize("student"), getFavourites);
router.get("/favourites/ids", protect, authorize("student"), getFavouriteIds);
router.post("/guardians", protect, authorize("student"), linkParentGuardian);
router.delete("/guardians/:parentProfileId", protect, authorize("student"), unlinkParentGuardian);
router.get("/guardians", protect, authorize("student"), getMyParentGuardians);

export default router;