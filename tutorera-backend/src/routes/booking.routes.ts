import { Router } from "express";
import { bookAgainFromBooking, getMyBookings, updateBookingStatus } from "../controllers/booking.controller";
import { protect } from "../middlewares/auth.middleware";
import { validate, updateBookingStatusSchema } from "../validators/booking.validator";

const router = Router();

router.get("/", protect, getMyBookings);
router.post("/:id/book-again", protect, bookAgainFromBooking);
router.patch("/:id/status", protect, validate(updateBookingStatusSchema), updateBookingStatus);

export default router;
