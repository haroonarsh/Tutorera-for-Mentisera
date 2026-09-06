import { Router } from "express";
import { protect } from "../middlewares/auth.middleware";
import { linkChild, unlinkChild, getMyChildren } from "../controllers/parent.controller";

const router = Router();

router.post("/link-child", protect, linkChild);
router.delete("/link-child/:childId", protect, unlinkChild);
router.get("/children", protect, getMyChildren);

export default router;
