// src/routes/geo.routes.ts
import { Router } from "express";
import { getCountries, getCountryCities, getCurrencies } from "../controllers/geo.controller";

const router = Router();

router.get("/countries", getCountries);
router.get("/countries/:code/cities", getCountryCities);
router.get("/currencies", getCurrencies);

export default router;
