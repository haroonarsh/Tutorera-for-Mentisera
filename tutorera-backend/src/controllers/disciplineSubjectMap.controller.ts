import { Response } from "express";
import { AuthRequest } from "../types";
import DisciplineSubjectMap from "../models/DisciplineSubjectMap.model";
import { logAudit } from "../utils/logAudit";

// Admin CRUD for the discipline -> eligible subjects/levels mapping used to
// hint at (never auto-grant) subject eligibility during onboarding and
// admin review. See models/DisciplineSubjectMap.model.ts for the full
// design rationale.

export const listDisciplineSubjectMaps = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { isActive } = req.query;
    const filter: Record<string, unknown> = {};
    if (typeof isActive !== "undefined") filter.isActive = isActive === "true";
    const maps = await DisciplineSubjectMap.find(filter).sort({ discipline: 1 }).lean();
    res.json({ success: true, maps });
  } catch (error) {
    console.error("Error listing discipline-subject maps:", error);
    res.status(500).json({ success: false, message: "Failed to list discipline-subject maps" });
  }
};

export const createDisciplineSubjectMap = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { discipline, eligibleSubjects, eligibleLevels, notes } = req.body;
    if (!discipline || typeof discipline !== "string") {
      res.status(400).json({ success: false, message: "Discipline is required." });
      return;
    }
    const existing = await DisciplineSubjectMap.findOne({ discipline: new RegExp(`^${discipline.trim()}$`, "i") });
    if (existing) {
      res.status(400).json({ success: false, message: "A mapping for this discipline already exists." });
      return;
    }
    const map = await DisciplineSubjectMap.create({
      discipline: discipline.trim(),
      eligibleSubjects: Array.isArray(eligibleSubjects) ? eligibleSubjects : [],
      eligibleLevels: Array.isArray(eligibleLevels) ? eligibleLevels : [],
      notes: notes || "",
      createdBy: req.user?._id,
      updatedBy: req.user?._id,
    });
    await logAudit({
      action: "discipline_subject_map_created",
      actor: req.user?.name,
      actorId: req.user?._id?.toString(),
      entity: "DisciplineSubjectMap",
      targetId: map._id.toString(),
      targetName: map.discipline,
      metadata: { eligibleSubjects, eligibleLevels },
    });
    res.status(201).json({ success: true, map });
  } catch (error) {
    console.error("Error creating discipline-subject map:", error);
    res.status(500).json({ success: false, message: "Failed to create discipline-subject map" });
  }
};

export const updateDisciplineSubjectMap = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { eligibleSubjects, eligibleLevels, isActive, notes } = req.body;
    const map = await DisciplineSubjectMap.findByIdAndUpdate(
      req.params.id,
      { eligibleSubjects, eligibleLevels, isActive, notes, updatedBy: req.user?._id },
      { new: true, runValidators: true }
    );
    if (!map) {
      res.status(404).json({ success: false, message: "Discipline-subject map not found" });
      return;
    }
    await logAudit({
      action: "discipline_subject_map_updated",
      actor: req.user?.name,
      actorId: req.user?._id?.toString(),
      entity: "DisciplineSubjectMap",
      targetId: map._id.toString(),
      targetName: map.discipline,
      metadata: { eligibleSubjects, eligibleLevels, isActive },
    });
    res.json({ success: true, map });
  } catch (error) {
    console.error("Error updating discipline-subject map:", error);
    res.status(500).json({ success: false, message: "Failed to update discipline-subject map" });
  }
};

export const deleteDisciplineSubjectMap = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const map = await DisciplineSubjectMap.findByIdAndDelete(req.params.id);
    if (!map) {
      res.status(404).json({ success: false, message: "Discipline-subject map not found" });
      return;
    }
    await logAudit({
      action: "discipline_subject_map_deleted",
      actor: req.user?.name,
      actorId: req.user?._id?.toString(),
      entity: "DisciplineSubjectMap",
      targetId: map._id.toString(),
      targetName: map.discipline,
    });
    res.json({ success: true, message: "Discipline-subject map deleted successfully" });
  } catch (error) {
    console.error("Error deleting discipline-subject map:", error);
    res.status(500).json({ success: false, message: "Failed to delete discipline-subject map" });
  }
};

// Public (authenticated) read used by the tutor onboarding form to populate
// the discipline dropdown and preview which subjects a discipline unlocks.
export const listActiveDisciplineSubjectMaps = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const maps = await DisciplineSubjectMap.find({ isActive: true }).sort({ discipline: 1 }).select("discipline eligibleSubjects eligibleLevels").lean();
    res.json({ success: true, maps });
  } catch (error) {
    console.error("Error listing active discipline-subject maps:", error);
    res.status(500).json({ success: false, message: "Failed to list discipline-subject maps" });
  }
};
