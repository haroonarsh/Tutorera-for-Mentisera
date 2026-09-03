// src/routes/payment.routes.ts
import express from "express";
import { protect, authorize } from "../middlewares/auth.middleware";
import { createBookingCheckout, handleRapidGatewayWebhook } from "../controllers/payment.controller";

const router = express.Router();

router.post("/booking/:bookingId/checkout", protect, authorize("student"), createBookingCheckout);

// No `protect` here — the payment gateway calls this directly, authenticated by
// HMAC signature (verified inside the controller), not a user session.
router.post("/webhook", handleRapidGatewayWebhook);

export default router;
