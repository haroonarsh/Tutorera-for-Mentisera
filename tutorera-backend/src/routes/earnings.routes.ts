import { Router } from "express";
import { downloadEarningsPDF, getMyEarnings } from "../controllers/earnings.controller";
import { protect } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", protect, getMyEarnings);
router.get("/report/pdf", protect, downloadEarningsPDF);

export default router;