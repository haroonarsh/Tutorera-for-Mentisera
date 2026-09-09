// backend/src/routes/location.routes.ts
// Extended global location API — backed by location.service.ts
// Endpoints:
//   GET /api/locations/countries          — list all active countries (with DB overrides)
//   GET /api/locations/countries/:code    — full country detail + cities
//   GET /api/locations/cities/:code       — cities for a country (with optional ?q= search)
//   GET /api/locations/search?q=          — global fuzzy search across countries & cities
//   GET /api/locations/exchange-rates     — latest exchange rates snapshot

import { Router, Request, Response, NextFunction } from "express";
import { listCountries, getCountryDetail, searchCities, globalSearch } from "../services/location.service";
import { getLatestRates } from "../services/exchangeRate.service";

const router = Router();
const wrap = (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next);

// GET /api/locations/countries
router.get(
  "/countries",
  wrap(async (req, res) => {
    const activeOnly = req.query.all !== "1";
    const countries = await listCountries(activeOnly);
    res.json({ success: true, data: countries, total: countries.length });
  })
);

// GET /api/locations/countries/:code
router.get(
  "/countries/:code",
  wrap(async (req, res) => {
    const country = await getCountryDetail(req.params.code as string);
    if (!country) {
      res.status(404).json({ success: false, message: "Country not found" });
      return;
    }
    res.json({ success: true, data: country });
  })
);

// GET /api/locations/cities/:code?q=searchQuery
router.get(
  "/cities/:code",
  wrap(async (req, res) => {
    const cities = searchCities(req.params.code as string, req.query.q as string | undefined);
    res.json({ success: true, data: cities, total: cities.length });
  })
);

// GET /api/locations/search?q=&limit=20
router.get(
  "/search",
  wrap(async (req, res) => {
    const q = (req.query.q as string) || "";
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const results = globalSearch(q, limit);
    res.json({ success: true, data: results, total: results.length });
  })
);

// GET /api/locations/exchange-rates
router.get(
  "/exchange-rates",
  wrap(async (_req, res) => {
    const rates = await getLatestRates();
    res.json({ success: true, base: "USD", data: rates, fetchedAt: new Date().toISOString() });
  })
);

export default router;
