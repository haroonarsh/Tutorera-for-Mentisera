// src/tests/application-country-scope.test.ts
//
// Academic Framework audit, P0-3:
//
//   > Application-review routes and profile lookup lack country-scope
//   > enforcement.
//
// enforceCountryScope was wired into routes/tracking.routes.ts for
// /admin/applications/* and the loadProfileOr404 helper in
// tracking.controller.ts was extended to 404 any profile whose
// countryCode falls outside the acting country-admin's allowed scope.
// listApplications now also injects countryCode into its Mongo filter
// when the scope is set.
//
// This suite exercises both halves against a representative read path:
// GET /tracking/admin/applications               (list)
// GET /tracking/admin/applications/:id           (detail)

import request from "supertest";
import { Types } from "mongoose";
import jwt from "jsonwebtoken";
import app from "../app";
import User from "../models/User.model";
import TutorProfile from "../models/TutorProfile.model";

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
    email: `admin-${opts.suffix}@app-country-scope.test`,
    password: "password123",
    role: "admin",
    adminRole: opts.adminRole,
    allowedCountryCodes: opts.allowedCountryCodes,
    adminPermissions: opts.adminPermissions,
    isActive: true,
  });
  return { user, token: tokenFor(user.id) };
}

async function makeTutorInCountry(suffix: string, country: string) {
  const user = await User.create({
    name: `Tutor ${suffix}`,
    email: `tutor-${suffix}@app-country-scope.test`,
    password: "password123",
    role: "tutor",
    isActive: true,
    countryCode: country,
  });
  const profile = await TutorProfile.create({
    user: user._id,
    bio: "An honest biography describing teaching background.",
    subjects: ["Mathematics"],
    hourlyRate: 1500,
    teachingMode: "online",
    countryCode: country,
  });
  return { user, profile };
}

describe("admin application-review country-scope enforcement (audit P0-3)", () => {
  it("a PK country-admin's list only contains PK tutor profiles — AE / SA are filtered out", async () => {
    const admin = await makeAdmin({
      suffix: "list-pk",
      adminRole: "country_admin",
      allowedCountryCodes: ["PK"],
      adminPermissions: ["tutor.read"],
    });
    await makeTutorInCountry("list-pk-A", "PK");
    await makeTutorInCountry("list-pk-B", "PK");
    const ae = await makeTutorInCountry("list-ae", "AE");
    const sa = await makeTutorInCountry("list-sa", "SA");

    const res = await request(app)
      .get(`/api/v1/tracking/admin/applications`)
      .set("Authorization", `Bearer ${admin.token}`);

    expect(res.status).toBe(200);
    const returnedProfileIds: string[] = (res.body.applications || res.body.data || []).map((a: { _id?: string; profile?: { _id?: string } }) => a._id || a.profile?._id || "");
    // AE and SA tutor profiles must not appear in a PK country-admin's
    // list regardless of what else is in the response shape.
    const asJson = JSON.stringify(res.body);
    expect(asJson).not.toContain((ae.profile._id as Types.ObjectId).toString());
    expect(asJson).not.toContain((sa.profile._id as Types.ObjectId).toString());
    // Returned ids (if the shape includes them) must all map to PK.
    for (const id of returnedProfileIds.filter(Boolean)) {
      const p = await TutorProfile.findById(id);
      expect(p?.countryCode).toBe("PK");
    }
  });

  it("a PK country-admin cannot read a specific AE tutor's application detail (404, not revealing existence)", async () => {
    const admin = await makeAdmin({
      suffix: "detail-crosscountry",
      adminRole: "country_admin",
      allowedCountryCodes: ["PK"],
      adminPermissions: ["tutor.read"],
    });
    const target = await makeTutorInCountry("detail-ae-target", "AE");

    const res = await request(app)
      .get(`/api/v1/tracking/admin/applications/${target.profile.id}`)
      .set("Authorization", `Bearer ${admin.token}`)
      // multi-country handler default; even if the admin here only has
      // PK, the countryScope middleware will reject AE as outside scope
      // BEFORE loadProfileOr404 runs. Pass an explicit countryCode=PK
      // so the scope resolves cleanly and the test proves the handler-
      // level guard, not the middleware's wrong-country rejection.
      .query({ countryCode: "PK" });

    expect(res.status).toBe(404);
  });

  it("a PK country-admin CAN read a PK tutor's application detail (positive control)", async () => {
    const admin = await makeAdmin({
      suffix: "detail-pk-ok",
      adminRole: "country_admin",
      allowedCountryCodes: ["PK"],
      adminPermissions: ["tutor.read"],
    });
    const target = await makeTutorInCountry("detail-pk-ok-target", "PK");

    const res = await request(app)
      .get(`/api/v1/tracking/admin/applications/${target.profile.id}`)
      .set("Authorization", `Bearer ${admin.token}`);

    expect(res.status).toBe(200);
  });

  it("a super_admin bypasses the country filter — list contains tutors from EVERY country", async () => {
    const admin = await makeAdmin({
      suffix: "super-all",
      adminRole: "super_admin",
      adminPermissions: ["tutor.read"],
    });
    const pk = await makeTutorInCountry("super-pk", "PK");
    const ae = await makeTutorInCountry("super-ae", "AE");

    const res = await request(app)
      .get(`/api/v1/tracking/admin/applications`)
      .set("Authorization", `Bearer ${admin.token}`);

    expect(res.status).toBe(200);
    const asJson = JSON.stringify(res.body);
    // Both ids must appear — super_admin's view is global.
    expect(asJson).toContain((pk.profile._id as Types.ObjectId).toString());
    expect(asJson).toContain((ae.profile._id as Types.ObjectId).toString());
  });
});
