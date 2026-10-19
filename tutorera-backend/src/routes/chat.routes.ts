import { Router } from "express";
import {
  getOrCreateConversation,
  getMyConversations,
  getMessages,
  sendMessage,
} from "../controllers/chat.controller";
import { protect, authorize("student", "tutor"), authorize } from "../middlewares/auth.middleware";
import { validate, sendMessageSchema, getOrCreateConversationSchema } from "../validators/chat.validator";

const router = Router();

router.post("/conversation", protect, authorize("student", "tutor"), validate(getOrCreateConversationSchema), getOrCreateConversation);
router.get("/conversations", protect, authorize("student", "tutor"), getMyConversations);
router.get("/:conversationId/messages", protect, authorize("student", "tutor"), getMessages);
router.post("/:conversationId/messages", protect, authorize("student", "tutor"), validate(sendMessageSchema), sendMessage);

export default router;