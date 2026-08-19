import { Router } from "express";
import {
  getOrCreateConversation,
  getMyConversations,
  getMessages,
  sendMessage,
} from "../controllers/chat.controller";
import { protect } from "../middlewares/auth.middleware";
import { validate, sendMessageSchema, getOrCreateConversationSchema } from "../validators/chat.validator";

const router = Router();

router.post("/conversation", protect, validate(getOrCreateConversationSchema), getOrCreateConversation);
router.get("/conversations", protect, getMyConversations);
router.get("/:conversationId/messages", protect, getMessages);
router.post("/:conversationId/messages", protect, validate(sendMessageSchema), sendMessage);

export default router;