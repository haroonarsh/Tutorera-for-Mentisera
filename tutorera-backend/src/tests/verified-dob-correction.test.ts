import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../app";
import User from "../models/User.model";
import StudentProfile from "../models/StudentProfile.model";
import AgeReviewRequest from "../models/AgeReviewRequest.model";

describe("Verified DOB correction requires independent approval", () => {
  beforeAll(() => { process.env.JWT_SECRET = "verified-dob-test-secret"; });

  it("requires assigned evidence review, different supervisor, and revokes existing consent", async () => {
    const student = await User.create({
      name: "Age Correction Student", email: "age-correction-student-" + Date.now() + "@example.test",
      password: "password123", role: "student", isMinor: false,
      parentConsentVerified: true, dateOfBirth: new Date("2000-01-01")
    });
    await StudentProfile.create({ user: student._id, dateOfBirth: "2000-01-01" });
    const reviewer = await User.create({ name: "Safety Reviewer",
      email: "age-correction-reviewer-" + Date.now() + "@example.test",
      password: "password123", role: "admin", adminRole: "trust_and_safety" });
    const supervisor = await User.create({ name: "Independent Supervisor",
      email: "age-correction-supervisor-" + Date.now() + "@example.test",
      password: "password123", role: "admin", adminRole: "super_admin" });
    const token = (id: string) => ({ Authorization: "Bearer " +
      jwt.sign({ id, role: "admin" }, process.env.JWT_SECRET!) });
    const reviewerAuth = token(reviewer._id.toString());
    const supervisorAuth = token(supervisor._id.toString());
    const review = await AgeReviewRequest.create({
      student: student._id, reason: "incorrect_date_of_birth", status: "in_review",
      assignedTo: reviewer._id, assignedAt: new Date(),
    });
    const url = "/api/v1/admin/safety/age-reviews/" + review._id.toString();
    await request(app).post(url + "/approve-dob").set(supervisorAuth).expect(409);
    await request(app).post(url + "/dob-proposal").set(supervisorAuth)
      .send({ dateOfBirth: "2014-01-01", evidenceReference: "CASE_12345678" }).expect(409);
    await request(app).post(url + "/dob-proposal").set(reviewerAuth)
      .send({ dateOfBirth: "2014-02-30", evidenceReference: "CASE_12345678" }).expect(400);
    await request(app).post(url + "/dob-proposal").set(reviewerAuth)
      .send({ dateOfBirth: "2014-01-01", evidenceReference: "CASE_12345678" }).expect(200);
    await request(app).post(url + "/approve-dob").set(reviewerAuth).expect(403);
    await request(app).post(url + "/approve-dob").set(supervisorAuth).expect(200);
    const updatedStudent = await User.findById(student._id);
    expect(updatedStudent?.dateOfBirth?.toISOString().slice(0, 10)).toBe("2014-01-01");
    expect(updatedStudent?.isMinor).toBe(true);
    expect(updatedStudent?.parentConsentVerified).toBe(false);
    const profile = await StudentProfile.findOne({ user: student._id });
    expect(profile?.dateOfBirth).toBe("2014-01-01");
    const resolved = await AgeReviewRequest.findById(review._id);
    expect(resolved?.status).toBe("closed");
    await request(app).post(url + "/approve-dob").set(supervisorAuth).expect(409);
  });
});
