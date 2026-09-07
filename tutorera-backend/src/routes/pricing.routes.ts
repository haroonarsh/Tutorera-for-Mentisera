import { Router } from "express";
import { getPricingInsight } from "../controllers/pricing.controller";

const router = Router();

router.get("/insights", getPricingInsight);

export default router;
