import { NextFunction, Response } from "express";
import { AuthRequest } from "../types";

export const enforceCountryScope = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.adminRole !== "country_admin") { next(); return; }
  const allowed = (req.user.allowedCountryCodes || []).map((code) => code.toUpperCase());
  if (!allowed.length) {
    res.status(403).json({ success: false, code: "COUNTRY_SCOPE_EMPTY", message: "No country scope is assigned to this administrator." });
    return;
  }
  const requested = String(req.query.countryCode || req.query.country || req.body?.countryCode || "").toUpperCase();
  if (!requested) {
    res.status(400).json({ success: false, code: "COUNTRY_SCOPE_REQUIRED", message: "A country filter is required for country-scoped administration." });
    return;
  }
  if (!allowed.includes(requested)) {
    res.status(403).json({ success: false, code: "COUNTRY_SCOPE_DENIED", message: "This administrator is not authorized for the requested country." });
    return;
  }
  // Do not allow a country administrator through a route that has not been
  // made country-aware yet. This is intentionally restrictive: a partial
  // filter must never become a cross-country data disclosure.
  const supported = ["/marketplace/requests", "/marketplace/offers", "/markets"].some((prefix) => req.path.startsWith(prefix));
  if (!supported) {
    res.status(403).json({ success: false, code: "COUNTRY_SCOPE_ROUTE_UNSUPPORTED", message: "This administrative resource is not yet available in country-scoped mode." });
    return;
  }
  req.countryScopeCode = requested;
  next();
};
