import { Router } from "express";
import {
  createPromoCode,
  listPromoCodes,
  getPromoCode,
  updatePromoCode,
  deletePromoCode,
  listAllRedemptions,
} from "../../controllers/promoCode.controller";
import { protect, authorize } from "../../middlewares/auth.middleware";
import { requirePermission } from "../../middlewares/rbac.middleware";

const router = Router();

router.use(protect, authorize("admin"), requirePermission("growth.manage"));

router.get("/redemptions/all", listAllRedemptions);
router.get("/", listPromoCodes);
router.get("/:id", getPromoCode);
router.post("/", createPromoCode);
router.put("/:id", updatePromoCode);
router.delete("/:id", deletePromoCode);

export default router;
