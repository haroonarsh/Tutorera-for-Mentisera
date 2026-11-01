import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../app";
import User from "../models/User.model";
import AgeReviewRequest from "../models/AgeReviewRequest.model";

describe("Guardian contact recovery intake", () => {
  beforeAll(() => { process.env.JWT_SECRET = "test-guardian-recovery-secret"; });

  it("lets consent-restricted minors request a safe review without changing consent or guardian contacts", async () => {
    const student = await User.create({ name: "Recovery Student",
      email: "guardian-recovery-" + Date.now() + "@example.test",
      password: "password123", role: "student", countryCode: "PK",
      isMinor: true, parentConsentVerified: false, parentGuardianEmail: "original@example.test",
      dateOfBirth: new Date("2014-01-01") });
    const headers = { Authorization: "Bearer " +
      jwt.sign({ id: student._id.toString(), role: "student" }, process.env.JWT_SECRET!) };
    await request(app).get("/api/v1/payments/history").set(headers).expect(403);
    const body = { reason: "guardian_contact_recovery", newGuardianEmail: "untrusted@example.test" };
    const response = await request(app).post("/api/v1/auth/me/age-review/request")
      .set(headers).send(body).expect(201);
    expect(response.body.status).toBe("pending");
    const again = await request(app).post("/api/v1/auth/me/age-review/request")
      .set(headers).send(body).expect(200);
    expect(String(again.body.requestId)).toBe(String(response.body.requestId));
    const status = await request(app).get("/api/v1/auth/me/age-review/request")
      .set(headers).expect(200);
    expect(status.body.review.reason).toBe("guardian_contact_recovery");
    const updated = await User.findById(student._id);
    expect(updated?.parentGuardianEmail).toBe("original@example.test");
    expect(updated?.parentConsentVerified).toBe(false);
    const stored = await AgeReviewRequest.findById(response.body.requestId);
    expect(stored?.toObject()).not.toHaveProperty("newGuardianEmail");
  });
});
