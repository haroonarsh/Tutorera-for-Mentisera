import { Response } from "express";
import { AuthRequest } from "../types";
import SubjectCategory, { AcademicRecordStatus } from "../models/SubjectCategory.model";
import AcademicDiscipline from "../models/AcademicDiscipline.model";
import Subject from "../models/Subject.model";
import TeachingEligibilityRule from "../models/TeachingEligibilityRule.model";
import AcademicImportJob, { AcademicImportDataset } from "../models/AcademicImportJob.model";
import { logAudit } from "../utils/logAudit";

const DATASETS: AcademicImportDataset[] = ["categories", "subjects", "disciplines", "eligibility-rules"];
const STATUSES: AcademicRecordStatus[] = ["active", "inactive", "archived"];
type Row = Record<string, string>;
type RowError = { row: number; field?: string; message: string };
const slugify = (v: string) => v.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
const codeify = (v: string) => v.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "");
const isDataset = (value: string): value is AcademicImportDataset => DATASETS.includes(value as AcademicImportDataset);

// RFC4180-compatible enough for the templates we publish: quoted fields,
// escaped quotes, CRLF/LF and blank lines. External IDs are never accepted.
function parseCsv(input: string): Row[] {
  const rows: string[][] = []; let row: string[] = []; let cell = ""; let quote = false;
  for (let i = 0; i < input.length; i += 1) { const char = input[i]; const next = input[i + 1];
    if (char === '"' && quote && next === '"') { cell += '"'; i += 1; }
    else if (char === '"') quote = !quote;
    else if (char === "," && !quote) { row.push(cell.trim()); cell = ""; }
    else if ((char === "\n" || char === "\r") && !quote) { if (char === "\r" && next === "\n") i += 1; row.push(cell.trim()); if (row.some(Boolean)) rows.push(row); row = []; cell = ""; }
    else cell += char;
  }
  row.push(cell.trim()); if (row.some(Boolean)) rows.push(row);
  if (!rows.length) return [];
  const [headers, ...values] = rows; return values.map((value) => Object.fromEntries(headers.map((header, index) => [header.trim(), value[index] || ""])));
}
function csv(value: unknown): string { const text = String(value ?? ""); return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text; }
function readUpload(req: AuthRequest): string | undefined { const file = req.file; return file?.buffer?.toString("utf8").replace(/^\uFEFF/, ""); }
function status(value: string, errors: RowError[], row: number): AcademicRecordStatus | undefined { const candidate = (value || "active").toLowerCase() as AcademicRecordStatus; if (!STATUSES.includes(candidate)) { errors.push({ row, field: "status", message: "Status must be active, inactive, or archived" }); return undefined; } return candidate; }
function bool(value: string, errors: RowError[], row: number): boolean | undefined { if (["true", "1", "yes"].includes(value.toLowerCase())) return true; if (["false", "0", "no", ""].includes(value.toLowerCase())) return false; errors.push({ row, field: "evidence_required", message: "Use true or false" }); return undefined; }

const templates: Record<AcademicImportDataset, string> = {
  categories: "category_code,category_name,description,status,display_order\nCAT-STEM,STEM,Science Technology Engineering and Mathematics,active,10\n",
  subjects: "subject_code,subject_name,category_code,description,status,display_order\nSUB-MATH,Mathematics,CAT-STEM,Mathematics tuition,active,10\n",
  disciplines: "discipline_code,discipline_name,description,status\nDISC-MATH,Mathematics,Mathematics academic discipline,active\n",
  "eligibility-rules": "discipline_code,subject_code,eligibility_type,evidence_required,minimum_degree_level,notes,status\nDISC-MATH,SUB-MATH,direct,false,Bachelors,Direct qualification match,active\n",
};

async function validate(dataset: AcademicImportDataset, rows: Row[]): Promise<{ errors: RowError[]; normalized: Row[] }> {
  const errors: RowError[] = []; const normalized: Row[] = []; const seen = new Set<string>();
  for (const [index, source] of rows.entries()) { const rowNo = index + 2; const row = Object.fromEntries(Object.entries(source).map(([key, value]) => [key.trim(), value.trim()]));
    let key = "";
    if (dataset === "categories") { row.category_code = codeify(row.category_code); key = row.category_code; if (!key || !row.category_name) errors.push({ row: rowNo, message: "category_code and category_name are required" }); if (row.display_order && !Number.isFinite(Number(row.display_order))) errors.push({ row: rowNo, field: "display_order", message: "display_order must be numeric" }); }
    if (dataset === "subjects") { row.subject_code = codeify(row.subject_code); row.category_code = codeify(row.category_code); key = row.subject_code; if (!key || !row.subject_name || !row.category_code) errors.push({ row: rowNo, message: "subject_code, subject_name, and category_code are required" }); if (row.category_code && !await SubjectCategory.exists({ code: row.category_code })) errors.push({ row: rowNo, field: "category_code", message: `Unknown category code ${row.category_code}` }); if (row.display_order && !Number.isFinite(Number(row.display_order))) errors.push({ row: rowNo, field: "display_order", message: "display_order must be numeric" }); }
    if (dataset === "disciplines") { row.discipline_code = codeify(row.discipline_code); key = row.discipline_code; if (!key || !row.discipline_name) errors.push({ row: rowNo, message: "discipline_code and discipline_name are required" }); }
    if (dataset === "eligibility-rules") { row.discipline_code = codeify(row.discipline_code); row.subject_code = codeify(row.subject_code); row.eligibility_type = row.eligibility_type.toLowerCase(); key = `${row.discipline_code}:${row.subject_code}`; if (!row.discipline_code || !row.subject_code || !["direct", "conditional"].includes(row.eligibility_type)) errors.push({ row: rowNo, message: "discipline_code, subject_code, and direct or conditional eligibility_type are required" }); const value = bool(row.evidence_required, errors, rowNo); if (value !== undefined) row.evidence_required = String(value); const [discipline, subject] = await Promise.all([AcademicDiscipline.exists({ code: row.discipline_code }), Subject.exists({ code: row.subject_code })]); if (!discipline) errors.push({ row: rowNo, field: "discipline_code", message: `Unknown discipline code ${row.discipline_code}` }); if (!subject) errors.push({ row: rowNo, field: "subject_code", message: `Unknown subject code ${row.subject_code}` }); }
    if (!status(row.status, errors, rowNo) || (key && seen.has(key))) { if (key && seen.has(key)) errors.push({ row: rowNo, message: "Duplicate code or rule in this file" }); continue; }
    seen.add(key); normalized.push(row);
  }
  return { errors, normalized };
}

async function commit(dataset: AcademicImportDataset, rows: Row[], actorId?: any): Promise<{ created: number; updated: number }> {
  let created = 0; let updated = 0;
  for (const row of rows) { const recordStatus = (row.status || "active") as AcademicRecordStatus; const common = { status: recordStatus, archivedAt: recordStatus === "archived" ? new Date() : undefined, updatedBy: actorId };
    if (dataset === "categories") { const existing = await SubjectCategory.findOne({ code: row.category_code }); const payload = { ...common, name: row.category_name, slug: slugify(row.category_name), description: row.description || "", displayOrder: Number(row.display_order) || 0 }; if (existing) { Object.assign(existing, payload); await existing.save(); updated += 1; } else { await SubjectCategory.create({ ...payload, code: row.category_code, createdBy: actorId }); created += 1; } }
    if (dataset === "subjects") { const category = await SubjectCategory.findOne({ code: row.category_code }); if (!category) throw new Error(`Category ${row.category_code} disappeared during import`); const existing = await Subject.findOne({ code: row.subject_code }); const payload = { ...common, name: row.subject_name, slug: slugify(row.subject_name), category: category.name, categoryRef: category._id, description: row.description || "", displayOrder: Number(row.display_order) || 0, sortOrder: Number(row.display_order) || 0, isActive: recordStatus === "active" }; if (existing) { Object.assign(existing, payload); await existing.save(); updated += 1; } else { await Subject.create({ ...payload, code: row.subject_code, level: [], createdBy: actorId }); created += 1; } }
    if (dataset === "disciplines") { const existing = await AcademicDiscipline.findOne({ code: row.discipline_code }); const payload = { ...common, name: row.discipline_name, slug: slugify(row.discipline_name), description: row.description || "" }; if (existing) { Object.assign(existing, payload); await existing.save(); updated += 1; } else { await AcademicDiscipline.create({ ...payload, code: row.discipline_code, createdBy: actorId }); created += 1; } }
    if (dataset === "eligibility-rules") { const [discipline, subject] = await Promise.all([AcademicDiscipline.findOne({ code: row.discipline_code }), Subject.findOne({ code: row.subject_code })]); if (!discipline || !subject) throw new Error("Referenced record disappeared during import"); const existing = await TeachingEligibilityRule.findOne({ discipline: discipline._id, subject: subject._id }); const payload = { ...common, eligibilityType: row.eligibility_type as "direct" | "conditional", evidenceRequired: row.eligibility_type === "conditional" || row.evidence_required === "true", minimumDegreeLevel: row.minimum_degree_level || undefined, notes: row.notes || "" }; if (existing) { Object.assign(existing, payload); await existing.save(); updated += 1; } else { await TeachingEligibilityRule.create({ ...payload, discipline: discipline._id, subject: subject._id, createdBy: actorId }); created += 1; } }
  }
  return { created, updated };
}

export const downloadAcademicTemplate = async (req: AuthRequest, res: Response): Promise<void> => { const dataset = String(req.params.dataset); if (!isDataset(dataset)) { res.status(404).json({ success: false, message: "Unknown academic dataset" }); return; } res.type("text/csv").attachment(`${dataset}.csv`).send(templates[dataset]); };
export const previewAcademicImport = async (req: AuthRequest, res: Response): Promise<void> => { const dataset = String(req.params.dataset); const source = readUpload(req); if (!isDataset(dataset) || !source) { res.status(400).json({ success: false, message: "A supported dataset and CSV file are required" }); return; } const rows = parseCsv(source); const result = await validate(dataset, rows); const job = await AcademicImportJob.create({ dataset, status: result.errors.length ? "failed" : "dry_run", filename: req.file?.originalname, totalRows: rows.length, validRows: result.normalized.length, validationErrors: result.errors.slice(0, 100), createdBy: req.user?._id }); res.json({ success: true, dryRun: true, jobId: job._id, totalRows: rows.length, validRows: result.normalized.length, errors: result.errors.slice(0, 100), preview: result.normalized.slice(0, 25) }); };
export const commitAcademicImport = async (req: AuthRequest, res: Response): Promise<void> => { const dataset = String(req.params.dataset); const source = readUpload(req); if (!isDataset(dataset) || !source) { res.status(400).json({ success: false, message: "A supported dataset and CSV file are required" }); return; } const rows = parseCsv(source); const result = await validate(dataset, rows); if (result.errors.length) { res.status(422).json({ success: false, message: "Import has validation errors. Correct the file and retry.", errors: result.errors.slice(0, 100) }); return; } try { const counts = await commit(dataset, result.normalized, req.user?._id); const job = await AcademicImportJob.create({ dataset, status: "committed", filename: req.file?.originalname, totalRows: rows.length, validRows: result.normalized.length, createdCount: counts.created, updatedCount: counts.updated, validationErrors: [], createdBy: req.user?._id, committedAt: new Date() }); await logAudit({ action: "academic_import_committed", actor: req.user?.name, actorId: req.user?._id?.toString(), entity: "AcademicImportJob", targetId: job._id.toString(), targetName: dataset, metadata: counts }); res.json({ success: true, job, ...counts }); } catch (error) { console.error("Academic import failed", error); res.status(500).json({ success: false, message: "Import failed. No retry should be attempted until the error is reviewed." }); } };
export const listAcademicImportHistory = async (req: AuthRequest, res: Response): Promise<void> => { const filter: Record<string, unknown> = {}; if (isDataset(String(req.query.dataset || ""))) filter.dataset = req.query.dataset; const jobs = await AcademicImportJob.find(filter).sort({ createdAt: -1 }).limit(100).populate("createdBy", "name email").lean(); res.json({ success: true, jobs }); };
export const exportAcademicDataset = async (req: AuthRequest, res: Response): Promise<void> => { const dataset = String(req.params.dataset); if (!isDataset(dataset)) { res.status(404).json({ success: false, message: "Unknown academic dataset" }); return; } let lines: string[] = []; if (dataset === "categories") { const records = await SubjectCategory.find().sort({ code: 1 }).lean(); lines = ["category_code,category_name,description,status,display_order", ...records.map((r) => [r.code, r.name, r.description, r.status, r.displayOrder].map(csv).join(","))]; } if (dataset === "subjects") { const records = await Subject.find().populate("categoryRef", "code").sort({ code: 1 }).lean(); lines = ["subject_code,subject_name,category_code,description,status,display_order", ...records.map((r: any) => [r.code || "", r.name, r.categoryRef?.code || "", r.description, r.status || (r.isActive ? "active" : "inactive"), r.displayOrder || r.sortOrder].map(csv).join(","))]; } if (dataset === "disciplines") { const records = await AcademicDiscipline.find().sort({ code: 1 }).lean(); lines = ["discipline_code,discipline_name,description,status", ...records.map((r) => [r.code, r.name, r.description, r.status].map(csv).join(","))]; } if (dataset === "eligibility-rules") { const records = await TeachingEligibilityRule.find().populate("discipline", "code").populate("subject", "code").sort({ createdAt: 1 }).lean(); lines = ["discipline_code,subject_code,eligibility_type,evidence_required,minimum_degree_level,notes,status", ...records.map((r: any) => [r.discipline?.code || "", r.subject?.code || "", r.eligibilityType, r.evidenceRequired, r.minimumDegreeLevel || "", r.notes || "", r.status].map(csv).join(","))]; } res.type("text/csv").attachment(`${dataset}-export.csv`).send(lines.join("\n")); };
