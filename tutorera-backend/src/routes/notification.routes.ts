import { Router } from "express";
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
} from "../controllers/notification.controller";
import { protect } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", protect, getMyNotifications);
router.patch("/read-all", protect, markAllAsRead);
router.patch("/:id/read", protect, markAsRead);

export default router;