import request from "supertest";
import app from "../app";
import User from "../models/User.model";
import Booking from "../models/Booking.model";
import Referral from "../models/Referral.model";
import ReferralConfig from "../models/ReferralConfig.model";

jest.mock("../utils/sendEmail", () => jest.fn().mockResolvedValue(undefined));

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret-at-least-16-chars";
});

async function user(role: "student" | "tutor" | "admin", adminRole?: "super_admin" | "growth") {
  const email = `currency-${role}-${Date.now()}-${Math.random()}@test.com`;
  await User.create({ name: `Currency ${role}`, email, password: "password123", role, ...(adminRole ? { adminRole } : {}) });
  const agent = request.agent(app);
  await agent.post("/api/v1/auth/login").send({ email, password: "password123" }).expect(200);
  return agent;
}

describe("settlement currency is never silently assumed", () => {
  it("returns each payout row in its own booking currency", async () => {
    const tutor = await User.create({ name: "Payout Tutor", email: `payout-tutor-${Date.now()}@test.com`, password: "password123", role: "tutor" });
    const student = await User.create({ name: "Payout Student", email: `payout-student-${Date.now()}@test.com`, password: "password123", role: "student" });
    await Booking.create([
      { student: student._id, tutor: tutor._id, amount: 80, finalAgreedRate: 80, currency: "USD", subtotal: 80, studentTotal: 80, tutorNet: 62, tutorPayout: 62, feeConfig: { version: "test" }, schedule: "Weekly", teachingMode: "online", status: "completed", paymentStatus: "confirmed", payoutStatus: "paid" },
      { student: student._id, tutor: tutor._id, amount: 8000, finalAgreedRate: 8000, currency: "PKR", subtotal: 8000, studentTotal: 8000, tutorNet: 6240, tutorPayout: 6240, feeConfig: { version: "test" }, schedule: "Weekly", teachingMode: "online", status: "completed", paymentStatus: "confirmed", payoutStatus: "paid" },
    ]);

    const agent = request.agent(app);
    await agent.post("/api/v1/auth/login").send({ email: tutor.email, password: "password123" }).expect(200);

    const res = await agent.get("/api/v1/earnings/payouts").expect(200);

    const currencies = res.body.payouts.map((p: { currency: string }) => p.currency).sort();
    expect(currencies).toEqual(["PKR", "USD"]);
    const totals = res.body.stats.currencyTotals;
    expect(totals.find((t: { currency: string }) => t.currency === "USD").paidAmount).toBe(62);
    expect(totals.find((t: { currency: string }) => t.currency === "PKR").paidAmount).toBe(6240);
  });

  it("issues referral credit in the configured currency and snapshots it", async () => {
    await ReferralConfig.create({ referrerRewardAmount: 25, referredDiscountAmount: 30, currency: "AED", isActive: true });
    const referrer = await User.create({ name: "Referrer", email: `ref-a-${Date.now()}@test.com`, password: "password123", role: "student" });
    const referred = await User.create({ name: "Referred", email: `ref-b-${Date.now()}@test.com`, password: "password123", role: "student" });
    const code = `REF${Date.now().toString().slice(-6)}`;
    referrer.referralCode = code;
    await referrer.save();

    const agent = request.agent(app);
    await agent.post("/api/v1/auth/login").send({ email: referred.email, password: "password123" }).expect(200);
    const applied = await agent.post("/api/v1/referral/apply").send({ code }).expect(200);

    expect(applied.body.creditAdded).toBe(30);
    expect(applied.body.creditCurrency).toBe("AED");
    expect(applied.body.message).toContain("AED 30");

    const referral = await Referral.findOne({ referred: referred._id });
    expect(referral?.creditCurrency).toBe("AED");
    expect(referral?.creditAmount).toBe(25);

    const referredAfter = await User.findById(referred._id);
    expect(referredAfter?.referralCredit).toBe(30);
    expect(referredAfter?.referralCreditCurrency).toBe("AED");
  });

  it("defaults the referral program to the global settlement currency", async () => {
    const agent = await user("student");
    const res = await agent.get("/api/v1/referral/my").expect(200);

    expect(res.body.program.currency).toBe("USD");
    expect(res.body.referralCreditCurrency).toBe("USD");
    expect(res.body.program.referrerRewardAmount).toBe(200);
  });

  it("refuses to mix a second currency into an existing referral balance", async () => {
    const config = await ReferralConfig.create({ referrerRewardAmount: 10, referredDiscountAmount: 10, currency: "PKR", isActive: true });
    const referrer = await User.create({ name: "Mixed Referrer", email: `mix-a-${Date.now()}@test.com`, password: "password123", role: "student" });
    const referred = await User.create({ name: "Mixed Referred", email: `mix-b-${Date.now()}@test.com`, password: "password123", role: "student", referralCredit: 500, referralCreditCurrency: "USD" });
    const code = `MIX${Date.now().toString().slice(-6)}`;
    referrer.referralCode = code;
    await referrer.save();

    const agent = request.agent(app);
    await agent.post("/api/v1/auth/login").send({ email: referred.email, password: "password123" }).expect(200);
    const res = await agent.post("/api/v1/referral/apply").send({ code }).expect(400);

    expect(res.body.message).toContain("USD");
    expect(res.body.message).toContain("PKR");
    const unchanged = await User.findById(referred._id);
    expect(unchanged?.referralCredit).toBe(500);
    expect(unchanged?.referredBy).toBeNull();
    expect(config.currency).toBe("PKR");
  });

  it("groups admin referral totals per currency instead of summing them", async () => {
    await ReferralConfig.create({ referrerRewardAmount: 10, referredDiscountAmount: 10, currency: "USD", isActive: true });
    const referrer = await User.create({ name: "Group Referrer", email: `grp-a-${Date.now()}@test.com`, password: "password123", role: "student" });
    const legacyReferred = await User.create({ name: "Legacy Referred", email: `grp-b-${Date.now()}@test.com`, password: "password123", role: "student" });
    const usdReferred = await User.create({ name: "Usd Referred", email: `grp-c-${Date.now()}@test.com`, password: "password123", role: "student" });
    await Referral.create([
      { referrer: referrer._id, referred: legacyReferred._id, status: "credited", creditAmount: 200, creditCurrency: "PKR" },
      { referrer: referrer._id, referred: usdReferred._id, status: "credited", creditAmount: 10, creditCurrency: "USD" },
    ]);

    const admin = await user("admin", "super_admin");
    const res = await admin.get("/api/v1/admin/referrals").expect(200);

    const grouped = res.body.creditByCurrency;
    expect(grouped).toEqual(expect.arrayContaining([{ currency: "PKR", total: 200 }, { currency: "USD", total: 10 }]));
    expect(res.body.totalCreditIssued).toBeNull();
  });

  it("rejects an unsupported referral currency from the admin console", async () => {
    const admin = await user("admin", "growth");
    await admin.put("/api/v1/admin/referral-config").send({ currency: "XYZ" }).expect(400);

    await admin.put("/api/v1/admin/referral-config").send({ currency: "gbp", referrerRewardAmount: 15 }).expect(200);
    const config = await ReferralConfig.findOne();
    expect(config?.currency).toBe("GBP");
    expect(config?.referrerRewardAmount).toBe(15);
  });
});