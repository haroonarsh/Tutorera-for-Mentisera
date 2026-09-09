import { Router } from "express";
import { getPublicFlag, listFeatureFlags, upsertFeatureFlag } from "../controllers/featureFlag.controller";
import { protect, authorize } from "../middlewares/auth.middleware";
import { requirePermission } from "../middlewares/rbac.middleware";

const router = Router();
router.get("/admin/list", protect, authorize("admin"), requirePermission("market.configure"), listFeatureFlags);
router.put("/admin/:key", protect, authorize("admin"), requirePermission("market.configure"), upsertFeatureFlag);
router.get("/:key", getPublicFlag);
export default router;
