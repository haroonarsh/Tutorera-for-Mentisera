// src/routes/payment.routes.ts
import express from "express";
import { protect, authorize } from "../middlewares/auth.middleware";
import { createBookingCheckout, confirmSwichPayment, getTransactionHistory } from "../controllers/payment.controller";

const router = express.Router();

// Provider-neutral confirm endpoint (replaces the old /swich/confirm path).
// Both paths are registered during the transition so any in-flight checkout
// sessions opened before the rename can still complete.
router.post("/confirm", protect, authorize("student", "parent"), confirmSwichPayment);
router.post("/swich/confirm", protect, authorize("student", "parent"), confirmSwichPayment);
router.post("/booking/:bookingId/checkout", protect, authorize("student", "parent"), createBookingCheckout);
router.get("/history", protect, authorize("student", "parent"), getTransactionHistory);

export default router;
