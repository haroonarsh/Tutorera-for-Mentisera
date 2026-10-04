import { Response } from "express";
import { Types } from "mongoose";
import { AuthRequest } from "../types";
import SubjectCategory, { AcademicRecordStatus } from "../models/SubjectCategory.model";
import AcademicDiscipline from "../models/AcademicDiscipline.model";
import TeachingEligibilityRule from "../models/TeachingEligibilityRule.model";
import Subject from "../models/Subject.model";
import TutorProfile from "../models/TutorProfile.model";
import { logAudit } from "../utils/logAudit";

const STATUSES: AcademicRecordStatus[] = ["active", "inactive", "archived"];
const ELIGIBILITY_TYPES = ["direct", "conditional"] as const;

const slugify = (value: string) => value.toLowerCase().trim()
  .replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
const codeify = (value: string) => value.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "");
const validId = (value: unknown): value is string => typeof value === "string" && Types.ObjectId.isValid(value);
const safeLimit = (value: unknown) => Math.min(Math.max(Number(value) || 50, 1), 100);
// Pagination helper. Audit P1: the admin list endpoints previously
// capped at safeLimit() with no skip, so a catalogue over 100 rows
// silently truncated. page is 1-indexed to match the public listings
// elsewhere in the codebase.
const safePage = (value: unknown) => Math.max(Number(value) || 1, 1);
const paginationMeta = (total: number, page: number, limit: number) => ({
  total, page, limit, pages: Math.max(1, Math.ceil(total / limit)),
});

// Audit P1: previously silently coerced any invalid value to "active",
// which let a typo (?status=achrived) look like success. Now returns
// `null` after writing a 400 so callers early-return. Returns the
// validated status when the input is one of the three enum values, or
// `undefined` when no status was supplied (caller uses the default).
const resolveStatus = (res: Response, value: unknown): AcademicRecordStatus | undefined | null => {
  if (typeof value === "undefined") return undefined;
  if (STATUSES.includes(value as AcademicRecordStatus)) return value as AcademicRecordStatus;
  res.status(400).json({ success: false, code: "INVALID_STATUS", message: `status must be one of ${STATUSES.join(", ")}` });
  return null;
};
const writeAudit = (req: AuthRequest, action: string, entity: string, target: { _id: Types.ObjectId; name?: string; code?: string }, metadata: Record<string, unknown> = {}) =>
  logAudit({ action, entity, actor: req.user?.name, actorId: req.user?._id?.toString(), targetId: target._id.toString(), targetName: target.name || target.code, metadata });

function databaseError(res: Response, error: unknown, fallback: string): void {
  console.error(fallback, error);
  const duplicate = (error as { code?: number })?.code === 11000;
  res.status(duplicate ? 409 : 500).json({ success: false, message: duplicate ? "A record with that code, name, or rule already exists" : fallback });
}

export const getAcademicFrameworkOverview = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [categories, disciplines, subjects, directRules, conditionalRules, pendingReviews] = await Promise.all([
      SubjectCategory.countDocuments({ status: "active" }), AcademicDiscipline.countDocuments({ status: "active" }),
      Subject.countDocuments({ status: "active", isActive: true }), TeachingEligibilityRule.countDocuments({ status: "active", eligibilityType: "direct" }),
      TeachingEligibilityRule.countDocuments({ status: "active", eligibilityType: "conditional" }),
      TutorProfile.countDocuments({ "subjectEligibility.status": { $in: ["pending", "needs_evidence"] } }),
    ]);
    res.json({ success: true, overview: { categories, disciplines, subjects, directRules, conditionalRules, pendingReviews } });
  } catch (error) { databaseError(res, error, "Failed to load academic framework overview"); }
};

/** A compact review queue. The individual application page remains the
 * single place where approvals/rejections are performed and audited. */
export const listTutorSubjectApprovals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const statuses = String(req.query.status || "pending") === "all"
      ? ["pending", "needs_evidence", "approved", "rejected", "suspended", "revoked"]
      : String(req.query.status || "pending").split(",");
    const profiles = await TutorProfile.find({ "subjectEligibility.status": { $in: statuses as any } })
      .select("fullName subjectEligibility user verificationStatus updatedAt")
      .populate("user", "name email").sort({ updatedAt: -1 }).limit(safeLimit(req.query.limit)).lean();
    const approvals = profiles.flatMap((profile: any) => (profile.subjectEligibility || [])
      .filter((entry: any) => statuses.includes(entry.status))
      .map((entry: any) => ({ profileId: profile._id, tutorName: profile.fullName || profile.user?.name || "Tutor", tutorEmail: profile.user?.email || "", verificationStatus: profile.verificationStatus, subject: entry.subject, levels: entry.levels || [], status: entry.status, eligibilityType: entry.eligibilityType || (entry.matchesDiscipline ? "direct" : "unmapped"), evidenceRequired: Boolean(entry.evidenceRequired), requestedAt: entry.requestedAt, reviewedAt: entry.reviewedAt, reason: entry.reason || "" })));
    res.json({ success: true, approvals });
  } catch (error) { databaseError(res, error, "Failed to list tutor subject approvals"); }
};

export const listAcademicCategories = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filter: Record<string, unknown> = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.q) filter.$or = [{ name: new RegExp(String(req.query.q), "i") }, { code: new RegExp(String(req.query.q), "i") }];
    const limit = safeLimit(req.query.limit); const page = safePage(req.query.page); const skip = (page - 1) * limit;
    const [categories, total] = await Promise.all([
      SubjectCategory.find(filter).sort({ displayOrder: 1, name: 1 }).skip(skip).limit(limit).lean(),
      SubjectCategory.countDocuments(filter),
    ]);
    res.json({ success: true, categories, pagination: paginationMeta(total, page, limit) });
  } catch (error) { databaseError(res, error, "Failed to list academic categories"); }
};

export const createAcademicCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, displayOrder } = req.body;
    const code = codeify(req.body.code || name || "");
    if (!name || !code) { res.status(400).json({ success: false, message: "A category name and code are required" }); return; }
    const status = resolveStatus(res, req.body.status); if (status === null) return;
    const category = await SubjectCategory.create({ code, name: String(name).trim(), slug: slugify(name), description: description || "", displayOrder: Number(displayOrder) || 0, status: status ?? "active", createdBy: req.user?._id, updatedBy: req.user?._id });
    await writeAudit(req, "academic_category_created", "SubjectCategory", category);
    res.status(201).json({ success: true, category });
  } catch (error) { databaseError(res, error, "Failed to create academic category"); }
};

export const updateAcademicCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const category = await SubjectCategory.findById(req.params.id);
    if (!category) { res.status(404).json({ success: false, message: "Academic category not found" }); return; }
    // Audit P1: code is a stable identifier referenced by import CSVs,
    // DisciplineSubjectMap entries, and external integrations. Allowing
    // it to be edited silently via PUT breaks every join. Rejection on
    // attempted change is louder than ignoring the field.
    if (typeof req.body.code !== "undefined" && codeify(req.body.code) !== category.code) {
      res.status(400).json({ success: false, code: "CODE_IMMUTABLE", message: "Academic category code cannot be changed after creation" });
      return;
    }
    const status = resolveStatus(res, req.body.status); if (status === null) return;
    for (const key of ["name", "description", "displayOrder"] as const) if (typeof req.body[key] !== "undefined") (category as any)[key] = key === "name" ? String(req.body[key]).trim() : req.body[key];
    if (typeof req.body.name !== "undefined") category.slug = slugify(req.body.name);
    if (status !== undefined) { category.status = status; category.archivedAt = status === "archived" ? new Date() : undefined; }
    category.updatedBy = req.user?._id; await category.save();
    await writeAudit(req, "academic_category_updated", "SubjectCategory", category, { status: category.status });
    res.json({ success: true, category });
  } catch (error) { databaseError(res, error, "Failed to update academic category"); }
};

export const listAcademicDisciplines = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filter: Record<string, unknown> = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.q) filter.$or = [{ name: new RegExp(String(req.query.q), "i") }, { code: new RegExp(String(req.query.q), "i") }];
    const limit = safeLimit(req.query.limit); const page = safePage(req.query.page); const skip = (page - 1) * limit;
    const [disciplines, total] = await Promise.all([
      AcademicDiscipline.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
      AcademicDiscipline.countDocuments(filter),
    ]);
    res.json({ success: true, disciplines, pagination: paginationMeta(total, page, limit) });
  } catch (error) { databaseError(res, error, "Failed to list academic disciplines"); }
};

export const createAcademicDiscipline = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body; const code = codeify(req.body.code || name || "");
    if (!name || !code) { res.status(400).json({ success: false, message: "A discipline name and code are required" }); return; }
    const status = resolveStatus(res, req.body.status); if (status === null) return;
    const discipline = await AcademicDiscipline.create({ code, name: String(name).trim(), slug: slugify(name), description: description || "", status: status ?? "active", createdBy: req.user?._id, updatedBy: req.user?._id });
    await writeAudit(req, "academic_discipline_created", "AcademicDiscipline", discipline);
    res.status(201).json({ success: true, discipline });
  } catch (error) { databaseError(res, error, "Failed to create academic discipline"); }
};

export const updateAcademicDiscipline = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const discipline = await AcademicDiscipline.findById(req.params.id);
    if (!discipline) { res.status(404).json({ success: false, message: "Academic discipline not found" }); return; }
    if (typeof req.body.code !== "undefined" && codeify(req.body.code) !== discipline.code) {
      res.status(400).json({ success: false, code: "CODE_IMMUTABLE", message: "Academic discipline code cannot be changed after creation" });
      return;
    }
    const status = resolveStatus(res, req.body.status); if (status === null) return;
    for (const key of ["name", "description"] as const) if (typeof req.body[key] !== "undefined") (discipline as any)[key] = String(req.body[key]).trim();
    if (typeof req.body.name !== "undefined") discipline.slug = slugify(req.body.name);
    if (status !== undefined) { discipline.status = status; discipline.archivedAt = status === "archived" ? new Date() : undefined; }
    discipline.updatedBy = req.user?._id; await discipline.save();
    await writeAudit(req, "academic_discipline_updated", "AcademicDiscipline", discipline, { status: discipline.status });
    res.json({ success: true, discipline });
  } catch (error) { databaseError(res, error, "Failed to update academic discipline"); }
};

export const listAcademicSubjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filter: Record<string, unknown> = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.categoryId && validId(req.query.categoryId)) filter.categoryRef = req.query.categoryId;
    if (req.query.q) filter.$or = [{ name: new RegExp(String(req.query.q), "i") }, { code: new RegExp(String(req.query.q), "i") }];
    const limit = safeLimit(req.query.limit); const page = safePage(req.query.page); const skip = (page - 1) * limit;
    const [subjects, total] = await Promise.all([
      Subject.find(filter).populate("categoryRef", "code name slug status").sort({ displayOrder: 1, sortOrder: 1, name: 1 }).skip(skip).limit(limit).lean(),
      Subject.countDocuments(filter),
    ]);
    res.json({ success: true, subjects, pagination: paginationMeta(total, page, limit) });
  } catch (error) { databaseError(res, error, "Failed to list academic subjects"); }
};

export const createAcademicSubject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, categoryId, description, level, displayOrder, imageUrl, metadata } = req.body; const code = codeify(req.body.code || name || "");
    if (!name || !code || !validId(categoryId)) { res.status(400).json({ success: false, message: "A subject name, code, and valid category are required" }); return; }
    const status = resolveStatus(res, req.body.status); if (status === null) return;
    const category = await SubjectCategory.findOne({ _id: categoryId, status: "active" });
    if (!category) { res.status(400).json({ success: false, message: "The selected category is not active" }); return; }
    const effectiveStatus = status ?? "active";
    const subject = await Subject.create({ code, name: String(name).trim(), slug: slugify(name), category: category.name, categoryRef: category._id, description: description || "", level: Array.isArray(level) ? level : [], imageUrl, metadata, displayOrder: Number(displayOrder) || 0, sortOrder: Number(displayOrder) || 0, status: effectiveStatus, isActive: effectiveStatus === "active", createdBy: req.user?._id, updatedBy: req.user?._id });
    await writeAudit(req, "academic_subject_created", "Subject", subject, { category: category.code });
    res.status(201).json({ success: true, subject });
  } catch (error) { databaseError(res, error, "Failed to create academic subject"); }
};

export const updateAcademicSubject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) { res.status(404).json({ success: false, message: "Academic subject not found" }); return; }
    if (req.body.categoryId !== undefined) {
      if (!validId(req.body.categoryId)) { res.status(400).json({ success: false, message: "A valid category is required" }); return; }
      const category = await SubjectCategory.findOne({ _id: req.body.categoryId, status: "active" });
      if (!category) { res.status(400).json({ success: false, message: "The selected category is not active" }); return; }
      subject.categoryRef = category._id; subject.category = category.name;
    }
    if (typeof req.body.code !== "undefined" && codeify(req.body.code) !== subject.code) {
      res.status(400).json({ success: false, code: "CODE_IMMUTABLE", message: "Academic subject code cannot be changed after creation" });
      return;
    }
    const status = resolveStatus(res, req.body.status); if (status === null) return;
    for (const key of ["name", "description", "level", "imageUrl", "metadata", "displayOrder"] as const) if (typeof req.body[key] !== "undefined") (subject as any)[key] = req.body[key];
    if (typeof req.body.name !== "undefined") subject.slug = slugify(req.body.name);
    if (status !== undefined) { subject.status = status; subject.isActive = status === "active"; subject.archivedAt = status === "archived" ? new Date() : undefined; }
    subject.updatedBy = req.user?._id; await subject.save();
    await writeAudit(req, "academic_subject_updated", "Subject", subject, { status: subject.status });
    res.json({ success: true, subject });
  } catch (error) { databaseError(res, error, "Failed to update academic subject"); }
};

export const listTeachingEligibilityRules = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filter: Record<string, unknown> = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.disciplineId && validId(req.query.disciplineId)) filter.discipline = req.query.disciplineId;
    if (req.query.subjectId && validId(req.query.subjectId)) filter.subject = req.query.subjectId;
    const limit = safeLimit(req.query.limit); const page = safePage(req.query.page); const skip = (page - 1) * limit;
    const [rules, total] = await Promise.all([
      TeachingEligibilityRule.find(filter).populate("discipline", "code name status").populate("subject", "code name status").sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
      TeachingEligibilityRule.countDocuments(filter),
    ]);
    res.json({ success: true, rules, pagination: paginationMeta(total, page, limit) });
  } catch (error) { databaseError(res, error, "Failed to list teaching eligibility rules"); }
};

export const createTeachingEligibilityRule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { disciplineId, subjectId, minimumDegreeLevel, notes } = req.body; const eligibilityType = req.body.eligibilityType;
    if (!validId(disciplineId) || !validId(subjectId) || !ELIGIBILITY_TYPES.includes(eligibilityType)) { res.status(400).json({ success: false, message: "Valid discipline, subject, and eligibility type are required" }); return; }
    const status = resolveStatus(res, req.body.status); if (status === null) return;
    const [discipline, subject] = await Promise.all([AcademicDiscipline.findOne({ _id: disciplineId, status: "active" }), Subject.findOne({ _id: subjectId, status: "active", isActive: true })]);
    if (!discipline || !subject) { res.status(400).json({ success: false, message: "Both the discipline and subject must be active" }); return; }
    const rule = await TeachingEligibilityRule.create({ discipline: discipline._id, subject: subject._id, eligibilityType, evidenceRequired: eligibilityType === "conditional" || Boolean(req.body.evidenceRequired), minimumDegreeLevel, notes: notes || "", status: status ?? "active", createdBy: req.user?._id, updatedBy: req.user?._id });
    await writeAudit(req, "teaching_eligibility_rule_created", "TeachingEligibilityRule", rule, { discipline: discipline.code, subject: subject.code, eligibilityType });
    res.status(201).json({ success: true, rule });
  } catch (error) { databaseError(res, error, "Failed to create teaching eligibility rule"); }
};

export const updateTeachingEligibilityRule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rule = await TeachingEligibilityRule.findById(req.params.id);
    if (!rule) { res.status(404).json({ success: false, message: "Teaching eligibility rule not found" }); return; }
    if (req.body.eligibilityType !== undefined) {
      if (!ELIGIBILITY_TYPES.includes(req.body.eligibilityType)) { res.status(400).json({ success: false, message: "Invalid eligibility type" }); return; }
      rule.eligibilityType = req.body.eligibilityType;
    }
    const status = resolveStatus(res, req.body.status); if (status === null) return;
    for (const key of ["minimumDegreeLevel", "notes"] as const) if (typeof req.body[key] !== "undefined") (rule as any)[key] = req.body[key];
    if (status !== undefined) { rule.status = status; rule.archivedAt = status === "archived" ? new Date() : undefined; }
    rule.evidenceRequired = rule.eligibilityType === "conditional" || Boolean(req.body.evidenceRequired ?? rule.evidenceRequired);
    rule.updatedBy = req.user?._id; await rule.save();
    await writeAudit(req, "teaching_eligibility_rule_updated", "TeachingEligibilityRule", rule, { status: rule.status, eligibilityType: rule.eligibilityType });
    res.json({ success: true, rule });
  } catch (error) { databaseError(res, error, "Failed to update teaching eligibility rule"); }
};
