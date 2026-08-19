import { Router } from "express";
import { getMyBookings, updateBookingStatus } from "../controllers/booking.controller";
import { protect } from "../middlewares/auth.middleware";
import { validate, updateBookingStatusSchema } from "../validators/booking.validator";

const router = Router();

router.get("/", protect, getMyBookings);
router.patch("/:id/status", protect, validate(updateBookingStatusSchema), updateBookingStatus);

export default router;