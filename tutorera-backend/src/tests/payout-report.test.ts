import request from "supertest";
import app from "../app";
import User from "../models/User.model";
import TutorProfile from "../models/TutorProfile.model";
import Booking from "../models/Booking.model";
import PayoutReport from "../models/PayoutReport.model";
import { generateTutorPayoutReport, getPayoutReportById, resolvePayoutReportPeriod } from "../services/payoutReport.service";

beforeAll(() => { process.env.JWT_SECRET = "test-secret-at-least-16-chars"; });

async function fixture() {
  const [tutor, student] = await User.create([
    { name: "Statement Tutor", email: `statement-tutor-${Date.now()}@test.com`, password: "password123", role: "tutor" },
    { name: "Statement Student", email: `statement-student-${Date.now()}@test.com`, password: "password123", role: "student" },
  ]);
  await TutorProfile.create({ user: tutor._id, fullName: tutor.name, verificationStatus: "approved", education: [] });
  const paid = await Booking.create({
    student: student._id, tutor: tutor._id, amount: 2000, finalAgreedRate: 2000,
    pricingUnit: "session", sessionCount: 1, subtotal: 2000, studentFee: 0,
    tutorFee: 400, tax: 60, studentTotal: 2000, tutorNet: 1540,
    feeConfig: { version: "snapshot-v1" }, platformFee: 460, tutorPayout: 1540,
    schedule: "Evening", teachingMode: "online", status: "completed",
    paymentStatus: "confirmed", payoutStatus: "paid", payoutPaidAt: new Date(),
  });
  await Booking.create({
    student: student._id, tutor: tutor._id, amount: 5000, finalAgreedRate: 5000,
    pricingUnit: "session", sessionCount: 1, subtotal: 5000, studentFee: 0,
    tutorFee: 1000, tax: 150, studentTotal: 5000, tutorNet: 3850,
    feeConfig: { version: "snapshot-v1" }, platformFee: 1150, tutorPayout: 3850,
    schedule: "Morning", teachingMode: "online", status: "completed",
    paymentStatus: "confirmed", payoutStatus: "pending",
  });
  return { tutor, paid };
}

describe("payout PDF reports", () => {
  it("uses paid booking snapshots and persists a verifiable report", async () => {
    const { tutor, paid } = await fixture();
    const periodStart = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const periodEnd = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const { data, pdfBuffer } = await generateTutorPayoutReport(tutor._id.toString(), periodStart, periodEnd, { userId: tutor._id.toString(), role: "tutor" });

    expect(pdfBuffer.subarray(0, 4).toString()).toBe("%PDF");
    expect(data.grossAmount).toBe(2000);
    expect(data.platformFee).toBe(400);
    expect(data.taxOnFee).toBe(60);
    expect(data.netPayout).toBe(1540);
    expect(data.transactions.map((item) => item.bookingId)).toEqual([paid._id.toString()]);
    expect(await PayoutReport.countDocuments({ tutor: tutor._id })).toBe(1);
    const verified = await getPayoutReportById(data.reportId);
    expect(verified?.digest).toBe(data.digest);
    expect(verified?.reportReference).toBe(data.reportReference);
  });

  it("limits reports to a valid 12-month period", () => {
    expect(() => resolvePayoutReportPeriod("2025-01-01", "2026-09-01")).toThrow("12-month");
    expect(() => resolvePayoutReportPeriod("2026-09-02", "2026-09-01")).toThrow("valid payout report date range");
  });

  it("allows a tutor to download only the report generated for their authenticated account", async () => {
    const { tutor } = await fixture();
    const agent = request.agent(app);
    await agent.post("/api/v1/auth/login").send({ email: tutor.email, password: "password123" }).expect(200);
    const response = await agent.get("/api/v1/earnings/report/pdf").expect(200);
    expect(response.headers["content-type"]).toContain("application/pdf");
    expect(response.headers["content-disposition"]).toContain("attachment");
    expect(response.headers["access-control-expose-headers"]).toContain("Content-Disposition");
  });

  it("requires payout-read permission on the admin endpoint", async () => {
    const { tutor } = await fixture();
    const analystEmail = `statement-analyst-${Date.now()}@test.com`;
    await User.create({ name: "Statement Analyst", email: analystEmail, password: "password123", role: "admin", adminRole: "analyst" });
    const analyst = request.agent(app);
    await analyst.post("/api/v1/auth/login").send({ email: analystEmail, password: "password123" }).expect(200);
    await analyst.get(`/api/v1/admin/tutors/${tutor._id}/payout-report/pdf`).expect(403);
  });

  it("allows a finance administrator to download a tutor payout report", async () => {
    const { tutor } = await fixture();
    const financeEmail = `statement-finance-${Date.now()}@test.com`;
    await User.create({ name: "Statement Finance", email: financeEmail, password: "password123", role: "admin", adminRole: "finance" });
    const finance = request.agent(app);
    await finance.post("/api/v1/auth/login").send({ email: financeEmail, password: "password123" }).expect(200);
    const response = await finance.get(`/api/v1/admin/tutors/${tutor._id}/payout-report/pdf`).expect(200);
    expect(response.headers["content-type"]).toContain("application/pdf");
    expect(response.headers["cache-control"]).toBe("private, no-store");
  });
});
