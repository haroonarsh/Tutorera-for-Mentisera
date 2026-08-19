import { Router } from "express";
import { getMyReferral, applyReferralCode } from "../controllers/referral.controller";
import { protect } from "../middlewares/auth.middleware";
import { validate, applyReferralCodeSchema } from "../validators/referral.validator";

const router = Router();

router.get("/my", protect, getMyReferral);
router.post("/apply", protect, validate(applyReferralCodeSchema), applyReferralCode);

export default router;