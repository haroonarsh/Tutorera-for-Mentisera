import { Router } from "express";
import { protect, authorize } from "../../middlewares/auth.middleware";
import { requirePermission } from "../../middlewares/rbac.middleware";
import {
  createAcademicCategory, createAcademicDiscipline, createAcademicSubject, createTeachingEligibilityRule,
  getAcademicFrameworkOverview, listAcademicCategories, listAcademicDisciplines, listAcademicSubjects,
  listTeachingEligibilityRules, updateAcademicCategory, updateAcademicDiscipline, updateAcademicSubject,
  updateTeachingEligibilityRule,
} from "../../controllers/academicFramework.controller";

const router = Router();
router.use(protect, authorize("admin"), requirePermission("market.configure"));

router.get("/overview", getAcademicFrameworkOverview);
router.route("/categories").get(listAcademicCategories).post(createAcademicCategory);
router.patch("/categories/:id", updateAcademicCategory);
router.route("/disciplines").get(listAcademicDisciplines).post(createAcademicDiscipline);
router.patch("/disciplines/:id", updateAcademicDiscipline);
router.route("/subjects").get(listAcademicSubjects).post(createAcademicSubject);
router.patch("/subjects/:id", updateAcademicSubject);
router.route("/eligibility-rules").get(listTeachingEligibilityRules).post(createTeachingEligibilityRule);
router.patch("/eligibility-rules/:id", updateTeachingEligibilityRule);

export default router;
