import request from "supertest";
import app from "../app";
import User from "../models/User.model";
import { DEFAULT_MATCHING_CONFIG } from "../config/matchingConfig";

jest.mock("../utils/sendEmail", () => jest.fn().mockResolvedValue(undefined));

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret-at-least-16-chars";
});

describe("matching admin RBAC", () => {
  async function loginAs(adminRole: string, suffix: string) {
    const email = `${suffix}@test.com`;
    await User.create({ name: suffix, email, password: "password123", role: "admin", adminRole });
    const agent = request.agent(app);
    await agent.post("/api/v1/auth/login").send({ email, password: "password123" }).expect(200);
    return agent;
  }

  it("does not expose matching analytics to an admin without matching.read", async () => {
    const contentAdmin = await loginAs("content", "content-admin");
    await contentAdmin.get("/api/v1/matching/admin/analytics").expect(403);
  });

  it("allows an analyst to read analytics but not change configuration", async () => {
    const analyst = await loginAs("analyst", "analyst-admin");
    await analyst.get("/api/v1/matching/admin/analytics").expect(200);
    await analyst.put("/api/v1/matching/admin/config").send({ ...DEFAULT_MATCHING_CONFIG, changeReason: "Unauthorized calibration" }).expect(403);
  });

  it("validates analytics filters before querying", async () => {
    const analyst = await loginAs("analyst", "analytics-filter-admin");
    await analyst.get("/api/v1/matching/admin/analytics?mode=classroom").expect(400);
    await analyst.get("/api/v1/matching/admin/analytics?dateFrom=2026-09-10&dateTo=2026-09-01").expect(400);
    const response = await analyst.get("/api/v1/matching/admin/analytics?mode=online&countryCode=pk").expect(200);
    expect(response.body.analytics.filters).toMatchObject({ mode: "online", countryCode: "pk" });
  });

  it("allows marketplace operations to save a valid configuration", async () => {
    const operator = await loginAs("marketplace_operations", "marketplace-admin");
    const response = await operator
      .put("/api/v1/matching/admin/config")
      .send({ ...DEFAULT_MATCHING_CONFIG, changeReason: "Routine matching calibration" })
      .expect(200);
    expect(response.body.config.thresholds.maxOffers).toBe(DEFAULT_MATCHING_CONFIG.thresholds.maxOffers);
  });
});
