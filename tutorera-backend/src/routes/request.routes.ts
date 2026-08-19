import { Router } from "express";
import {
  createRequest, getAllRequests, getMyRequests,
  cancelRequest, placeBid, getBidsForRequest, acceptBid,
  createDirectBookingRequest, getMyDirectRequests, rejectBid,
  getPublicRequestsPreview,
} from "../controllers/request.controller";
import { protect, authorize, optionalAuth } from "../middlewares/auth.middleware";
import { checkBidLimit } from "../middlewares/bidLimit.middleware";
import { validate, createRequestSchema, placeBidSchema, createDirectBookingRequestSchema } from "../validators/request.validator";

const router = Router();

router.get("/public/preview", getPublicRequestsPreview);
router.get("/", optionalAuth, getAllRequests);
router.post("/direct", protect, authorize("student"), validate(createDirectBookingRequestSchema), createDirectBookingRequest);
router.get("/direct/my", protect, authorize("tutor"), getMyDirectRequests);
router.patch("/:id/bids/:bidId/reject", protect, rejectBid);
router.post("/", protect, authorize("student"), validate(createRequestSchema), createRequest);
router.get("/my", protect, authorize("student"), getMyRequests);
router.patch("/:id/cancel", protect, authorize("student"), cancelRequest);
router.post("/:id/bids", protect, authorize("tutor"), checkBidLimit, validate(placeBidSchema), placeBid);
router.get("/:id/bids", protect, authorize("student"), getBidsForRequest);
router.patch("/:id/bids/:bidId/accept", protect, acceptBid);

export default router;