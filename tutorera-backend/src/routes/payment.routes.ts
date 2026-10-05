// src/routes/payment.routes.ts
import express from "express";
import { protect, authorize } from "../middlewares/auth.middleware";
import { createBookingCheckout, confirmSwichPayment, getTransactionHistory } from "../controllers/payment.controller";
import { handleSwichCallback } from "../controllers/swichCallback.controller";

const router = express.Router();

router.get("/swich/callback", handleSwichCallback);
router.post("/swich/confirm", protect, authorize("student", "parent"), confirmSwichPayment);
router.post("/booking/:bookingId/checkout", protect, authorize("student", "parent"), createBookingCheckout);
router.get("/history", protect, authorize("student", "parent"), getTransactionHistory);

export default router;
