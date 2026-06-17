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
} from "../controllers/admin.controller";
import { protect, authorize } from "../middlewares/auth.middleware";

const router = Router();

router.use(protect, authorize("admin"));

router.get("/stats", getDashboardStats);
router.get("/verifications", getPendingVerifications);
router.get("/tutors/:id", getTutorFullData);
router.patch("/verify/:id", verifyTutor);
router.get("/users", getAllUsers);
router.patch("/users/:id/status", toggleUserStatus);
router.get("/bookings", getAllBookings);
router.patch("/bookings/:id/payment", updatePaymentStatus);
router.get("/contacts", getAllContacts);
router.patch("/contacts/:id", updateContactStatus);
router.get("/reports", generateReport);

export default router;