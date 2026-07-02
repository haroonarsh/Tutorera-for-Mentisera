import { Router } from "express";
import { register, login, logout, getMe, updateProfile, changePassword, upgradePlan, getMyUsage } from "../controllers/auth.controller";
import { protect } from "../middlewares/auth.middleware";
import { validate, registerSchema, loginSchema } from "../validators/auth.validator";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);
router.get("/me/usage", protect, getMyUsage);
router.patch("/update-profile", protect, updateProfile);
router.patch("/change-password", protect, changePassword);
router.patch("/upgrade-plan", protect, upgradePlan);

export default router;