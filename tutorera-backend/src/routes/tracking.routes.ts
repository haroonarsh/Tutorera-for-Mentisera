import { Router } from "express";
import {
  getApplicationStatus,
  rotateTrackingToken,
  acceptTutorAgreement,
  getPublicTracking,
  listApplications,
  getApplicationDetail,
  updateCnic,
  updateDegree,
  updateDemoVideo,
  updatePolice,
  updateAvatar,
  setMarketplaceEligibility,
  setHomeTuitionEligibility,
  setSuspended,
  setReverification,
  getApplicationHistory,
  uploadApplicationDocumentOnBehalf,
} from "../controllers/tracking.controller";
import { protect, authorize } from "../middlewares/auth.middleware";
import { requirePermission } from "../middlewares/rbac.middleware";
import { trackingLimiter, tutorRotateLimiter } from "../middlewares/rateLimiters";
import { uploadVerification } from "../middlewares/upload.middleware";

const router = Router();

// ─── Tutor authenticated ────────────────────────────────────────────────────
router.get("/application-status", protect, authorize("tutor"), getApplicationStatus);
router.post("/application-status/rotate-token", protect, authorize("tutor"), tutorRotateLimiter, rotateTrackingToken);
router.post("/application-status/accept-agreement", protect, authorize("tutor"), acceptTutorAgreement);

// ─── Admin ───────────────────────────────────────────────────────────────────
router.get("/admin/applications", protect, authorize("admin"), requirePermission("tutor.read"), listApplications);
router.get("/admin/applications/:id", protect, authorize("admin"), requirePermission("tutor.read"), getApplicationDetail);
router.get("/admin/applications/:id/history", protect, authorize("admin"), requirePermission("audit.read"), getApplicationHistory);
router.patch("/admin/applications/:id/cnic", protect, authorize("admin"), requirePermission("tutor.verify"), updateCnic);
router.patch("/admin/applications/:id/degree", protect, authorize("admin"), requirePermission("tutor.verify"), updateDegree);
router.patch("/admin/applications/:id/demo-video", protect, authorize("admin"), requirePermission("tutor.verify"), updateDemoVideo);
router.patch("/admin/applications/:id/police", protect, authorize("admin"), requirePermission("tutor.verify"), updatePolice);
router.patch("/admin/applications/:id/avatar", protect, authorize("admin"), requirePermission("tutor.verify"), updateAvatar);
router.patch("/admin/applications/:id/marketplace", protect, authorize("admin"), requirePermission("tutor.verify"), setMarketplaceEligibility);
router.patch("/admin/applications/:id/home-tuition", protect, authorize("admin"), requirePermission("tutor.verify"), setHomeTuitionEligibility);
router.patch("/admin/applications/:id/suspended", protect, authorize("admin"), requirePermission("tutor.suspend"), setSuspended);
router.patch("/admin/applications/:id/reverification", protect, authorize("admin"), requirePermission("tutor.verify"), setReverification);

// Admin upload document on tutor's behalf
router.post(
  "/admin/applications/:id/upload-document",
  protect,
  authorize("admin"),
  requirePermission("tutor.verify"),
  uploadVerification.fields([
    { name: "file", maxCount: 1 },
    { name: "cnicFront", maxCount: 1 },
    { name: "cnicBack", maxCount: 1 },
    { name: "degree", maxCount: 1 },
    { name: "policeCertificate", maxCount: 1 },
    { name: "videoIntro", maxCount: 1 },
  ]),
  uploadApplicationDocumentOnBehalf
);

// ─── Public token tracking — MUST be last (wildcard catches everything) ──────
router.get("/:token", trackingLimiter, getPublicTracking);

export default router;
