// src/tests/request-idor.test.ts
//
// Audit §15 / IDOR gap: the forensic audit explicitly called out that
// request, offer, chat, payout, review, and admin country-scoped routes
// have no systematic IDOR regression suite. This file closes that gap
// for the three student-mutation endpoints on /api/v1/requests —
// cancel, extend, and close. Each handler currently scopes its lookup
// with { _id, student: req.user._id }, so a different student's request
// returns 404 and no state change occurs. A regression (e.g. a refactor
// that drops the `student` filter) would make this test fail loudly.
//
// Pattern worth copying for the remaining IDOR surfaces named in the
// audit — write the equivalent "stranger attempts mutation; expect 404
// and no state change" test for each.

import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../app";
import User from "../models/User.model";
import TuitionRequest from "../models/Request.model";

function tokenFor(userId: string): string {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET as string, { expiresIn: "1h" });
}

async function makeStudent(suffix: string) {
  const user = await User.create({
    name: `Student ${suffix}`,
    email: `student-${suffix}@idor-test.com`,
    password: "password123",
    role: "student",
    isActive: true,
  });
  return { user, token: tokenFor(user.id) };
}

async function makeOpenRequest(ownerId: unknown) {
  return TuitionRequest.create({
    student: ownerId,
    subject: "Mathematics",
    level: "O-Level (Cambridge / Edexcel)",
    description: "Looking for help with algebra and past-paper practice.",
    budget: 15000,
    pricingUnit: "month",
    currency: "PKR",
    teachingMode: "online",
    schedule: "Mon–Thu, 6 PM",
    status: "open",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
}

describe("request IDOR boundaries — student mutation endpoints", () => {
  it("another student cannot cancel someone else's request", async () => {
    const owner = await makeStudent("owner-cancel");
    const attacker = await makeStudent("attacker-cancel");
    const target = await makeOpenRequest(owner.user._id);

    const res = await request(app)
      .patch(`/api/v1/requests/${target.id}/cancel`)
      .set("Authorization", `Bearer ${attacker.token}`)
      .send({ reason: "testing idor" });

    // 404 (not 403) — the handler must not reveal that the request
    // exists under someone else's account.
    expect(res.status).toBe(404);

    const after = await TuitionRequest.findById(target._id);
    expect(after?.status).toBe("open");
  });

  it("another student cannot extend someone else's request", async () => {
    const owner = await makeStudent("owner-extend");
    const attacker = await makeStudent("attacker-extend");
    const target = await makeOpenRequest(owner.user._id);
    const originalExpiry = target.expiresAt?.getTime();

    const res = await request(app)
      .post(`/api/v1/requests/${target.id}/extend`)
      .set("Authorization", `Bearer ${attacker.token}`)
      .send({});

    expect(res.status).toBe(404);

    const after = await TuitionRequest.findById(target._id);
    expect(after?.expiresAt?.getTime()).toBe(originalExpiry);
    expect(after?.status).toBe("open");
  });

  it("another student cannot close someone else's request", async () => {
    const owner = await makeStudent("owner-close");
    const attacker = await makeStudent("attacker-close");
    const target = await makeOpenRequest(owner.user._id);

    const res = await request(app)
      .patch(`/api/v1/requests/${target.id}/close`)
      .set("Authorization", `Bearer ${attacker.token}`)
      .send({});

    expect(res.status).toBe(404);

    const after = await TuitionRequest.findById(target._id);
    expect(after?.status).toBe("open");
  });

  it("the owner can still cancel their own request (positive control)", async () => {
    const owner = await makeStudent("owner-happy");
    const target = await makeOpenRequest(owner.user._id);

    const res = await request(app)
      .patch(`/api/v1/requests/${target.id}/cancel`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ reason: "no longer needed" });

    expect(res.status).toBe(200);

    const after = await TuitionRequest.findById(target._id);
    expect(after?.status).toBe("cancelled");
  });
});
