import { Router } from "express";
import { submitContact, getAllContacts, submitSupportRequest } from "../controllers/contact.controller";
import { protect, authorize } from "../middlewares/auth.middleware";
import { contactLimiter } from "../middlewares/rateLimiters";

const router = Router();

router.post("/", contactLimiter, submitContact);
router.get("/", protect, authorize("admin"), getAllContacts);
router.post("/support", contactLimiter, protect, submitSupportRequest);

export default router;