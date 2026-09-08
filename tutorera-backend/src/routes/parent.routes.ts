import { Router } from "express";
import { protect } from "../middlewares/auth.middleware";
import { otpRequestLimiter, otpVerifyLimiter } from "../middlewares/rateLimiters";
import {
  getMyParentProfile,
  addChildAccount,
  confirmChildAccount,
  removeChildAccount,
  updateParentSettings,
  saveParentOnboarding,
} from "../controllers/parent.controller";

const router = Router();

router.get("/profile", protect, getMyParentProfile);
router.post("/children", protect, otpRequestLimiter, addChildAccount);
router.post("/children/confirm", protect, otpVerifyLimiter, confirmChildAccount);
router.delete("/children/:childId", protect, removeChildAccount);
router.patch("/settings", protect, updateParentSettings);
router.post("/onboarding", protect, saveParentOnboarding);

export default router;
