import request from "supertest";
import app from "../app";
import User from "../models/User.model";
import Booking from "../models/Booking.model";

jest.mock("../utils/sendEmail", () => jest.fn().mockResolvedValue(undefined));

beforeAll(() => { process.env.JWT_SECRET = "test-secret-at-least-16-chars"; });

describe("admin financial mutation integrity", () => {
  async function loginAs(adminRole: string, suffix: string) {
    const email = `${suffix}@test.com`;
    await User.create({ name: suffix, email, password: "password123", role: "admin", adminRole });
    const agent = request.agent(app);
    await agent.post("/api/v1/auth/login").send({ email, password: "password123" }).expect(200);
    return agent;
  }

  async function booking() {
    const [student, tutor] = await User.create([
      { name: "Finance Student", email: `student-${Date.now()}@test.com`, password: "password123", role: "student" },
      { name: "Finance Tutor", email: `tutor-${Date.now()}@test.com`, password: "password123", role: "tutor" },
    ]);
    return Booking.create({ student: student._id, tutor: tutor._id, amount: 1000, finalAgreedRate: 1000, pricingUnit: "hour", sessionCount: 1, subtotal: 1000, studentFee: 0, tutorFee: 200, tax: 30, studentTotal: 1000, tutorNet: 770, feeConfig: { version: "test" }, platformFee: 230, tutorPayout: 770, schedule: "Evening", teachingMode: "online", paymentStatus: "received", payoutStatus: "pending" });
  }

  it("does not let a read-only analyst mutate payment state", async () => {
    const analyst = await loginAs("analyst", `finance-analyst-${Date.now()}`);
    const record = await booking();
    await analyst.patch(`/api/v1/admin/bookings/${record._id}/payment`).send({ paymentStatus: "confirmed", paymentNote: "Bank receipt verified" }).expect(403);
  });

  it("preserves fee snapshots when finance confirms payment", async () => {
    const finance = await loginAs("finance", `finance-admin-${Date.now()}`);
    const record = await booking();
    await finance.patch(`/api/v1/admin/bookings/${record._id}/payment`).send({ paymentStatus: "confirmed", paymentNote: "Bank receipt verified" }).expect(200);
    const saved = await Booking.findById(record._id).lean();
    expect(saved?.platformFee).toBe(230);
    expect(saved?.tutorPayout).toBe(770);
    expect(saved?.feeConfig).toEqual({ version: "test" });
  });

  it("rejects skipped payout transitions and updates without reasons", async () => {
    const finance = await loginAs("finance", `finance-transition-${Date.now()}`);
    const record = await booking();
    record.paymentStatus = "confirmed";
    await record.save();
    await finance.patch(`/api/v1/admin/bookings/${record._id}/payment`).send({ payoutStatus: "paid", payoutNote: "External transfer completed" }).expect(409);
    await finance.patch(`/api/v1/admin/bookings/${record._id}/payment`).send({ payoutStatus: "approved" }).expect(400);
  });
});
