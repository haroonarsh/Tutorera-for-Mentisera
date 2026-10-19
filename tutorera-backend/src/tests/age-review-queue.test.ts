import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../app";
import User from "../models/User.model";
import AgeReviewRequest from "../models/AgeReviewRequest.model";

describe("Phase 1 safeguarding age-review queue", () => {
  beforeAll(() => { process.env.JWT_SECRET = "phase1-test-secret"; });

  it("paginates age reviews, validates pagination, and enforces admin access", async () => {
    const admin = await User.create({ name: "Safety Admin", email: "safety-admin-" + Date.now() + "@example.test",
      password: "password123", role: "admin", adminRole: "trust_and_safety" });
    const student = await User.create({ name: "Student", email: "safety-student-" + Date.now() + "@example.test",
      password: "password123", role: "student", countryCode: "PK" });
    await AgeReviewRequest.create({ student: student._id, reason: "missing_date_of_birth" });
    const adminAuth = { Authorization: "Bearer " + jwt.sign({ id: admin._id.toString(), role: "admin" }, process.env.JWT_SECRET!) };
    const studentAuth = { Authorization: "Bearer " + jwt.sign({ id: student._id.toString(), role: "student" }, process.env.JWT_SECRET!) };
    const page = await request(app).get("/api/v1/admin/safety/age-reviews?page=1&limit=1").set(adminAuth).expect(200);
    expect(page.body.pagination).toMatchObject({ page: 1, limit: 1, total: 1, pages: 1 });
    expect(page.body.reviews).toHaveLength(1);
    await request(app).get("/api/v1/admin/safety/age-reviews?page=0").set(adminAuth).expect(400);
    await request(app).get("/api/v1/admin/safety/age-reviews?limit=999").set(adminAuth).expect(400);
    await request(app).get("/api/v1/admin/safety/age-reviews").set(studentAuth).expect(403);
    const claim = await request(app).post("/api/v1/admin/safety/age-reviews/" + page.body.reviews[0]._id + "/claim")
      .set(adminAuth).send({}).expect(200);
    expect(claim.body.status).toBe("in_review");
    const activePage = await request(app).get("/api/v1/admin/safety/age-reviews?page=1&limit=1")
      .set(adminAuth).expect(200);
    expect(activePage.body.reviews[0].status).toBe("in_review");
    await request(app).post("/api/v1/admin/safety/age-reviews/" + page.body.reviews[0]._id + "/claim")
      .set(adminAuth).send({}).expect(409);
    expect((await User.findById(student._id))?.dateOfBirth).toBeUndefined();
  });
});
