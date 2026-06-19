import { Router } from "express";
import { submitClaim } from "../controllers/guaranteeClaim.controller";
import { protect } from "../middlewares/auth.middleware";

const router = Router();

router.post("/claim", protect, submitClaim);

export default router;