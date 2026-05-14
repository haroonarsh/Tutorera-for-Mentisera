import { Router } from "express";
import { submitContact, getAllContacts } from "../controllers/contact.controller";
import { protect, authorize } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", submitContact);
router.get("/", protect, authorize("admin"), getAllContacts);

export default router;