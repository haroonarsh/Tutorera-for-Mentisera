// src/controllers/geo.controller.ts
import { Request, Response } from "express";
import { COUNTRIES, SUPPORTED_CURRENCIES, getCountryByCode, getCitiesForCountry } from "../config/countries";

// @desc    Get all supported countries
// @route   GET /api/geo/countries
// @access  Public
export const getCountries = async (_req: Request, res: Response): Promise<void> => {
  const list = COUNTRIES.map(c => ({
    code: c.code,
    name: c.name,
    currency: c.currency,
    currencySymbol: c.currencySymbol,
    phoneCode: c.phoneCode,
    defaultTimezone: c.defaultTimezone,
    flag: c.flag,
    curricula: c.curricula,
    homeTuitionEnabled: c.homeTuitionEnabled,
    onlineEnabled: c.onlineEnabled,
    citiesCount: c.cities.length,
  }));

  res.status(200).json({ success: true, count: list.length, countries: list });
};

// @desc    Get cities for a specific country
// @route   GET /api/geo/countries/:code/cities
// @access  Public
export const getCountryCities = async (req: Request, res: Response): Promise<void> => {
  const code = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;
  const country = getCountryByCode(code);

  if (!country) {
    res.status(404).json({ success: false, message: `Country with code '${code}' not found.` });
    return;
  }

  const cities = getCitiesForCountry(code);
  res.status(200).json({
    success: true,
    countryCode: country.code,
    countryName: country.name,
    cities,
  });
};

// @desc    Get supported currencies
// @route   GET /api/geo/currencies
// @access  Public
export const getCurrencies = async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    currencies: Object.values(SUPPORTED_CURRENCIES),
  });
};
