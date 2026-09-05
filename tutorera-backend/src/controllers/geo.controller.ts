import { Request, Response } from "express";
import {
  COUNTRIES,
  SUPPORTED_CURRENCIES,
  getCountryByCode,
  getCitiesForCountry,
  MASTER_SUBJECTS,
  MASTER_LEVELS,
} from "../config/countries";

// @desc    Get all supported countries, cities, subjects, levels, curricula, and currencies
// @route   GET /api/geo/countries
// @access  Public
export const getCountries = async (_req: Request, res: Response): Promise<void> => {
  const pkrRateUSD = SUPPORTED_CURRENCIES.PKR?.rateToUSD || 0.0036;

  const list = COUNTRIES.map((c) => {
    const currMeta = SUPPORTED_CURRENCIES[c.currency] || { rateToUSD: 1, symbol: c.currencySymbol };
    const rateToPKR = currMeta.rateToUSD / pkrRateUSD;
    return {
      code: c.code,
      name: c.name,
      currency: c.currency,
      currencySymbol: c.currencySymbol,
      rateToPKR: Number(rateToPKR.toFixed(4)),
      phoneCode: c.phoneCode,
      defaultTimezone: c.defaultTimezone,
      flag: c.flag,
      curricula: c.curricula,
      homeTuitionEnabled: c.homeTuitionEnabled,
      onlineEnabled: c.onlineEnabled,
      citiesCount: c.cities.length,
      cities: c.cities,
    };
  });

  const allCurricula = Array.from(new Set(COUNTRIES.flatMap((c) => c.curricula)));

  const currencies = Object.entries(SUPPORTED_CURRENCIES).map(([code, data]) => ({
    code,
    symbol: data.symbol,
    name: data.name,
    rateToUSD: data.rateToUSD,
    rateToPKR: Number((data.rateToUSD / pkrRateUSD).toFixed(4)),
  }));

  res.status(200).json({
    success: true,
    count: list.length,
    countries: list,
    subjects: MASTER_SUBJECTS,
    levels: MASTER_LEVELS,
    curricula: allCurricula,
    currencies,
  });
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
