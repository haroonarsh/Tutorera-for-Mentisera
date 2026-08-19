import { Router } from "express";
import { submitClaim } from "../controllers/guaranteeClaim.controller";
import { protect } from "../middlewares/auth.middleware";
import { validate, submitClaimSchema } from "../validators/guarantee.validator";

const router = Router();

router.post("/claim", protect, validate(submitClaimSchema), submitClaim);

export default router;