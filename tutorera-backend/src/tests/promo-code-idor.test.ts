// src/tests/promo-code-idor.test.ts
//
// Audit §15 follow-on: promo code IDOR + authorization boundaries.
// A promo code is a direct discount — if an attacker could bypass the
// per-user limit, applicable-roles filter or role gate, they could
// stack discounts or redeem codes they shouldn't have access to.
//
// promoCode.controller.ts:
//   /validate and /redeem are both authorize("student", "parent")
//   per-user limit is enforced via PromoCodeRedemption.countDocuments
//     scoped to { promoCode, user: req.user._id }
//   applicableRoles must include req.user.role

import request from "supertest";
import { Types } from "mongoose";
import jwt from "jsonwebtoken";
import app from "../app";
import User from "../models/User.model";
import PromoCode from "../models/PromoCode.model";
import PromoCodeRedemption from "../models/PromoCodeRedemption.model";

function tokenFor(userId: string): string {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET as string, { expiresIn: "1h" });
}

async function makeUser(role: "student" | "parent" | "tutor", suffix: string) {
  const user = await User.create({
    name: `${role[0].toUpperCase() + role.slice(1)} ${suffix}`,
    email: `${role}-${suffix}@promo-idor.test`,
    password: "password123",
    role,
    isActive: true,
  });
  return { user, token: tokenFor(user.id) };
}

async function makePromoCode(code: string, overrides: Partial<Record<string, unknown>> = {}) {
  return PromoCode.create({
    code,
    discountType: "percentage",
    discountValue: 10,
    minBookingAmount: 100,
    maxRedemptionsPerUser: 1,
    applicableRoles: ["student", "parent"],
    isActive: true,
    validFrom: new Date(Date.now() - 60_000),
    ...overrides,
  });
}

describe("promo code IDOR + authorization boundaries", () => {
  it("a tutor cannot validate a promo code (role gate → 403)", async () => {
    const tutor = await makeUser("tutor", "role-validate");
    await makePromoCode("TUTORERA10");

    const res = await request(app)
      .post(`/api/v1/promo-codes/validate`)
      .set("Authorization", `Bearer ${tutor.token}`)
      .send({ code: "TUTORERA10", amount: 500 });

    expect(res.status).toBe(403);
  });

  it("a tutor cannot redeem a promo code (role gate → 403, no PromoCodeRedemption row)", async () => {
    const tutor = await makeUser("tutor", "role-redeem");
    const promo = await makePromoCode("TUTORERA20");

    const res = await request(app)
      .post(`/api/v1/promo-codes/redeem`)
      .set("Authorization", `Bearer ${tutor.token}`)
      .send({ code: "TUTORERA20", amount: 500 });

    expect(res.status).toBe(403);
    expect(await PromoCodeRedemption.countDocuments({ promoCode: promo._id })).toBe(0);
  });

  it("a parent cannot redeem a student-only code (applicableRoles enforced → 400)", async () => {
    const parent = await makeUser("parent", "role-mismatch");
    const promo = await makePromoCode("STUDENTONLY", { applicableRoles: ["student"] });

    const res = await request(app)
      .post(`/api/v1/promo-codes/redeem`)
      .set("Authorization", `Bearer ${parent.token}`)
      .send({ code: "STUDENTONLY", amount: 500 });

    expect(res.status).toBe(400);
    expect(await PromoCodeRedemption.countDocuments({ promoCode: promo._id })).toBe(0);
  });

  it("per-user limit is enforced — second redemption on a once-per-user code is rejected", async () => {
    const student = await makeUser("student", "per-user-limit");
    const promo = await makePromoCode("ONCEONLY", { maxRedemptionsPerUser: 1 });

    const first = await request(app)
      .post(`/api/v1/promo-codes/redeem`)
      .set("Authorization", `Bearer ${student.token}`)
      .send({ code: "ONCEONLY", amount: 500 });
    expect(first.status).toBe(200);

    const second = await request(app)
      .post(`/api/v1/promo-codes/redeem`)
      .set("Authorization", `Bearer ${student.token}`)
      .send({ code: "ONCEONLY", amount: 500 });

    expect(second.status).toBe(400);
    // Exactly one redemption row for this user on this code.
    const count = await PromoCodeRedemption.countDocuments({ promoCode: promo._id, user: student.user._id });
    expect(count).toBe(1);
  });

  it("per-user quota is scoped to the caller — user A's redemption does NOT consume user B's quota", async () => {
    // Core IDOR invariant: PromoCodeRedemption.countDocuments must filter
    // by user: req.user._id, otherwise one user's redemption would
    // retroactively exhaust everyone else's single-use quota.
    const alice = await makeUser("student", "alice-scope");
    const bob = await makeUser("student", "bob-scope");
    await makePromoCode("SHAREDQUOTA", { maxRedemptionsPerUser: 1 });

    // Alice redeems her one allowed use.
    const alicePost = await request(app)
      .post(`/api/v1/promo-codes/redeem`)
      .set("Authorization", `Bearer ${alice.token}`)
      .send({ code: "SHAREDQUOTA", amount: 500 });
    expect(alicePost.status).toBe(200);

    // Bob must still be able to redeem — Alice's row must not have
    // counted against Bob's per-user quota.
    const bobPost = await request(app)
      .post(`/api/v1/promo-codes/redeem`)
      .set("Authorization", `Bearer ${bob.token}`)
      .send({ code: "SHAREDQUOTA", amount: 500 });

    expect(bobPost.status).toBe(200);
  });

  it("a deactivated code is refused even for valid user+amount (isActive gate)", async () => {
    const student = await makeUser("student", "inactive-gate");
    const promo = await makePromoCode("DISABLED", { isActive: false });

    const res = await request(app)
      .post(`/api/v1/promo-codes/redeem`)
      .set("Authorization", `Bearer ${student.token}`)
      .send({ code: "DISABLED", amount: 500 });

    expect(res.status).toBe(400);
    expect(await PromoCodeRedemption.countDocuments({ promoCode: promo._id })).toBe(0);
  });

  it("an expired code is refused (validUntil gate)", async () => {
    const student = await makeUser("student", "expired-gate");
    const promo = await makePromoCode("EXPIRED", {
      validFrom: new Date(Date.now() - 24 * 60 * 60 * 1000),
      validUntil: new Date(Date.now() - 60_000),
    });

    const res = await request(app)
      .post(`/api/v1/promo-codes/redeem`)
      .set("Authorization", `Bearer ${student.token}`)
      .send({ code: "EXPIRED", amount: 500 });

    expect(res.status).toBe(400);
    expect(await PromoCodeRedemption.countDocuments({ promoCode: promo._id })).toBe(0);
  });
});

// Field used in the tests: casting away readonly on _id for the strict
// Types.ObjectId expectation used elsewhere in the suite. Not needed
// here but kept for consistency with the other IDOR files' import pattern.
export type _TypesObjectId = Types.ObjectId;
