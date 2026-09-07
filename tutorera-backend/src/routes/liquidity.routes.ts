import { Router } from "express";
import { protect } from "../middlewares/auth.middleware";
import { getLiquidityScore, getMarketLiquidityOverview } from "../controllers/liquidity.controller";

const router = Router();

router.get("/score", protect, getLiquidityScore);
router.get("/overview", protect, getMarketLiquidityOverview);

export default router;
