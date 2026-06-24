import { Router } from "express";
import { getMyReferral, applyReferralCode } from "../controllers/referral.controller";
import { protect } from "../middlewares/auth.middleware";

const router = Router();

router.get("/my", protect, getMyReferral);
router.post("/apply", protect, applyReferralCode);

export default router;