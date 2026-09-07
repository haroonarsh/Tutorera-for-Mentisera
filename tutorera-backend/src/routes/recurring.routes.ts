import { Router } from "express";
import { protect, authorize } from "../middlewares/auth.middleware";
import {
  getAvailablePlans,
  getMyRecurringBookings,
  getRecurringBookingsForTutor,
  subscribeToPlan,
  pauseRecurringBooking,
  resumeRecurringBooking,
  cancelRecurringBooking,
  recordSessionUse,
  getPlanStats,
} from "../controllers/recurring.controller";

const router = Router();

router.get("/plans", getAvailablePlans);
router.get("/my-bookings", protect, authorize("student", "parent"), getMyRecurringBookings);
router.get("/tutor-bookings", protect, authorize("tutor"), getRecurringBookingsForTutor);
router.post("/subscribe", protect, authorize("student", "parent"), subscribeToPlan);
router.patch("/:id/pause", protect, authorize("student", "parent"), pauseRecurringBooking);
router.patch("/:id/resume", protect, authorize("student", "parent"), resumeRecurringBooking);
router.patch("/:id/cancel", protect, authorize("student", "parent"), cancelRecurringBooking);
// Session completion is a tutor-side operational action, not a self-reporting
// action a student can use to advance their own package balance.
router.patch("/:bookingId/sessions/:id", protect, authorize("tutor"), recordSessionUse);
router.get("/stats", protect, authorize("tutor"), getPlanStats);
router.get("/stats/:tutorId", protect, authorize("admin"), getPlanStats);

export default router;
