import { Response } from "express";
import { AuthRequest } from "../types";
import Subject from "../models/Subject.model";
import { logAudit } from "../utils/logAudit";

const generateSlug = (name: string): string =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export const listSubjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, isActive, level } = req.query;
    const filter: any = {};
    if (category) filter.category = category;
    if (typeof isActive !== "undefined") filter.isActive = isActive === "true";
    if (level) filter.level = level;

    const subjects = await Subject.find(filter).sort({ sortOrder: 1, name: 1 }).lean();
    res.json({ success: true, subjects });
  } catch (error) {
    console.error("Error listing subjects:", error);
    res.status(500).json({ success: false, message: "Failed to list subjects" });
  }
};

export const getSubject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      res.status(404).json({ success: false, message: "Subject not found" });
      return;
    }
    res.json({ success: true, subject });
  } catch (error) {
    console.error("Error getting subject:", error);
    res.status(500).json({ success: false, message: "Failed to get subject" });
  }
};

export const createSubject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, category, level, imageUrl, sortOrder, metadata } = req.body;

    if (!name || !category) {
      res.status(400).json({ success: false, message: "Name and category are required" });
      return;
    }

    const slug = generateSlug(name);
    const existing = await Subject.findOne({ slug });
    if (existing) {
      res.status(400).json({ success: false, message: "Subject with this name already exists" });
      return;
    }

    const subject = await Subject.create({
      name,
      slug,
      description: description || "",
      category,
      level: level || [],
      imageUrl,
      sortOrder: sortOrder || 0,
      metadata,
      createdBy: req.user?._id,
      updatedBy: req.user?._id,
    });

    await logAudit({
      action: "subject_created",
      actor: req.user?.name,
      actorId: req.user?._id?.toString(),
      entity: "Subject",
      targetId: subject._id.toString(),
      targetName: subject.name,
      metadata: { category, level },
    });

    res.status(201).json({ success: true, subject });
  } catch (error) {
    console.error("Error creating subject:", error);
    res.status(500).json({ success: false, message: "Failed to create subject" });
  }
};

export const updateSubject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, category, level, imageUrl, isActive, sortOrder, metadata } = req.body;

    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        category,
        level,
        imageUrl,
        isActive,
        sortOrder,
        metadata,
        updatedBy: req.user?._id,
      },
      { new: true, runValidators: true }
    );

    if (!subject) {
      res.status(404).json({ success: false, message: "Subject not found" });
      return;
    }

    await logAudit({
      action: "subject_updated",
      actor: req.user?.name,
      actorId: req.user?._id?.toString(),
      entity: "Subject",
      targetId: subject._id.toString(),
      targetName: subject.name,
      metadata: { changes: { name, category, level } },
    });

    res.json({ success: true, subject });
  } catch (error) {
    console.error("Error updating subject:", error);
    res.status(500).json({ success: false, message: "Failed to update subject" });
  }
};

export const deleteSubject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) {
      res.status(404).json({ success: false, message: "Subject not found" });
      return;
    }

    await logAudit({
      action: "subject_deleted",
      actor: req.user?.name,
      actorId: req.user?._id?.toString(),
      entity: "Subject",
      targetId: subject._id.toString(),
      targetName: subject.name,
    });

    res.json({ success: true, message: "Subject deleted successfully" });
  } catch (error) {
    console.error("Error deleting subject:", error);
    res.status(500).json({ success: false, message: "Failed to delete subject" });
  }
};

export const getSubjectCategories = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const categories = await Subject.distinct("category").sort();
    res.json({ success: true, categories });
  } catch (error) {
    console.error("Error getting categories:", error);
    res.status(500).json({ success: false, message: "Failed to get categories" });
  }
};

// The tutor-facing subject list used across signup, browse and matching lives
// as a static array (lib/location.ts's MASTER_SUBJECTS on the frontend) that
// was never migrated into this admin-managed Subject collection, so the
// Curriculum admin page shows "No subjects found" even though the platform
// has an active subject catalog. This seeds that catalog from the same list
// (upserting by slug so it's safe to run more than once).
const DEFAULT_SUBJECTS: { name: string; category: string }[] = [
  { name: "Mathematics", category: "STEM" },
  { name: "Physics", category: "STEM" },
  { name: "Chemistry", category: "STEM" },
  { name: "Biology", category: "STEM" },
  { name: "English", category: "Languages" },
  { name: "Computer Science", category: "STEM" },
  { name: "Economics", category: "Business & Economics" },
  { name: "Accounting", category: "Business & Economics" },
  { name: "Business Studies", category: "Business & Economics" },
  { name: "Urdu", category: "Languages" },
  { name: "Islamiyat", category: "Religious Studies" },
  { name: "Pakistan Studies", category: "Social Studies" },
  { name: "Statistics", category: "STEM" },
  { name: "Sociology", category: "Social Studies" },
  { name: "Psychology", category: "Social Studies" },
  { name: "History", category: "Social Studies" },
  { name: "Geography", category: "Social Studies" },
  { name: "MDCAT", category: "Test Preparation" },
  { name: "ECAT", category: "Test Preparation" },
  { name: "SAT", category: "Test Preparation" },
  { name: "IELTS", category: "Test Preparation" },
  { name: "Quran & Arabic", category: "Religious Studies" },
  { name: "General Science", category: "STEM" },
];

export const seedDefaultSubjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let created = 0;
    let skipped = 0;
    for (let i = 0; i < DEFAULT_SUBJECTS.length; i++) {
      const { name, category } = DEFAULT_SUBJECTS[i];
      const slug = generateSlug(name);
      const existing = await Subject.findOne({ slug });
      if (existing) {
        skipped++;
        continue;
      }
      await Subject.create({
        name,
        slug,
        category,
        level: [],
        sortOrder: i,
        createdBy: req.user?._id,
      });
      created++;
    }

    await logAudit({
      action: "subjects_seeded",
      actor: req.user?.name,
      actorId: req.user?._id?.toString(),
      entity: "Subject",
      targetId: "bulk",
      targetName: `${created} created, ${skipped} already existed`,
    });

    res.json({ success: true, created, skipped });
  } catch (error) {
    console.error("Error seeding default subjects:", error);
    res.status(500).json({ success: false, message: "Failed to seed default subjects" });
  }
};
