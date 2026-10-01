import { Router } from "express";
import {
  listDisciplineSubjectMaps,
  createDisciplineSubjectMap,
  updateDisciplineSubjectMap,
  deleteDisciplineSubjectMap,
} from "../../controllers/disciplineSubjectMap.controller";
import { protect, authorize } from "../../middlewares/auth.middleware";
import { requirePermission } from "../../middlewares/rbac.middleware";

const router = Router();

router.use(protect, authorize("admin"), requirePermission("market.configure"));

router.get("/", listDisciplineSubjectMaps);
router.post("/", createDisciplineSubjectMap);
router.put("/:id", updateDisciplineSubjectMap);
router.delete("/:id", deleteDisciplineSubjectMap);

export default router;
