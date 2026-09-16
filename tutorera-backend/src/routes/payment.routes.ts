// src/routes/payment.routes.ts
import express from "express";
import { protect, authorize } from "../middlewares/auth.middleware";
import { createBookingCheckout, handleRapidGatewayWebhook, getTransactionHistory } from "../controllers/payment.controller";

const router = express.Router();

router.post("/booking/:bookingId/checkout", protect, authorize("student", "parent"), createBookingCheckout);
router.get("/history", protect, authorize("student", "parent"), getTransactionHistory);

/**
 * Rapid Gateway currently sends X-RapidGateway-* headers and may also send
 * X-RapidPay-* aliases during its provider-side transition. An older public
 * integration guide used X-RG-Signature. Normalize those Rapid Gateway headers
 * into the controller's existing internal signature slots so the business
 * webhook handler remains unchanged while the gateway integration is replaced.
 */
const normalizeRapidGatewayHeaders: express.RequestHandler = (req, _res, next) => {
  const signature =
    req.header("x-rapidgateway-signature") ||
    req.header("x-rapidpay-signature") ||
    req.header("x-rg-signature") ||
    "";
  const timestamp =
    req.header("x-rapidgateway-timestamp") ||
    req.header("x-rapidpay-timestamp") ||
    req.header("x-rg-timestamp") ||
    "";

  if (signature) req.headers["x-sfpy-signature"] = signature;
  if (timestamp) req.headers["x-sfpy-timestamp"] = timestamp;

  const reference = typeof req.query.reference === "string" ? req.query.reference.trim() : "";
  if (
    reference &&
    req.body &&
    typeof req.body === "object" &&
    !Array.isArray(req.body) &&
    !req.body.merchantTransactionId
  ) {
    req.body.merchantTransactionId = reference;
  }

  next();
};

// No `protect` here — Rapid Gateway calls this directly. Authentication is the
// HMAC signature over the exact raw request body, verified by the provider service.
router.post("/webhook", normalizeRapidGatewayHeaders, handleRapidGatewayWebhook);

export default router;
