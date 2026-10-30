import request from "supertest";
import app from "../app";
import MarketConfig from "../models/MarketConfig.model";
import TaxConfig from "../models/TaxConfig.model";
import Subject from "../models/Subject.model";

describe("public geography reads", () => {
  it("lists only active subjects without exposing admin metadata or changing records", async () => {
    await Subject.create([{ name: "Mathematics", slug: "mathematics", category: "Sciences", status: "active", description: "internal description" }, { name: "Archived subject", slug: "archived-subject", category: "Other", status: "archived" }]);
    const before = await Subject.find().sort({ name: 1 }).lean();
    const response = await request(app).get("/api/v1/geo/subjects").expect(200);
    expect(response.body).toMatchObject({ success: true, count: 1, subjects: [{ name: "Mathematics", slug: "mathematics", category: "Sciences" }] });
    expect(response.body.subjects[0].description).toBeUndefined();
    expect(await Subject.find().sort({ name: 1 }).lean()).toEqual(before);
  });
  it("never seeds markets or taxes while listing countries", async () => {
    await request(app).get("/api/v1/geo/countries").expect(200);
    expect(await MarketConfig.countDocuments()).toBe(0);
    expect(await TaxConfig.countDocuments()).toBe(0);
  });
  it("preserves admin-selected payment and feature settings", async () => {
    const market = await MarketConfig.create({ countryCode: "AE", countryName: "United Arab Emirates", currency: "AED", launchStatus: "beta", paymentProvider: "none", paymentsEnabled: false, featureFlags: { acceptance: false, offers: false } });
    const before = await MarketConfig.findById(market._id).lean();
    await request(app).get("/api/v1/geo/countries").expect(200);
    const after = await MarketConfig.findById(market._id).lean();
    expect(after).toEqual(before);
    expect(await TaxConfig.countDocuments()).toBe(0);
  });
});
