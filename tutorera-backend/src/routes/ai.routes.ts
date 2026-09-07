import { Router } from "express";
import { chatWithAI, parseRequestText } from "../controllers/ai.controller";
import { protect } from "../middlewares/auth.middleware";
import { aiChatLimiter } from "../middlewares/rateLimiters";

const router = Router();

// Only logged-in students and tutors can use AI chat
router.post("/chat", aiChatLimiter, protect, chatWithAI);
router.post("/parse-request", protect, parseRequestText);

export default router;