// src/tests/admin-country-scope-idor.test.ts
//
// Audit §15: IDOR regression for the country-scoped admin RBAC layer.
// A country_admin for one market must never read or modify entities in
// another country's data; a super_admin bypasses the scope filter.
//
// enforceCountryScope (middlewares/countryScope.middleware.ts) is the
// single gate for every /admin/* route. The invariants this suite
// locks in map 1:1 to the error codes the middleware returns, so any
// future refactor that drops a branch here fails the suite loudly.

import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../app";
import User from "../models/User.model";

function tokenFor(userId: string): string {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET as string, { expiresIn: "1h" });
}

async function makeAdmin(opts: {
  suffix: string;
  adminRole: "super_admin" | "country_admin";
  allowedCountryCodes?: string[];
  adminPermissions?: string[];
}) {
  const user = await User.create({
    name: `Admin ${opts.suffix}`,
    email: `admin-${opts.suffix}@country-scope.test`,
    password: "password123",
    role: "admin",
    adminRole: opts.adminRole,
    allowedCountryCodes: opts.allowedCountryCodes,
    adminPermissions: opts.adminPermissions,
    isActive: true,
  });
  return { user, token: tokenFor(user.id) };
}

describe("admin country-scope IDOR boundaries", () => {
  it("a country_admin with NO allowedCountryCodes is refused (COUNTRY_SCOPE_EMPTY)", async () => {
    // No allowedCountryCodes means every single admin call MUST fail
    // regardless of the resource — otherwise an under-provisioned
    // operator could read the global dataset.
    const admin = await makeAdmin({
      suffix: "empty-scope",
      adminRole: "country_admin",
      allowedCountryCodes: [],
    });

    const res = await request(app)
      .get(`/api/v1/admin/markets?countryCode=PK`)
      .set("Authorization", `Bearer ${admin.token}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("COUNTRY_SCOPE_EMPTY");
  });

  it("a country_admin with MULTIPLE scopes but no explicit country filter is refused (COUNTRY_SCOPE_REQUIRED)", async () => {
    // Enforces that a multi-country operator must select one country at
    // a time. Prevents accidental cross-country data aggregation.
    const admin = await makeAdmin({
      suffix: "multi-no-filter",
      adminRole: "country_admin",
      allowedCountryCodes: ["PK", "AE"],
    });

    const res = await request(app)
      .get(`/api/v1/admin/markets`)
      .set("Authorization", `Bearer ${admin.token}`);

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("COUNTRY_SCOPE_REQUIRED");
  });

  it("a country_admin asking for a country OUTSIDE their allowlist is refused (COUNTRY_SCOPE_DENIED)", async () => {
    const admin = await makeAdmin({
      suffix: "wrong-country",
      adminRole: "country_admin",
      allowedCountryCodes: ["PK"],
    });

    const res = await request(app)
      .get(`/api/v1/admin/markets?countryCode=AE`)
      .set("Authorization", `Bearer ${admin.token}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("COUNTRY_SCOPE_DENIED");
  });

  it("a country_admin hitting a country-UNSUPPORTED admin route is refused (COUNTRY_SCOPE_ROUTE_UNSUPPORTED)", async () => {
    // /admin/control-tower/pulse is NOT in the enforceCountryScope
    // supported-prefix list. A country-scoped operator must be blocked
    // from any admin route that hasn't been made country-aware yet,
    // otherwise an unsegmented response could leak across countries.
    const admin = await makeAdmin({
      suffix: "unsupported-route",
      adminRole: "country_admin",
      allowedCountryCodes: ["PK"],
    });

    const res = await request(app)
      .get(`/api/v1/admin/control-tower/pulse?countryCode=PK`)
      .set("Authorization", `Bearer ${admin.token}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("COUNTRY_SCOPE_ROUTE_UNSUPPORTED");
  });

  it("a SINGLE-country admin without an explicit filter defaults to their one country (passes the scope gate)", async () => {
    // Operational ergonomics: an operator with exactly one assigned
    // country shouldn't need to pass countryCode on every URL. The
    // middleware defaults to their one scope automatically.
    const admin = await makeAdmin({
      suffix: "single-country-default",
      adminRole: "country_admin",
      allowedCountryCodes: ["PK"],
      adminPermissions: ["market.read"],
    });

    const res = await request(app)
      .get(`/api/v1/admin/markets`)
      .set("Authorization", `Bearer ${admin.token}`);

    // Not 400 (would mean the default-scope branch was dropped) and
    // not COUNTRY_SCOPE_* (would mean the request was treated as if
    // the admin had no scope).
    expect(res.status).not.toBe(400);
    expect(res.body.code).not.toBe("COUNTRY_SCOPE_REQUIRED");
    expect(res.body.code).not.toBe("COUNTRY_SCOPE_EMPTY");
    expect(res.body.code).not.toBe("COUNTRY_SCOPE_DENIED");
  });

  it("a super_admin BYPASSES country scope — can hit the country-unsupported route", async () => {
    // Super admins intentionally bypass the whole middleware: the first
    // branch in enforceCountryScope is `adminRole !== "country_admin" →
    // next()`. If this ever regressed to apply to everyone, operators
    // without a country scope assignment would be locked out of
    // platform-wide tooling.
    const admin = await makeAdmin({
      suffix: "super-bypass",
      adminRole: "super_admin",
      adminPermissions: ["system.monitor"],
    });

    const res = await request(app)
      .get(`/api/v1/admin/control-tower/pulse`)
      .set("Authorization", `Bearer ${admin.token}`);

    // Super admin may still fail on downstream checks (e.g. permission
    // or dependency), but must NOT trip any of the four
    // enforceCountryScope error codes.
    expect(res.body.code).not.toBe("COUNTRY_SCOPE_EMPTY");
    expect(res.body.code).not.toBe("COUNTRY_SCOPE_REQUIRED");
    expect(res.body.code).not.toBe("COUNTRY_SCOPE_DENIED");
    expect(res.body.code).not.toBe("COUNTRY_SCOPE_ROUTE_UNSUPPORTED");
  });
});
