import { Router } from "express";
import { getMyBookings, updateBookingStatus } from "../controllers/booking.controller";
import { protect } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", protect, getMyBookings);
router.patch("/:id/status", protect, updateBookingStatus);

export default router;