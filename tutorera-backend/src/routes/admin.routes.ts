import { Router } from "express";
import {
  getDashboardStats,
  getPendingVerifications,
  getTutorFullData,
  verifyTutor,
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
import { validate as validateGuarantee, updateClaimStatusSchema } from "../validators/guarantee.validator";
import { getMarketplaceAnalytics, getMarketplaceOfferDetail, listMarketplaceOffers, listMarketplaceRequests } from "../controllers/marketplaceAdmin.controller";

const router = Router();

router.use(protect, authorize("admin"));

router.get("/stats", getDashboardStats);
router.get("/analytics", getAnalytics);
router.get("/marketplace-analytics", getMarketplaceAnalytics);
router.get("/marketplace/requests", listMarketplaceRequests);
router.get("/marketplace/offers", listMarketplaceOffers);
router.get("/marketplace/offers/:id", getMarketplaceOfferDetail);
router.get("/verifications", getPendingVerifications);
router.get("/payouts", getPayouts);
router.get("/audit-logs", getAuditLogs);
router.get("/email-logs", getEmailLogs);
router.post("/broadcasts", sendBroadcast);
router.get("/broadcasts",  getBroadcasts);
router.get("/subscriptions", getSubscriptions);
router.get("/tutors/:id/document/:field", getTutorDocumentUrl);
router.patch("/users/:id/plan", protect, authorize("admin"), updateUserPlan);
router.get("/tutors/:id", getTutorFullData);
router.patch("/verify/:id", verifyTutor);
router.get("/users", getAllUsers);
router.patch("/users/:id/status", toggleUserStatus);
router.get("/bookings", getAllBookings);
router.patch("/bookings/:id/payment", updatePaymentStatus);
router.get("/contacts", getAllContacts);
router.patch("/contacts/:id", updateContactStatus);
router.patch("/bookings/:id/status", updateBookingStatus);
router.get("/reports", generateReport);
router.get("/guarantee-claims", getAllClaims);
router.patch("/guarantee-claims/:id", validateGuarantee(updateClaimStatusSchema), updateClaimStatus);
router.get("/referrals", getAllReferrals);
router.get("/student-ratings", getAllStudentRatings);
router.get("/student-ratings/:studentId", getStudentRatings);

export default router;
