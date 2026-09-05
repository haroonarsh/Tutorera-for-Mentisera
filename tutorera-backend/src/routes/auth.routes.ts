import { Router } from "express";
import { register, login, logout, getMe, updateProfile, changePassword, upgradePlan, getMyUsage, googleAuth, selectRole, forgotPassword, resetPassword, exportData, deleteAccount, updateConsent } from "../controllers/auth.controller";
import { authorize, protect } from "../middlewares/auth.middleware";
import { validate, registerSchema, loginSchema, googleAuthSchema, selectRoleSchema, forgotPasswordSchema, resetPasswordSchema } from "../validators/auth.validator";
import { loginLimiter, registerLimiter, otpRequestLimiter, otpVerifyLimiter, googleAuthLimiter } from "../middlewares/rateLimiters";

const router = Router();

router.post("/register", registerLimiter, validate(registerSchema), register);
router.post("/login", loginLimiter, validate(loginSchema), login);
router.post("/google", googleAuthLimiter, validate(googleAuthSchema), googleAuth);
router.patch("/select-role", protect, validate(selectRoleSchema), selectRole);
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);
router.get("/me/usage", protect, getMyUsage);
router.get("/me/export", protect, exportData);
router.post("/me/delete-account", protect, deleteAccount);
router.patch("/me/consent", protect, updateConsent);
router.patch("/update-profile", protect, updateProfile);
router.patch("/change-password", protect, changePassword);
router.post("/forgot-password", otpRequestLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", otpVerifyLimiter, validate(resetPasswordSchema), resetPassword);
router.patch("/upgrade-plan", protect, authorize("admin"), upgradePlan);

export default router;