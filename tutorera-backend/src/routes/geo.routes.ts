// src/routes/geo.routes.ts
import { Router } from "express";
import { getCities, getCountries, getCountryCities, getCurrencies, getGlobalSearch, getLocalities, getRegions, postalLookup } from "../controllers/geo.controller";

const router = Router();

router.get("/countries", getCountries);
router.get("/regions", getRegions);
router.get("/cities", getCities);
router.get("/localities", getLocalities);
router.get("/search", getGlobalSearch);
router.get("/countries/:code/cities", getCountryCities);
router.get("/currencies", getCurrencies);
router.get("/postal-lookup", postalLookup);

export default router;
