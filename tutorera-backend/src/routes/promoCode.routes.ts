import { Router } from "express";
import { validatePromoCode, redeemPromoCode } from "../controllers/promoCode.controller";
import { protect, authorize } from "../middlewares/auth.middleware";

const router = Router();

router.post("/validate", protect, authorize("student", "parent"), validatePromoCode);
router.post("/redeem", protect, authorize("student", "parent"), redeemPromoCode);

export default router;
