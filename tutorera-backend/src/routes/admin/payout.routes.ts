import { Router } from "express";
import { protect, authorize } from "../../middlewares/auth.middleware";
import { AuthRequest } from "../../types";
import {
  listPayouts,
  markPayoutComplete,
  markPayoutFailed,
  processPendingPayouts,
} from "../../services/payout.service";

const router = Router();
router.use(protect, authorize("admin"));

/** List payout requests, optionally filtered by state or tutorId. */
router.get("/", async (req, res) => {
  const { state, tutorId, page = "1", limit = "20" } = req.query as Record<string, string>;
  const result = await listPayouts({ state, tutorId, page: parseInt(page, 10), limit: parseInt(limit, 10) });
  res.json({ success: true, ...result });
});

/**
 * Trigger a payout scan manually (same logic as the scheduled job).
 * Dry-run by default: pass ?apply=true to actually create payout requests.
 */
router.post("/scan", async (req, res) => {
  if (req.query.apply !== "true") {
    res.json({ success: true, message: "Dry-run only. Pass ?apply=true to create payout requests." });
    return;
  }
  const result = await processPendingPayouts();
  res.json({ success: true, result });
});

/**
 * Mark a payout complete after manually completing the bank transfer.
 * Requires an external evidence reference — never marks paid without one.
 */
router.post("/:transferRef/complete", async (req, res) => {
  const authReq = req as AuthRequest;
  const { evidenceRef, adminNote } = req.body as { evidenceRef?: string; adminNote?: string };
  if (!evidenceRef?.trim()) {
    res.status(400).json({ success: false, message: "evidenceRef is required" });
    return;
  }
  await markPayoutComplete({
    transferRef: req.params.transferRef,
    evidenceRef: evidenceRef.trim(),
    adminId: authReq.user!._id.toString(),
    adminNote,
  });
  res.json({ success: true });
});

/** Mark a payout failed and return the bookings to pending. */
router.post("/:transferRef/fail", async (req, res) => {
  const authReq = req as AuthRequest;
  const { adminNote } = req.body as { adminNote?: string };
  if (!adminNote?.trim()) {
    res.status(400).json({ success: false, message: "adminNote is required when marking a payout failed" });
    return;
  }
  await markPayoutFailed({
    transferRef: req.params.transferRef,
    adminId: authReq.user!._id.toString(),
    adminNote: adminNote.trim(),
  });
  res.json({ success: true });
});

export default router;
