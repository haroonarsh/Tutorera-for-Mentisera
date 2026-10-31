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
  if (typeof raw !== "string" || raw.length > 2048 || raw.trim() !== raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.username || url.password || url.port || url.hash) return null;
    const provider = hosts[url.hostname.toLowerCase()];
    if (!provider) return null;
    if (provider === "google_meet" && (!/^\/[a-z]{3}-[a-z]{4}-[a-z]{3}\/?$/i.test(url.pathname) || url.search)) return null;
    if (provider === "microsoft_teams" && !/^\/l\/meetup-join\/[^/]+\/0\/?$/i.test(url.pathname)) return null;
    return { provider, url: url.toString() };
  } catch { return null; }
};
const getBooking = async (id: string) => Types.ObjectId.isValid(id) ? Booking.findById(id) : null;

// Meeting URLs are stored separately from public tutor and booking objects.
router.put("/:id/meeting", protect, authorize("tutor"), async (req: AuthRequest, res: Response): Promise<void> => {
  res.setHeader("Cache-Control", "private, no-store");
  const meeting = parseMeeting(req.body?.url);
  if (!meeting) { res.status(400).json({ success: false, message: "Use a valid Google Meet or Microsoft Teams HTTPS URL." }); return; }
  const booking = await getBooking(req.params.id);
  if (!booking) { res.status(404).json({ success: false, message: "Booking not found." }); return; }
  if (booking.tutor.toString() !== req.user!._id.toString()) { res.status(403).json({ success: false, message: "Not your booking." }); return; }
  if (booking.teachingMode === "in-person" || !["upcoming", "ongoing"].includes(booking.status) || booking.paymentStatus !== "confirmed") {
    res.status(409).json({ success: false, message: "An active paid online booking is required." }); return;
  }
  const Meeting = (await import("../models/BookingMeeting.model")).default;
  const saved = await Meeting.findOneAndUpdate(
    { booking: booking._id },
    { $set: { provider: meeting.provider, url: meeting.url, submittedBy: req.user!._id } },
    { upsert: true, new: true, runValidators: true }
  );
  if (!saved) { res.status(500).json({ success: false, message: "Could not save meeting details." }); return; }
  await logAudit({ action: "booking_meeting_updated", actor: req.user?.name, actorId: req.user?._id.toString(), entity: "Booking", targetId: booking.id, metadata: { provider: meeting.provider } });
  res.setHeader("Cache-Control", "private, no-store");
  res.json({ success: true, meeting: { provider: saved.provider, updatedAt: saved.updatedAt } });
});

router.get("/:id/meeting", protect, async (req: AuthRequest, res: Response): Promise<void> => {
  res.setHeader("Cache-Control", "private, no-store");
  const booking = await getBooking(req.params.id);
  if (!booking) { res.status(404).json({ success: false, message: "Booking not found." }); return; }
  const userId = req.user!._id.toString();
  const allowed = req.user!.role === "admin" || booking.student.toString() === userId || booking.tutor.toString() === userId;
  if (!allowed) { res.status(403).json({ success: false, message: "Access denied." }); return; }
  if (booking.teachingMode === "in-person" || !["upcoming", "ongoing"].includes(booking.status) || booking.paymentStatus !== "confirmed") {
    res.status(409).json({ success: false, message: "Meeting access is not available for this booking." }); return;
  }
  const Meeting = (await import("../models/BookingMeeting.model")).default;
  const meeting = await Meeting.findOne({ booking: booking._id }).select("+url provider updatedAt").lean();
  res.setHeader("Cache-Control", "private, no-store");
  res.json({ success: true, meeting: meeting ? { provider: meeting.provider, url: meeting.url, updatedAt: meeting.updatedAt } : null });
});
export default router;
