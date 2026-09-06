import { Router } from "express";
import {
  getDashboardStats,
  getPendingVerifications,
  getTutorFullData,
  verifyTutor,
  bulkVerifyTutors,
  getAllUsers,
  toggleUserStatus,
  getAllBookings,
  updatePaymentStatus,
  getAllContacts,
  updateContactStatus,
  generateReport,
  updateBookingStatus,
  updateUserPlan,
  getPayouts,
  getAnalytics,
  getAuditLogs,
  getEmailLogs,
  getBroadcasts,
  sendBroadcast,
  getSubscriptions,
  getTutorDocumentUrl,
} from "../controllers/admin.controller";
import {
  getAllClaims,
  updateClaimStatus,
} from "../controllers/guaranteeClaim.controller";
import { getAllReferrals } from "../controllers/referral.controller";
import { getAllStudentRatings, getStudentRatings } from "../controllers/studentRating.controller";
import { protect, authorize } from "../middlewares/auth.middleware";
import { requirePermission } from "../middlewares/rbac.middleware";
import { validate as validateGuarantee, updateClaimStatusSchema } from "../validators/guarantee.validator";
import { getMarketplaceAnalytics, getMarketplaceOfferDetail, listMarketplaceOffers, listMarketplaceRequests } from "../controllers/marketplaceAdmin.controller";
import {
  getControlTowerPulse,
  listAtRiskRequests,
  handleAtRiskAction,
  getSupplyGapsIntelligence,
  getFinanceReconciliation,
  getSystemHealth,
  listSafetyCases,
  createSafetyCase,
  resolveSafetyCase,
  getFeeConfig,
  updateFeeConfig,
  getMarketConfigs,
  updateMarketConfig,
  getAdminRolesOverview,
  updateAdminUserRole,
  getStudent360,
  getTutor360,
} from "../controllers/adminControlTower.controller";

const router = Router();

router.use(protect, authorize("admin"));

// Control Tower & Liquidity
router.get("/control-tower/pulse", getControlTowerPulse);
router.get("/at-risk/requests", listAtRiskRequests);
router.post("/at-risk/requests/:id/action", handleAtRiskAction);
router.get("/supply-gaps", getSupplyGapsIntelligence);

// Finance & Reconciliation
router.get("/finance/reconciliation", requirePermission("finance.reconcile"), getFinanceReconciliation);
router.get("/finance/fee-config", requirePermission("finance.fee_configure"), getFeeConfig);
router.put("/finance/fee-config", requirePermission("finance.fee_configure"), updateFeeConfig);

// Trust & Safety Cases
router.get("/safety/cases", requirePermission("safety.read"), listSafetyCases);
router.post("/safety/cases", requirePermission("safety.create"), createSafetyCase);
router.post("/safety/cases/:id/resolve", requirePermission("safety.resolve"), resolveSafetyCase);

// Global Market Operations
router.get("/markets", requirePermission("market.read"), getMarketConfigs);
router.put("/markets/:id", requirePermission("market.configure"), updateMarketConfig);

// System Health & RBAC Roles
router.get("/system/health", requirePermission("system.monitor"), getSystemHealth);
router.get("/roles/overview", requirePermission("roles.manage"), getAdminRolesOverview);
router.patch("/roles/users/:userId", requirePermission("roles.manage"), updateAdminUserRole);

// Customer 360°
router.get("/customers/students/:id/360", requirePermission("student.read"), getStudent360);
router.get("/customers/tutors/:id/360", requirePermission("tutor.read"), getTutor360);

// Existing Core Endpoints (Fully Preserved)
router.get("/stats", requirePermission("analytics.read"), getDashboardStats);
router.get("/analytics", requirePermission("analytics.read"), getAnalytics);
router.get("/marketplace-analytics", requirePermission("matching.read"), getMarketplaceAnalytics);
router.get("/marketplace/requests", requirePermission("request.read"), listMarketplaceRequests);
router.get("/marketplace/offers", requirePermission("matching.read"), listMarketplaceOffers);
router.get("/marketplace/offers/:id", requirePermission("matching.read"), getMarketplaceOfferDetail);
router.get("/verifications", requirePermission("tutor.read"), getPendingVerifications);
router.get("/payouts", requirePermission("payout.read"), getPayouts);
router.get("/audit-logs", requirePermission("audit.read"), getAuditLogs);
router.get("/email-logs", requirePermission("growth.read"), getEmailLogs);
router.post("/broadcasts", requirePermission("broadcast.send"), sendBroadcast);
router.get("/broadcasts",  requirePermission("broadcast.send"), getBroadcasts);
router.get("/subscriptions", requirePermission("growth.read"), getSubscriptions);
router.get("/tutors/:id/document/:field", requirePermission("tutor.read"), getTutorDocumentUrl);
router.patch("/users/:id/plan", protect, authorize("admin"), requirePermission("users.manage"), updateUserPlan);
router.get("/tutors/:id", requirePermission("tutor.read"), getTutorFullData);
router.patch("/verify/bulk", requirePermission("tutor.verify"), bulkVerifyTutors);
router.patch("/verify/:id", requirePermission("tutor.verify"), verifyTutor);
router.get("/users", requirePermission("users.read"), getAllUsers);
router.patch("/users/:id/status", requirePermission("users.manage"), toggleUserStatus);
router.get("/bookings", requirePermission("bookings.read"), getAllBookings);
router.patch("/bookings/:id/payment", requirePermission("payment.read"), updatePaymentStatus);
router.get("/contacts", requirePermission("student.read"), getAllContacts);
router.patch("/contacts/:id", requirePermission("student.read"), updateContactStatus);
router.patch("/bookings/:id/status", requirePermission("bookings.manage"), updateBookingStatus);
router.get("/reports", requirePermission("analytics.read"), generateReport);
router.get("/guarantee-claims", requirePermission("claims.read"), getAllClaims);
router.patch("/guarantee-claims/:id", requirePermission("claims.manage"), validateGuarantee(updateClaimStatusSchema), updateClaimStatus);
router.get("/referrals", requirePermission("growth.read"), getAllReferrals);
router.get("/student-ratings", requirePermission("student.read"), getAllStudentRatings);
router.get("/student-ratings/:studentId", requirePermission("student.read"), getStudentRatings);

export default router;
