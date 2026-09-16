import { Response } from "express";
import { AuthRequest } from "../types";
import FeatureFlag from "../models/FeatureFlag.model";
import { isFeatureEnabled } from "../services/featureFlag.service";
import { logAudit } from "../utils/logAudit";

export const getPublicFlag = async (req: AuthRequest, res: Response): Promise<void> => {
  const key = String(req.params.key || "");
  if (!/^[A-Z0-9_]{3,100}$/i.test(key)) { res.status(400).json({ success: false, message: "Invalid feature flag key." }); return; }
  const countryCode = String(req.query.countryCode || "").toUpperCase() || undefined;
  res.json({ success: true, key: key.toUpperCase(), countryCode: countryCode || null, enabled: await isFeatureEnabled(key, countryCode) });
};

export const listFeatureFlags = async (_req: AuthRequest, res: Response): Promise<void> => {
  res.json({ success: true, flags: await FeatureFlag.find().sort("key").lean() });
};

export const upsertFeatureFlag = async (req: AuthRequest, res: Response): Promise<void> => {
  const key = String(req.params.key || req.body.key || "").trim().toUpperCase();
  const scope = req.body.scope === "country" ? "country" : "global";
  if (!/^[A-Z0-9_]{3,100}$/.test(key) || typeof req.body.enabled !== "boolean") { res.status(400).json({ success: false, message: "A valid key and enabled boolean are required." }); return; }
  const countryCodes = scope === "country" ? [...new Set((Array.isArray(req.body.countryCodes) ? req.body.countryCodes : []).map((value: unknown) => String(value).toUpperCase()).filter((value: string) => /^[A-Z]{2}$/.test(value)))] : [];
  if (scope === "country" && !countryCodes.length) { res.status(400).json({ success: false, message: "Country-scoped flags require at least one ISO country code." }); return; }
  const flag = await FeatureFlag.findOneAndUpdate({ key }, { $set: { enabled: req.body.enabled, scope, countryCodes, description: String(req.body.description || "").slice(0, 500), updatedBy: req.user?._id } }, { upsert: true, new: true, runValidators: true });
  await logAudit({ action: "feature_flag_updated", actor: req.user?.name, actorId: req.user?._id?.toString(), entity: "FeatureFlag", targetId: flag._id.toString(), targetName: key, metadata: { enabled: flag.enabled, scope: flag.scope, countryCodes: flag.countryCodes } });
  res.json({ success: true, flag });
};
