import FeatureFlag from "../models/FeatureFlag.model";

/** Resolves a global or country-scoped flag. Missing flags are safely off. */
export async function isFeatureEnabled(key: string, countryCode?: string): Promise<boolean> {
  const flag = await FeatureFlag.findOne({ key: key.trim().toUpperCase() }).lean();
  if (!flag?.enabled) return false;
  return flag.scope === "global" || Boolean(countryCode && flag.countryCodes?.includes(countryCode.toUpperCase()));
}
