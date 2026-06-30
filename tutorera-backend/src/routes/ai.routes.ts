import { Router } from "express";
import { chatWithAI } from "../controllers/ai.controller";
import { protect } from "../middlewares/auth.middleware";

const router = Router();

// Only logged-in students and tutors can use AI chat
router.post("/chat", protect, chatWithAI);

export default router;