import { Router } from "express";
import {
  listReviewQueue,
  getReviewQueueStats,
  getReviewItem,
  assignReview,
  approveReviewItem,
  rejectReviewItem,
  escalateReviewItem,
  getReviewHistoryForProfile,
  triggerQueueSync,
} from "../../controllers/verification.controller";
import { protect, authorize } from "../../middlewares/auth.middleware";
import { requirePermission } from "../../middlewares/rbac.middleware";

const router = Router();

router.use(protect, authorize("admin"));

router.get("/queue", requirePermission("tutor.read"), listReviewQueue);
router.get("/queue/stats", requirePermission("tutor.read"), getReviewQueueStats);
router.get("/queue/:id", requirePermission("tutor.read"), getReviewItem);
router.post("/queue/:id/assign", requirePermission("tutor.verify"), assignReview);
router.post("/queue/:id/approve", requirePermission("tutor.verify"), approveReviewItem);
router.post("/queue/:id/reject", requirePermission("tutor.reject"), rejectReviewItem);
router.post("/queue/:id/escalate", requirePermission("tutor.verify"), escalateReviewItem);
router.get("/history/:profileId", requirePermission("tutor.read"), getReviewHistoryForProfile);
router.post("/sync/:profileId", requirePermission("tutor.verify"), triggerQueueSync);

export default router;