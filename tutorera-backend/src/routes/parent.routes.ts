import { Router } from "express";
import { protect } from "../middlewares/auth.middleware";
import {
  getMyParentProfile,
  addChildAccount,
  removeChildAccount,
  updateParentSettings,
} from "../controllers/parent.controller";

const router = Router();

router.get("/profile", protect, getMyParentProfile);
router.post("/children", protect, addChildAccount);
router.delete("/children/:childId", protect, removeChildAccount);
router.patch("/settings", protect, updateParentSettings);

export default router;
