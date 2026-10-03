import { Router } from "express";
import { getPricingInsight } from "../controllers/pricing.controller";
import { protect } from "../middlewares/auth.middleware";

const router = Router();

// Aggregates completed-booking rates and live tutor profile rates by city and
// subject, so it exposes real marketplace pricing activity to anonymous callers.
router.get("/insights", protect, getPricingInsight);

export default router;
