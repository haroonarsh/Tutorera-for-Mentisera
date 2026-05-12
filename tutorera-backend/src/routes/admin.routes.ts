import { Router } from "express";
import {
  getPendingVerifications,
  verifyTutor,
  getAllUsers,
  toggleUserStatus,
} from "../controllers/admin.controller";
import { protect, authorize } from "../middlewares/auth.middleware";

const router = Router();

router.use(protect, authorize("admin")); // all routes admin only

router.get("/verifications", getPendingVerifications);
router.patch("/verify/:id", verifyTutor);
router.get("/users", getAllUsers);
router.patch("/users/:id/status", toggleUserStatus);

export default router;