import { Response } from "express";
import { AuthRequest } from "../types";
import ParentProfile from "../models/ParentProfile.model";
import User from "../models/User.model";
import StudentProfile from "../models/StudentProfile.model";
import Booking from "../models/Booking.model";
import { advanceAccountStatus } from "../services/accountLifecycle.service";

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

  const { studentUserId, name, level, subjects, relationship } = req.body;

  if (!studentUserId || !name) {
    res.status(400).json({ success: false, message: "studentUserId and name are required." });
    return;
  }

  const student = await User.findById(studentUserId);
  if (!student || student.role !== "student") {
    res.status(404).json({ success: false, message: "Student account not found." });
    return;
  }

  let profile = await ParentProfile.findOne({ user: req.user._id });
  if (!profile) {
    profile = await ParentProfile.create({ user: req.user._id, children: [] });
  }

  const alreadyLinked = profile.children.some(
    (c) => c.studentUser?.toString() === studentUserId
  );
  if (alreadyLinked) {
    res.status(409).json({ success: false, message: "This student account is already linked." });
    return;
  }

  profile.children.push({
    studentUser: new (require("mongoose").Types.ObjectId)(studentUserId),
    name: name.trim(),
    level: level || "",
    subjects: subjects || [],
    relationship: relationship || "child",
  } as any);

  await profile.save();

  res.status(200).json({ success: true, message: "Child account linked.", profile });
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
