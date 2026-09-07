import { Router } from "express";
import { getTutoringIndex } from "../controllers/tutoringIndex.controller";

const router = Router();

router.get("/", getTutoringIndex);

export default router;
