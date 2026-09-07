import { Router } from "express";
import { protect } from "../middlewares/auth.middleware";
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
router.get("/my-bookings", protect, getMyRecurringBookings);
router.get("/tutor-bookings", protect, getRecurringBookingsForTutor);
router.post("/subscribe", protect, subscribeToPlan);
router.patch("/:id/pause", protect, pauseRecurringBooking);
router.patch("/:id/resume", protect, resumeRecurringBooking);
router.patch("/:id/cancel", protect, cancelRecurringBooking);
router.patch("/:bookingId/sessions/:id", protect, recordSessionUse);
router.get("/stats", protect, getPlanStats);
router.get("/stats/:tutorId", protect, getPlanStats);

export default router;
