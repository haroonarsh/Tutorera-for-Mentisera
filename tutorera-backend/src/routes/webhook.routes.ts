import { Router } from "express";
import { handleResendWebhook } from "../controllers/emailWebhook.controller";

const router = Router();

router.post("/resend", handleResendWebhook);

export default router;
