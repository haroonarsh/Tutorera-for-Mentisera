import { Router } from "express";
import {
  getOrCreateConversation,
  getMyConversations,
  getMessages,
  sendMessage,
} from "../controllers/chat.controller";
import { protect } from "../middlewares/auth.middleware";

const router = Router();

router.post("/conversation", protect, getOrCreateConversation);
router.get("/conversations", protect, getMyConversations);
router.get("/:conversationId/messages", protect, getMessages);
router.post("/:conversationId/messages", protect, sendMessage);

export default router;