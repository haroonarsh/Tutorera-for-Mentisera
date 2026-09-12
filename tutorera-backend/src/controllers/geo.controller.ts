import { Request, Response } from "express";
import axios from "axios";
import Country from "../models/Country.model";
import Region from "../models/Region.model";
import City from "../models/City.model";
import Locality from "../models/Locality.model";
import MarketConfig from "../models/MarketConfig.model";
import TutorProfile from "../models/TutorProfile.model";
import { SUPPORTED_CURRENCIES, getCountryByCode, getCitiesForCountry, MASTER_SUBJECTS, MASTER_LEVELS } from "../config/geo/location";
import { ensureLaunchMarkets } from "../services/market.service";

const pageSize = (value: unknown) => Math.min(Math.max(Number(value) || 25, 1), 100);
const safeSearch = (value: unknown) => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&").slice(0, 80);

export const getCountries = async (_req: Request, res: Response): Promise<void> => {
  await ensureLaunchMarkets();
  const markets = await MarketConfig.find({ isActive: true, launchStatus: { $in: ["live", "beta"] } }).sort({ launchStatus: 1, countryName: 1 }).lean();
  const countries = await Country.find({ iso2: { $in: markets.map((m) => m.countryCode) } }).lean();
  const normalized = new Map(countries.map((country) => [country.iso2, country]));
  const list = markets.map((market) => {
    const geo = normalized.get(market.countryCode);
    return {
      id: geo?._id, code: market.countryCode, iso3: market.iso3 || geo?.iso3, name: market.countryName,
      currency: market.currency, currencySymbol: market.currencySymbol, phoneCode: market.dialCode || geo?.dialCode,
      flag: geo?.flag || "🌐", curricula: geo?.curricula || [], cities: [],
      defaultTimezone: market.timezone, timezones: market.timezones?.length ? market.timezones : geo?.timezones || [market.timezone],
      languages: market.supportedLanguages, launchStatus: market.launchStatus, onlineEnabled: market.onlineEnabled,
      homeTuitionEnabled: market.homeTuitionEnabled, paymentsEnabled: market.paymentsEnabled,
      payoutsEnabled: market.payoutsEnabled, featureFlags: market.featureFlags,
    };
  });
  res.json({ success: true, count: list.length, countries: list, subjects: MASTER_SUBJECTS, levels: MASTER_LEVELS, currencies: Object.values(SUPPORTED_CURRENCIES) });
};

export const getRegions = async (req: Request, res: Response): Promise<void> => {
  const countryCode = String(req.query.country || "").toUpperCase();
  if (!countryCode) { res.status(400).json({ success: false, message: "country is required." }); return; }
  const regions = await Region.find({ countryCode, enabled: true }).sort({ name: 1 }).limit(pageSize(req.query.limit)).lean();
  res.json({ success: true, count: regions.length, regions });
};

export const getCities = async (req: Request, res: Response): Promise<void> => {
  const countryCode = String(req.query.country || "").toUpperCase();
  if (!countryCode) { res.status(400).json({ success: false, message: "country is required." }); return; }
  const limit = pageSize(req.query.limit);
  const query: Record<string, unknown> = { countryCode, enabled: true };
  if (req.query.region) query.region = req.query.region;
  if (req.query.q) query.name = { $regex: safeSearch(req.query.q), $options: "i" };
  if (req.query.cursor) query._id = { $gt: String(req.query.cursor) };
  const rows = await City.find(query).sort({ _id: 1 }).limit(limit + 1).lean();
  const cities = rows.slice(0, limit);
  res.json({ success: true, count: cities.length, cities, nextCursor: rows.length > limit ? cities[cities.length - 1]?._id : null });
};

export const getLocalities = async (req: Request, res: Response): Promise<void> => {
  if (!req.query.city) { res.status(400).json({ success: false, message: "city is required." }); return; }
  const limit = pageSize(req.query.limit);
  const query: Record<string, unknown> = { city: req.query.city, enabled: true };
  if (req.query.q) query.name = { $regex: safeSearch(req.query.q), $options: "i" };
  if (req.query.cursor) query._id = { $gt: String(req.query.cursor) };
  const rows = await Locality.find(query).sort({ _id: 1 }).limit(limit + 1).lean();
  const localities = rows.slice(0, limit);
  res.json({ success: true, count: localities.length, localities, nextCursor: rows.length > limit ? localities[localities.length - 1]?._id : null });
};

/**
 * Lightweight, database-backed typeahead for the global marketplace.  It is
 * deliberately scoped to enabled markets and public tutor data: exact
 * addresses, contact details and disabled GeoNames inventory never leave the
 * API.  The browser can ask this endpoint as the user types rather than
 * downloading the world geography dataset.
 */
export const getGlobalSearch = async (req: Request, res: Response): Promise<void> => {
  const query = String(req.query.q || "").trim();
  if (query.length < 2) {
    res.status(400).json({ success: false, message: "Enter at least two characters to search." });
    return;
  }
  const limit = Math.min(Math.max(Number(req.query.limit) || 6, 1), 10);
  const pattern = new RegExp(safeSearch(query), "i");
  const markets = await MarketConfig.find({ isActive: true, launchStatus: { $in: ["live", "beta"] } })
    .select("countryCode")
    .lean();
  const countryCodes = markets.map((market) => market.countryCode);

  const [countries, cities, tutors, curricula, languages] = await Promise.all([
    Country.find({ iso2: { $in: countryCodes }, enabled: true, $or: [{ name: pattern }, { iso2: pattern }] })
      .select("iso2 iso3 name flag currencyCode timezones")
      .sort({ name: 1 }).limit(limit).lean(),
    City.find({ countryCode: { $in: countryCodes }, enabled: true, $or: [{ name: pattern }, { asciiName: pattern }] })
      .select("name asciiName countryCode regionCode timezone population")
      .sort({ population: -1, name: 1 }).limit(limit).lean(),
    TutorProfile.find({
      verificationStatus: "approved",
      countryCode: { $in: countryCodes },
      $or: [{ fullName: pattern }, { subjects: pattern }, { curricula: pattern }, { "languages.language": pattern }],
    })
      .select("fullName countryCode countryName city subjects curricula languages averageRating totalReviews teachingMode currency hourlyRate")
      .sort({ averageRating: -1, totalReviews: -1 }).limit(limit).lean(),
    TutorProfile.distinct("curricula", { verificationStatus: "approved", countryCode: { $in: countryCodes }, curricula: pattern }),
    TutorProfile.distinct("languages.language", { verificationStatus: "approved", countryCode: { $in: countryCodes }, "languages.language": pattern }),
  ]);

  const subjects = MASTER_SUBJECTS.filter((subject) => pattern.test(subject)).slice(0, limit);
  res.json({
    success: true,
    query,
    results: {
      countries,
      cities,
      subjects,
      curricula: curricula.filter(Boolean).slice(0, limit),
      languages: languages.filter(Boolean).slice(0, limit),
      tutors,
    },
  });
};

export const getCountryCities = async (req: Request, res: Response): Promise<void> => {
  const code = String(req.params.code || "").toUpperCase();
  const normalized = await City.find({ countryCode: code, enabled: true }).sort({ population: -1, name: 1 }).limit(100).lean();
  if (normalized.length) { res.json({ success: true, countryCode: code, cities: normalized }); return; }
  const country = getCountryByCode(code);
  if (!country) { res.status(404).json({ success: false, message: `Country with code '${code}' not found.` }); return; }
  res.json({ success: true, countryCode: country.code, countryName: country.name, cities: getCitiesForCountry(code) });
};

export const getCurrencies = async (_req: Request, res: Response): Promise<void> => {
  res.json({ success: true, currencies: Object.values(SUPPORTED_CURRENCIES) });
};

export const postalLookup = async (req: Request, res: Response): Promise<void> => {
  const query = String(req.query.q || "").trim();
  const country = String(req.query.country || "").toUpperCase();
  
  if (query.length < 2) {
    res.status(400).json({ success: false, message: "Enter at least two characters to search." });
    return;
  }
  
  const username = process.env.GEONAMES_USERNAME || "demo";
  
  try {
    const isNumeric = /^\d+$/.test(query) || /^[A-Z0-9- ]+$/i.test(query);
    const param = isNumeric ? "postalcode_startsWith" : "placename_startsWith";
    const countryParam = country ? `&country=${country}` : "";
    
    const url = `http://api.geonames.org/postalCodeSearchJSON?${param}=${encodeURIComponent(query)}${countryParam}&maxRows=10&username=${username}`;
    
    const response = await axios.get(url);
    if (response.data && response.data.postalCodes) {
      res.json({ success: true, results: response.data.postalCodes });
    } else {
      res.json({ success: true, results: [] });
    }
  } catch (error) {
    console.error("GeoNames API Error:", error);
    res.status(500).json({ success: false, message: "Error fetching location data." });
  }
};
