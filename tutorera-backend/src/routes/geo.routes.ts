// src/routes/geo.routes.ts
import { Router } from "express";
import { getCities, getCountries, getCountryCities, getCurrencies, getGlobalSearch, getLocalities, getRegions, postalLookup } from "../controllers/geo.controller";
import { cachePublic } from "../middlewares/cacheControl.middleware";

const router = Router();

// Reference/geo data changes rarely (market launches, GeoNames imports) -
// cache more aggressively than content endpoints. /search and
// /postal-lookup are excluded: they're per-query lookups with a low cache
// hit rate, not content a crawler or repeated SSR fetch would reuse.
router.get("/countries", cachePublic(600), getCountries);
router.get("/regions", cachePublic(300), getRegions);
router.get("/cities", cachePublic(300), getCities);
router.get("/localities", cachePublic(300), getLocalities);
router.get("/search", getGlobalSearch);
router.get("/countries/:code/cities", cachePublic(300), getCountryCities);
router.get("/currencies", cachePublic(600), getCurrencies);
router.get("/postal-lookup", postalLookup);

export default router;
