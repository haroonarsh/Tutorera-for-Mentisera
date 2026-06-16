import { Router } from "express";
import { submitContact, getAllContacts, submitSupportRequest } from "../controllers/contact.controller";
import { protect, authorize } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", submitContact);
router.get("/", protect, authorize("admin"), getAllContacts);
router.post("/support", protect, submitSupportRequest);

export default router;