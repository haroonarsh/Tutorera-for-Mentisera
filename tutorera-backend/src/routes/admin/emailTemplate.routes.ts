import { Router } from "express";
import {
  listEmailTemplates,
  getEmailTemplate,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  getEmailTemplateCategories,
  testEmailTemplate,
} from "../../controllers/emailTemplate.controller";
import { protect, authorize } from "../../middlewares/auth.middleware";
import { requirePermission } from "../../middlewares/rbac.middleware";

const router = Router();

router.use(protect, authorize("admin"), requirePermission("system.monitor"));

router.get("/", listEmailTemplates);
router.get("/categories", getEmailTemplateCategories);
router.get("/:id", getEmailTemplate);
router.post("/", createEmailTemplate);
router.put("/:id", updateEmailTemplate);
router.delete("/:id", deleteEmailTemplate);
router.post("/:id/test", testEmailTemplate);

export default router;
