import { Router } from "express";
import {
  getRequestMatches,
  getTutorRecommendedRequests,
  getRankedOffers,
  submitMatchFeedback,
  getMatchingAnalytics,
  getMatchingConfig,
  updateMatchingConfig,
  simulateMatching,
} from "../controllers/matching.controller";
import { protect, authorize } from "../middlewares/auth.middleware";

const router = Router();

// Student / Request Matching (Dual routes: /matches and /tutors alias)
router.get("/requests/:id/matches", protect, getRequestMatches);
router.get("/requests/:id/tutors", protect, getRequestMatches);
router.get("/offers/:requestId/ranked", protect, getRankedOffers);
router.post("/feedback", protect, submitMatchFeedback);

// Tutor Recommended Requests
router.get("/tutors/recommended-requests", protect, authorize("tutor"), getTutorRecommendedRequests);

// Admin Analytics, Config & Live Simulator
router.get("/admin/analytics", protect, authorize("admin"), getMatchingAnalytics);
router.get("/admin/config", protect, authorize("admin"), getMatchingConfig);
router.put("/admin/config", protect, authorize("admin"), updateMatchingConfig);
router.post("/admin/simulate", protect, authorize("admin"), simulateMatching);

export default router;
