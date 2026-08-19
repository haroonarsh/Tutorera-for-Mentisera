import { Router } from "express";
import { submitContact, getAllContacts, submitSupportRequest } from "../controllers/contact.controller";
import { protect, authorize } from "../middlewares/auth.middleware";
import { contactLimiter } from "../middlewares/rateLimiters";
import { validate, submitContactSchema, submitSupportRequestSchema } from "../validators/contact.validator";

const router = Router();

router.post("/", contactLimiter, validate(submitContactSchema), submitContact);
router.get("/", protect, authorize("admin"), getAllContacts);
router.post("/support", contactLimiter, protect, validate(submitSupportRequestSchema), submitSupportRequest);

export default router;