import { Router } from "express";
import {
  getApplicationStatus,
  rotateTrackingToken,
  getPublicTracking,
  listApplications,
  getApplicationDetail,
  updateCnic,
  updateDegree,
  updateDemoVideo,
  updatePolice,
  setMarketplaceEligibility,
  setHomeTuitionEligibility,
  setSuspended,
  setReverification,
  getApplicationHistory,
} from "../controllers/tracking.controller";
import { protect, authorize } from "../middlewares/auth.middleware";
import { trackingLimiter, tutorRotateLimiter } from "../middlewares/rateLimiters";

const router = Router();

// ─── Public token tracking ───────────────────────────────────────────────────
router.get(["/:token", "/tutor/:token"], trackingLimiter, getPublicTracking);

// ─── Tutor authenticated ────────────────────────────────────────────────────
router.get(["/application-status", "/tutor/application-status"], protect, authorize("tutor"), getApplicationStatus);
router.post(["/application-status/rotate-token", "/tutor/application-status/rotate-token"], protect, authorize("tutor"), tutorRotateLimiter, rotateTrackingToken);

// ─── Admin ───────────────────────────────────────────────────────────────────
router.get("/admin/applications", protect, authorize("admin"), listApplications);
router.get("/admin/applications/:id", protect, authorize("admin"), getApplicationDetail);
router.get("/admin/applications/:id/history", protect, authorize("admin"), getApplicationHistory);
router.patch("/admin/applications/:id/cnic", protect, authorize("admin"), updateCnic);
router.patch("/admin/applications/:id/degree", protect, authorize("admin"), updateDegree);
router.patch("/admin/applications/:id/demo-video", protect, authorize("admin"), updateDemoVideo);
router.patch("/admin/applications/:id/police", protect, authorize("admin"), updatePolice);
router.patch("/admin/applications/:id/marketplace", protect, authorize("admin"), setMarketplaceEligibility);
router.patch("/admin/applications/:id/home-tuition", protect, authorize("admin"), setHomeTuitionEligibility);
router.patch("/admin/applications/:id/suspended", protect, authorize("admin"), setSuspended);
router.patch("/admin/applications/:id/reverification", protect, authorize("admin"), setReverification);

export default router;
