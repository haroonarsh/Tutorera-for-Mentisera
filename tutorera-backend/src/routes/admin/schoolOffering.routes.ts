import { Router } from "express";
import {
  listAdminSchoolOfferings,
  updateAdminSchoolOffering,
} from "../../controllers/schoolOffering.controller";
import { protect, authorize } from "../../middlewares/auth.middleware";
import { requirePermission } from "../../middlewares/rbac.middleware";

const router = Router();

router.use(protect, authorize("admin"), requirePermission("market.configure"));

router.get("/", listAdminSchoolOfferings);
router.patch("/:id", updateAdminSchoolOffering);

export default router;
