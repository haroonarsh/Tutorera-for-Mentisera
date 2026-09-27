import { Router } from "express";
import {
  getCurrentTutorAgreement,
  acceptTutorAgreement,
  listTutorAgreements,
  getTutorAgreementById,
  downloadTutorAgreementPdf,
  listAdminAgreements,
  createAdminAgreementDraft,
  publishAdminAgreement,
  archiveAdminAgreement,
  getAdminTutorAgreements,
  getLegalComplianceStats,
} from "../controllers/legalAgreement.controller";
import { protect, authorize } from "../middlewares/auth.middleware";
import { requirePermission } from "../middlewares/rbac.middleware";

const router = Router();

// ─── Tutor Legal Agreement Endpoints ──────────────────────────────────────────
router.get("/tutor/agreements/current", protect, authorize("tutor"), getCurrentTutorAgreement);
router.post("/tutor/agreements/accept", protect, authorize("tutor"), acceptTutorAgreement);
router.get("/tutor/agreements", protect, authorize("tutor"), listTutorAgreements);
router.get("/tutor/agreements/:id", protect, getTutorAgreementById);
router.get("/tutor/agreements/:id/pdf", protect, downloadTutorAgreementPdf);

// ─── Admin Legal Compliance & Management Endpoints ───────────────────────────
router.get("/admin/legal/agreements", protect, authorize("admin"), listAdminAgreements);
router.post("/admin/legal/agreements", protect, authorize("admin"), requirePermission("tutor.verify"), createAdminAgreementDraft);
router.post("/admin/legal/agreements/:id/publish", protect, authorize("admin"), requirePermission("tutor.verify"), publishAdminAgreement);
router.post("/admin/legal/agreements/:id/archive", protect, authorize("admin"), requirePermission("tutor.verify"), archiveAdminAgreement);
router.get("/admin/tutors/:id/agreements", protect, authorize("admin"), requirePermission("tutor.read"), getAdminTutorAgreements);
router.get("/admin/legal/compliance-stats", protect, authorize("admin"), requirePermission("tutor.read"), getLegalComplianceStats);

export default router;
