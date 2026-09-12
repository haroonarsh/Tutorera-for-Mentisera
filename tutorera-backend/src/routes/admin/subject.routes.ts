import { Router } from "express";
import {
  listSubjects,
  getSubject,
  createSubject,
  updateSubject,
  deleteSubject,
  getSubjectCategories,
} from "../../controllers/subject.controller";
import { protect, authorize } from "../../middlewares/auth.middleware";
import { requirePermission } from "../../middlewares/rbac.middleware";

const router = Router();

router.use(protect, authorize("admin"), requirePermission("market.configure"));

router.get("/", listSubjects);
router.get("/categories", getSubjectCategories);
router.get("/:id", getSubject);
router.post("/", createSubject);
router.put("/:id", updateSubject);
router.delete("/:id", deleteSubject);

export default router;
