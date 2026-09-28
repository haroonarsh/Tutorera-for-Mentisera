import request from "supertest";
import app from "../app";
import User from "../models/User.model";
import TuitionRequest from "../models/Request.model";

describe("marketplace request privacy boundaries", () => {
  it("keeps the full demand feed tutor-only and redacts public requirements", async () => {
    const student = await User.create({ name: "Privacy Student", email: "privacy-student@test.com", password: "password123", role: "student" });
    await TuitionRequest.create({
      student: student._id,
      subject: "Mathematics",
      level: "O-Level (Cambridge / Edexcel)",
      description: "Meet at House 12, Example Street. Call 03001234567.",
      budget: 15000,
      maximumBudget: 22000,
      pricingUnit: "month",
      currency: "PKR",
      teachingMode: "online",
      schedule: "Mon–Thu, 6 PM",
      status: "open",
      expiresAt: new Date(Date.now() + 86_400_000),
      invitedTutors: [student._id],
    });

    await request(app).get("/api/v1/requests").expect(401);

    const preview = await request(app).get("/api/v1/requests/public/preview").expect(200);
    expect(preview.body.requests).toHaveLength(1);
    const item = preview.body.requests[0];
    expect(item).not.toHaveProperty("maximumBudget");
    expect(item).not.toHaveProperty("invitedTutors");
    expect(item).not.toHaveProperty("area");
    expect(item.description).toBe("Learning goals will be shared after a tutor is selected.");
    expect(JSON.stringify(item)).not.toContain("03001234567");
    expect(JSON.stringify(item)).not.toContain("Example Street");
  });
});
