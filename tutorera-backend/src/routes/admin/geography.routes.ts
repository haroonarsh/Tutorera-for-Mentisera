import { Router, Response } from "express";
import Country from "../../models/Country.model";
import Region from "../../models/Region.model";
import City from "../../models/City.model";
import Locality from "../../models/Locality.model";
import MarketConfig from "../../models/MarketConfig.model";
import { AuthRequest } from "../../types";
import { requirePermission } from "../../middlewares/rbac.middleware";
import { logAudit } from "../../utils/logAudit";

const router = Router();

router.get("/", requirePermission("market.read"), async (req: AuthRequest, res: Response) => {
  const scope = req.countryScopeCode;
  const [countries, regionCount, cityCount, localityCount] = await Promise.all([
    Country.find(scope ? { iso2: scope } : {}).sort({ enabled: -1, name: 1 }).lean(),
    Region.countDocuments(scope ? { countryCode: scope } : {}), City.countDocuments(scope ? { countryCode: scope } : {}), Locality.countDocuments(scope ? { countryCode: scope } : {}),
  ]);
  const markets = await MarketConfig.find(scope ? { countryCode: scope } : {}).select("countryCode launchStatus isActive paymentsEnabled homeTuitionEnabled").lean();
  const marketByCode = new Map(markets.map((market) => [market.countryCode, market]));
  res.json({ success: true, summary: { countries: countries.length, regions: regionCount, cities: cityCount, localities: localityCount }, countries: countries.map((country) => ({ ...country, market: marketByCode.get(country.iso2) || null })) });
});

router.patch("/countries/:id", requirePermission("market.configure"), async (req: AuthRequest, res: Response) => {
  const allowed = ["enabled", "defaultLanguage", "supportedLanguages", "rtlSupported", "curricula"];
  const changes = Object.fromEntries(allowed.filter((key) => req.body[key] !== undefined).map((key) => [key, req.body[key]]));
  const country = await Country.findOneAndUpdate({ _id: req.params.id, ...(req.countryScopeCode ? { iso2: req.countryScopeCode } : {}) }, { $set: changes }, { new: true, runValidators: true });
  if (!country) { res.status(404).json({ success: false, message: "Country not found." }); return; }
  await logAudit({ action: "geography_country_updated", actor: req.user?.name || "Administrator", actorId: req.user?._id?.toString(), entity: "Country", targetId: country.id, metadata: { iso2: country.iso2, changes } });
  res.json({ success: true, country });
});

export default router;
