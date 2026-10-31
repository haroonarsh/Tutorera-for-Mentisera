import { Router, Response } from "express";
import { Types } from "mongoose";
import Booking from "../models/Booking.model";
import { protect, authorize } from "../middlewares/auth.middleware";
import { AuthRequest } from "../types";
import { logAudit } from "../utils/logAudit";

const router = Router();
const hosts: Record<string, "google_meet" | "microsoft_teams"> = {
  "meet.google.com": "google_meet",
  "teams.microsoft.com": "microsoft_teams",
};
const parseMeeting = (raw: unknown) => {
  if (typeof raw !== "string" || raw.length > 2048) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.username || url.password || url.port || url.hash) return null;
    const provider = hosts[url.hostname.toLowerCase()];
    if (!provider) return null;
    return { provider, url: url.toString() };
  } catch { return null; }
};
const getBooking = async (id: string) => Types.ObjectId.isValid(id) ? Booking.findById(id) : null;

// Meeting URLs are stored separately from public tutor and booking objects.
router.put("/:id/meeting", protect, authorize("tutor"), async (req: AuthRequest, res: Response): Promise<void> => {
  const meeting = parseMeeting(req.body?.url);
  if (!meeting) { res.status(400).json({ success: false, message: "Use a valid Google Meet or Microsoft Teams HTTPS URL." }); return; }
  const booking = await getBooking(req.params.id);
  if (!booking) { res.status(404).json({ success: false, message: "Booking not found." }); return; }
  if (booking.tutor.toString() !== req.user!._id.toString()) { res.status(403).json({ success: false, message: "Not your booking." }); return; }
  if (booking.teachingMode === "in-person" || booking.status === "cancelled" || booking.status === "completed" || booking.paymentStatus !== "confirmed") {
    res.status(409).json({ success: false, message: "An active paid online booking is required." }); return;
  }
  const Meeting = (await import("../models/BookingMeeting.model")).default;
  const saved = await Meeting.findOneAndUpdate(
    { booking: booking._id },
    { $set: { provider: meeting.provider, url: meeting.url, submittedBy: req.user!._id } },
    { upsert: true, new: true, runValidators: true }
  );
  await logAudit({ action: "booking_meeting_updated", actor: req.user?.name, actorId: req.user?._id.toString(), entity: "Booking", targetId: booking.id, metadata: { provider: meeting.provider } });
  res.json({ success: true, meeting: { provider: saved.provider, updatedAt: saved.updatedAt } });
});

router.get("/:id/meeting", protect, async (req: AuthRequest, res: Response): Promise<void> => {
  const booking = await getBooking(req.params.id);
  if (!booking) { res.status(404).json({ success: false, message: "Booking not found." }); return; }
  const userId = req.user!._id.toString();
  const allowed = ["admin", "superadmin"].includes(req.user!.role) || booking.student.toString() === userId || booking.tutor.toString() === userId;
  if (!allowed) { res.status(403).json({ success: false, message: "Access denied." }); return; }
  if (booking.status === "cancelled" || booking.status === "completed" || booking.paymentStatus !== "confirmed") {
    res.status(409).json({ success: false, message: "Meeting access is not available for this booking." }); return;
  }
  const Meeting = (await import("../models/BookingMeeting.model")).default;
  const meeting = await Meeting.findOne({ booking: booking._id }).select("provider url updatedAt").lean();
  res.setHeader("Cache-Control", "private, no-store");
  res.json({ success: true, meeting: meeting || null });
});
export default router;
