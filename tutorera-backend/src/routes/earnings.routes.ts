import { Router } from "express";
import { getMyEarnings } from "../controllers/earnings.controller";
import { protect } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", protect, getMyEarnings);

export default router;