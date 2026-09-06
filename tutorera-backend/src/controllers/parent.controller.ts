import { Response } from "express";
import { AuthRequest, IUser } from "../types";
import User from "../models/User.model";
import { logAudit } from "../utils/logAudit";
import { sendNotification } from "../utils/socket";
import logger from "../config/logger";

// @desc    Link child account to parent
// @route   POST /api/parent/link-child
// @access  Private (parent)
export const linkChild = async (req: AuthRequest, res: Response): Promise<void> => {
  const { childEmail, childName } = req.body;
  const parentId = req.user?._id;

  if (!childEmail) {
    res.status(400).json({ success: false, message: "Child email is required." });
    return;
  }

  const child = await User.findOne({ email: childEmail.toLowerCase(), role: "student" });
  if (!child) {
    res.status(404).json({ success: false, message: "Student account not found with this email." });
    return;
  }

  if (child.parentGuardianEmail && child.parentGuardianEmail !== (req.user as any)?.email) {
    res.status(400).json({ success: false, message: "This student account is already linked to another parent/guardian." });
    return;
  }

  const parent = await User.findById(parentId);
  if (!parent || (parent as IUser).role !== "parent") {
    res.status(403).json({ success: false, message: "Only parent accounts can link children." });
    return;
  }

  if (!(parent as IUser).children?.includes(child._id)) {
    (parent as IUser).children = [...((parent as IUser).children || []), child._id];
    await parent.save();
  }

  child.parentGuardianEmail = ((req.user as IUser)?.email || "").toString();
  child.parentGuardianName = req.user?.name;
  child.parentConsentVerified = true;
  await child.save();

  await logAudit({
    action: "parent_linked_child",
    actor: req.user?.name || "Parent",
    actorId: parentId?.toString(),
    entity: "User",
    targetId: child._id.toString(),
    targetName: child.name,
  });

  const io = req.app.get("io");
  await sendNotification(io, child._id.toString(), {
    title: "Parent Account Linked",
    message: `Your parent/guardian (${req.user?.name}) has linked their account to yours.`,
    type: "general",
    link: "/dashboard",
  });

  res.status(200).json({ success: true, message: "Child account linked successfully.", child: { _id: child._id, name: child.name, email: child.email } });
};

// @desc    Unlink child account from parent
// @route   DELETE /api/parent/link-child/:childId
// @access  Private (parent)
export const unlinkChild = async (req: AuthRequest, res: Response): Promise<void> => {
  const childId = Array.isArray(req.params.childId) ? req.params.childId[0] : req.params.childId;
  const parentId = req.user?._id;

  const parent = await User.findById(parentId);
  if (!parent || (parent as IUser).role !== "parent") {
    res.status(403).json({ success: false, message: "Only parent accounts can unlink children." });
    return;
  }

  parent.children = ((parent as IUser).children || []).filter((id: any) => id.toString() !== childId);
  await parent.save();

  const child = await User.findById(childId);
  if (child) {
    child.parentGuardianEmail = undefined as any;
    child.parentGuardianName = undefined as any;
    child.parentConsentVerified = false;
    await child.save();
  }

  await logAudit({
    action: "parent_unlinked_child",
    actor: req.user?.name || "Parent",
    actorId: parentId?.toString(),
    entity: "User",
    targetId: childId,
  });

  res.status(200).json({ success: true, message: "Child account unlinked successfully." });
};

// @desc    Get linked children for parent
// @route   GET /api/parent/children
// @access  Private (parent)
export const getMyChildren = async (req: AuthRequest, res: Response): Promise<void> => {
  const parentId = req.user?._id;

  const parent = await User.findById(parentId).populate("children", "name email phone city createdAt role isMinor");
  if (!parent || (parent as IUser).role !== "parent") {
    res.status(403).json({ success: false, message: "Only parent accounts can view linked children." });
    return;
  }

  const children = await Promise.all(
    (parent.children || []).map(async (child: any) => {
      const bookings = await (await import("../models/Booking.model")).default.find({ student: child._id, status: { $in: ["upcoming", "ongoing"] } })
        .populate("tutor", "name avatar")
        .populate("request", "subject level")
        .sort("-createdAt")
        .lean();

      const requests = await (await import("../models/Request.model")).default.find({ student: child._id, status: { $in: ["open", "published", "receiving_offers", "negotiating"] } })
        .sort("-createdAt")
        .lean();

      return {
        _id: child._id,
        name: child.name,
        email: child.email,
        phone: child.phone,
        city: child.city,
        isMinor: child.isMinor,
        upcomingBookings: bookings.length,
        activeRequests: requests.length,
        recentBookings: bookings.slice(0, 5).map((b: any) => ({
          _id: b._id,
          subject: b.request?.subject || "General",
          tutorName: b.tutor?.name || "Tutor",
          status: b.status,
          createdAt: b.createdAt,
        })),
      };
    })
  );

  res.status(200).json({ success: true, children });
};
