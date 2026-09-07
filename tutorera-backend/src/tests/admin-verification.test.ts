import request from "supertest";
import app from "../app";
import User from "../models/User.model";
import TutorProfile from "../models/TutorProfile.model";

jest.mock("../utils/sendEmail", () => jest.fn().mockResolvedValue(undefined));

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret-at-least-16-chars";
});

describe("admin tutor verification", () => {
  async function superAdminAgent() {
    const admin = await User.create({
      name: "Super Admin",
      email: "admin@test.com",
      password: "password123",
      role: "admin",
      adminRole: "super_admin",
    });

    const agent = request.agent(app);
    await agent
      .post("/api/v1/auth/login")
      .send({ email: admin.email, password: "password123" })
      .expect(200);
    return agent;
  }

  it("rejects a legacy profile without revalidating its old level labels", async () => {
    const tutor = await User.create({
      name: "Legacy Tutor",
      email: "legacy-tutor@test.com",
      password: "password123",
      role: "tutor",
    });

    const inserted = await TutorProfile.collection.insertOne({
      user: tutor._id,
      fullName: "Legacy Tutor",
      levels: ["University", "O-Level", "Intermediate", "Matric"],
      verificationStatus: "pending",
      policeVerificationStatus: "not_required",
      marketplaceEligible: false,
      homeTuitionEligible: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await (await superAdminAgent())
      .patch(`/api/v1/admin/verify/${inserted.insertedId}`)
      .send({ status: "rejected", reason: "Education documents are incomplete" })
      .expect(200);

    expect(response.body.success).toBe(true);
    const stored = await TutorProfile.collection.findOne({ _id: inserted.insertedId });
    expect(stored?.verificationStatus).toBe("rejected");
    expect(stored?.rejectionReason).toBe("Education documents are incomplete");
    expect(stored?.levels).toEqual(["University", "O-Level", "Intermediate", "Matric"]);
  });
});
