// backend/src/routes/admin/exchangeRate.routes.ts
// Parent admin.routes.ts already applies protect + authorize("admin") + enforceCountryScope
import { Router, Request, Response } from "express";
import { refreshRates } from "../../services/exchangeRate.service";
import ExchangeRate from "../../models/ExchangeRate.model";
import { logAudit } from "../../utils/logAudit";

const router = Router();

// GET /admin/exchange-rates — list all cached exchange rates
router.get("/", async (req: Request, res: Response) => {
  try {
    const doc = await ExchangeRate.findOne().sort("-fetchedAt").lean();
    if (!doc || !doc.rates) {
      res.json({ success: true, rates: {}, count: 0, lastRefresh: null });
      return;
    }
    const ratesObj: Record<string, { rateToUSD: number; source: string; updatedAt: string }> = {};
    const ratesMap = doc.rates instanceof Map ? Object.fromEntries(doc.rates) : (doc.rates as Record<string, number>);
    for (const [currency, rate] of Object.entries(ratesMap)) {
      ratesObj[currency] = {
        rateToUSD: rate as number,
        source: doc.source || "api",
        updatedAt: doc.updatedAt?.toISOString?.() || doc.fetchedAt?.toISOString?.() || "",
      };
    }
    res.json({ success: true, rates: ratesObj, count: Object.keys(ratesObj).length, lastRefresh: doc.fetchedAt?.toISOString() || null });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /admin/exchange-rates/refresh — force-refresh from upstream
router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const newRates = await refreshRates();
    await logAudit({
      action: "exchange_rates_refreshed",
      actor: (req as any).user?.name,
      actorId: (req as any).user?._id?.toString(),
      entity: "ExchangeRate",
      metadata: { currencyCount: Object.keys(newRates).length },
    });
    res.json({ success: true, message: "Exchange rates refreshed.", count: Object.keys(newRates).length });
  } catch (err: any) {
    res.status(502).json({ success: false, message: "Failed to refresh rates: " + err.message });
  }
});

export default router;
