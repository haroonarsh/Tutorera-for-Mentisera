import { Response } from "express";
import { AuthRequest } from "../types";
import ParentProfile from "../models/ParentProfile.model";
import User from "../models/User.model";
import StudentProfile from "../models/StudentProfile.model";
import Booking from "../models/Booking.model";
import { advanceAccountStatus } from "../services/accountLifecycle.service";
import ParentLinkRequest from "../models/ParentLinkRequest.model";
import sendEmail from "../utils/sendEmail";
import crypto from "crypto";
import mongoose from "mongoose";
import { escapeHtml } from "../utils/escapeHtml";

const LINK_CODE_TTL_MS = 15 * 60 * 1000;
const MAX_LINK_ATTEMPTS = 5;

function linkCodeHash(code: string) {
  return crypto.createHmac("sha256", process.env.JWT_SECRET || "parent-link-fallback")
    .update(code)
    .digest("hex");
}

export const getMyParentProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user?.role !== "parent") {
    res.status(403).json({ success: false, message: "Access denied." });
    return;
  }

  let profile = await ParentProfile.findOne({ user: req.user._id }).lean();

  if (!profile) {
    profile = await ParentProfile.create({ user: req.user._id, children: [] });
  }

  const childUserIds = (profile as any).children.map((c: any) => c.studentUser);

  const childBookings = childUserIds.length > 0
    ? await Booking.find({ student: { $in: childUserIds } })
        .populate("tutor", "name")
        .populate("request", "subject")
        .sort("-createdAt")
        .limit(20)
        .lean()
    : [];

  const childProfiles = await StudentProfile.find({ user: { $in: childUserIds } }).lean();
  const childMap: Record<string, any> = {};
  for (const cp of childProfiles) childMap[cp.user.toString()] = cp;

  res.status(200).json({
    success: true,
    profile: {
      ...profile,
      children: (profile as any).children.map((c: any) => ({
        ...c,
        studentProfile: childMap[c.studentUser?.toString()] || null,
      })),
    },
    recentBookings: childBookings.map((b: any) => ({
      _id: b._id,
      studentName: (b.student as any)?.name || "Student",
      tutorName: (b.tutor as any)?.name || "Tutor",
      subject: (b.request as any)?.subject || "Tutoring",
      amount: b.amount,
      status: b.status,
      teachingMode: b.teachingMode,
      createdAt: b.createdAt,
    })),
  });
};

export const addChildAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user?.role !== "parent") {
    res.status(403).json({ success: false, message: "Access denied." });
    return;
  }

  const { studentEmail, name, level, subjects, relationship } = req.body;

  if (!studentEmail || !name) {
    res.status(400).json({ success: false, message: "Student email and name are required." });
    return;
  }

  const normalizedEmail = String(studentEmail).trim().toLowerCase();
  const student = await User.findOne({ email: normalizedEmail });
  if (!student || student.role !== "student") {
    res.status(404).json({ success: false, message: "Student account not found." });
    return;
  }

  let profile = await ParentProfile.findOne({ user: req.user._id });
  if (!profile) {
    profile = await ParentProfile.create({ user: req.user._id, children: [] });
  }

  const alreadyLinked = profile.children.some(
    (c) => c.studentUser?.toString() === student._id.toString()
  );
  if (alreadyLinked) {
    res.status(409).json({ success: false, message: "This student account is already linked." });
    return;
  }

  await ParentLinkRequest.updateMany(
    { parent: req.user._id, student: student._id, status: "pending" },
    { status: "cancelled" }
  );

  const code = crypto.randomInt(100000, 1000000).toString();
  const linkRequest = await ParentLinkRequest.create({
    parent: req.user._id,
    student: student._id,
    codeHash: linkCodeHash(code),
    name: String(name).trim().slice(0, 100),
    level: String(level || "").trim().slice(0, 100),
    subjects: Array.isArray(subjects) ? subjects.map((item) => String(item).trim()).filter(Boolean).slice(0, 12) : [],
    relationship: ["child", "sibling", "other"].includes(relationship) ? relationship : "child",
    expiresAt: new Date(Date.now() + LINK_CODE_TTL_MS),
  });

  try {
    await sendEmail({
      to: student.email,
      userId: student._id.toString(),
      eventType: "account.parent_link_verification_requested",
      templateId: "parent_link_verification_code",
      relatedEntityType: "ParentLinkRequest",
      relatedEntityId: linkRequest._id.toString(),
      subject: "TUTORERA® — Confirm parent account access",
      preheader: "Use this code only if you approve parent access to your tutoring account.",
      html: `<h2>Confirm parent account access</h2><p>Hello ${escapeHtml(student.name)},</p><p>A parent account requested access to view and manage your TUTORERA tutoring activity.</p><p style="font-size:28px;font-weight:800;letter-spacing:6px">${code}</p><p>This code expires in 15 minutes. Share it only if you approve this access. If you did not expect this request, do not share the code.</p>`,
    });
  } catch (error) {
    await ParentLinkRequest.findByIdAndUpdate(linkRequest._id, { status: "cancelled" });
    throw error;
  }

  res.status(202).json({ success: true, message: "A verification code was sent to the student.", requestId: linkRequest._id, expiresInSeconds: LINK_CODE_TTL_MS / 1000 });
};

export const confirmChildAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user?.role !== "parent") {
    res.status(403).json({ success: false, message: "Access denied." });
    return;
  }

  const { requestId, code } = req.body;
  if (!mongoose.isValidObjectId(requestId) || !/^\d{6}$/.test(String(code || ""))) {
    res.status(400).json({ success: false, message: "A valid request and six-digit code are required." });
    return;
  }

  const linkRequest = await ParentLinkRequest.findOne({
    _id: requestId,
    parent: req.user._id,
    status: "pending",
  }).select("+codeHash");

  if (!linkRequest || linkRequest.expiresAt <= new Date() || linkRequest.attempts >= MAX_LINK_ATTEMPTS) {
    res.status(410).json({ success: false, message: "This verification request has expired. Request a new code." });
    return;
  }

  const suppliedHash = linkCodeHash(String(code));
  const matches = crypto.timingSafeEqual(Buffer.from(linkRequest.codeHash, "hex"), Buffer.from(suppliedHash, "hex"));
  if (!matches) {
    linkRequest.attempts += 1;
    await linkRequest.save();
    res.status(400).json({ success: false, message: "The verification code is incorrect.", attemptsRemaining: Math.max(0, MAX_LINK_ATTEMPTS - linkRequest.attempts) });
    return;
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const profile = await ParentProfile.findOneAndUpdate(
        { user: req.user?._id, "children.studentUser": { $ne: linkRequest.student } },
        { $push: { children: { studentUser: linkRequest.student, name: linkRequest.name, level: linkRequest.level, subjects: linkRequest.subjects, relationship: linkRequest.relationship } } },
        { new: true, upsert: true, session }
      );
      if (!profile) throw Object.assign(new Error("This student account is already linked."), { statusCode: 409 });
      linkRequest.status = "confirmed";
      linkRequest.confirmedAt = new Date();
      await linkRequest.save({ session });
    });
  } finally {
    await session.endSession();
  }

  res.status(200).json({ success: true, message: "Student consent confirmed. The account is now linked." });
};

export const removeChildAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user?.role !== "parent") {
    res.status(403).json({ success: false, message: "Access denied." });
    return;
  }

  const { childId } = req.params;

  const profile = await ParentProfile.findOne({ user: req.user._id });
  if (!profile) {
    res.status(404).json({ success: false, message: "Parent profile not found." });
    return;
  }

  const before = profile.children.length;
  profile.children = profile.children.filter(
    (c) => c._id?.toString() !== childId
  );

  if (profile.children.length === before) {
    res.status(404).json({ success: false, message: "Child account not found." });
    return;
  }

  await profile.save();

  res.status(200).json({ success: true, message: "Child account removed." });
};

export const updateParentSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user?.role !== "parent") {
    res.status(403).json({ success: false, message: "Access denied." });
    return;
  }

  const { approvalRequiredForBookings, spendingLimitMonthly, notificationsEnabled } = req.body;

  const profile = await ParentProfile.findOneAndUpdate(
    { user: req.user._id },
    {
      $set: {
        ...(approvalRequiredForBookings !== undefined && { approvalRequiredForBookings }),
        ...(spendingLimitMonthly !== undefined && { spendingLimitMonthly }),
        ...(notificationsEnabled !== undefined && { notificationsEnabled }),
      },
    },
    { new: true, upsert: true }
  );

  res.status(200).json({ success: true, profile });
};

// @desc    Save parent onboarding
// @route   POST /api/parent/onboarding
// @access  Private (parent)
export const saveParentOnboarding = async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user?.role !== "parent") {
    res.status(403).json({ success: false, message: "Access denied." });
    return;
  }

  const { name, phone, city, approvalRequiredForBookings, spendingLimitMonthly, notificationsEnabled } = req.body;

  await User.findByIdAndUpdate(req.user._id, {
    name: name || req.user.name,
    phone: phone || req.user.phone,
    city: city || req.user.city,
  });

  const profile = await ParentProfile.findOneAndUpdate(
    { user: req.user._id },
    {
      $set: {
        ...(approvalRequiredForBookings !== undefined && { approvalRequiredForBookings }),
        ...(spendingLimitMonthly !== undefined && { spendingLimitMonthly }),
        ...(notificationsEnabled !== undefined && { notificationsEnabled }),
      },
    },
    { new: true, upsert: true }
  );

  await advanceAccountStatus(req.user._id.toString(), "profile_complete");

  res.status(200).json({
    success: true,
    message: "Parent onboarding completed successfully",
    profile,
  });
};
