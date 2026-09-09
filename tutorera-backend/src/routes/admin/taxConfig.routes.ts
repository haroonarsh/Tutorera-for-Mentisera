// backend/src/routes/admin/taxConfig.routes.ts
// Parent admin.routes.ts already applies protect + authorize("admin") + enforceCountryScope
import { Router, Request, Response } from "express";
import TaxConfig from "../../models/TaxConfig.model";
import { logAudit } from "../../utils/logAudit";

const router = Router();

// GET /admin/tax-config — list all tax configs
router.get("/", async (req: Request, res: Response) => {
  try {
    const configs = await TaxConfig.find().sort("countryCode").lean();
    res.json({ success: true, configs });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /admin/tax-config — create new tax config
router.post("/", async (req: Request, res: Response) => {
  try {
    const existing = await TaxConfig.findOne({ countryCode: req.body.countryCode?.toUpperCase() });
    if (existing) {
      res.status(409).json({ success: false, message: "Tax config already exists for this country." });
      return;
    }
    const config = await TaxConfig.create({
      ...req.body,
      countryCode: req.body.countryCode?.toUpperCase(),
      updatedBy: (req as any).user?._id,
    });
    await logAudit({
      action: "tax_config_created",
      actor: (req as any).user?.name,
      actorId: (req as any).user?._id?.toString(),
      entity: "TaxConfig",
      targetId: config.id,
      metadata: { countryCode: config.countryCode, rate: config.rate },
    });
    res.status(201).json({ success: true, config });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /admin/tax-config/:id — update tax config
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { _id, __v, createdAt, updatedAt, ...update } = req.body;
    update.updatedBy = (req as any).user?._id;
    const config = await TaxConfig.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!config) {
      res.status(404).json({ success: false, message: "Tax config not found." });
      return;
    }
    await logAudit({
      action: "tax_config_updated",
      actor: (req as any).user?.name,
      actorId: (req as any).user?._id?.toString(),
      entity: "TaxConfig",
      targetId: config.id,
      metadata: { countryCode: config.countryCode, rate: config.rate, taxType: config.taxType },
    });
    res.json({ success: true, config });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
