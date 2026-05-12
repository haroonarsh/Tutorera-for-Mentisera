import { Router } from "express";
import {
  createRequest, getAllRequests, getMyRequests,
  cancelRequest, placeBid, getBidsForRequest, acceptBid,
} from "../controllers/request.controller";
import { protect, authorize } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", protect, getAllRequests);
router.post("/", protect, authorize("student"), createRequest);
router.get("/my", protect, authorize("student"), getMyRequests);
router.patch("/:id/cancel", protect, authorize("student"), cancelRequest);
router.post("/:id/bids", protect, authorize("tutor"), placeBid);
router.get("/:id/bids", protect, authorize("student"), getBidsForRequest);
router.patch("/:id/bids/:bidId/accept", protect, authorize("student"), acceptBid);

export default router;