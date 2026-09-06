import { Router } from "express";
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  getNotificationPreferences,
  updateNotificationPreferences,
} from "../controllers/notification.controller";
import { protect } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", protect, getMyNotifications);
router.get("/preferences", protect, getNotificationPreferences);
router.patch("/preferences", protect, updateNotificationPreferences);
router.patch("/read-all", protect, markAllAsRead);
router.patch("/:id/read", protect, markAsRead);

export default router;