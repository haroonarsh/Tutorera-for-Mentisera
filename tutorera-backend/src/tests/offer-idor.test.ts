// src/tests/offer-idor.test.ts
//
// Audit §15: IDOR regression suite for the /api/v1/offers mutation
// endpoints. Each handler must refuse access to any user who isn't the
// request-owning student (for student-only actions), the offer-owning
// tutor (for tutor-only actions), or either party (for shared actions
// like decline).
//
// Positive controls are included so an over-tightening regression (e.g.
// a change that blocks the legitimate owner alongside everyone else)
// also fails the suite.

import request from "supertest";
import { Types } from "mongoose";
import jwt from "jsonwebtoken";
import app from "../app";
import User from "../models/User.model";
import TuitionRequest from "../models/Request.model";
import Bid from "../models/Bid.model";

function tokenFor(userId: string): string {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET as string, { expiresIn: "1h" });
}

async function makeUser(role: "student" | "tutor", suffix: string) {
  const user = await User.create({
    name: `${role === "student" ? "Student" : "Tutor"} ${suffix}`,
    email: `${role}-${suffix}@offer-idor.test`,
    password: "password123",
    role,
    isActive: true,
  });
  return { user, token: tokenFor(user.id) };
}

async function makeRequest(ownerId: Types.ObjectId) {
  return TuitionRequest.create({
    student: ownerId,
    subject: "Mathematics",
    level: "O-Level (Cambridge / Edexcel)",
    description: "Needs tutor for algebra and past-paper practice.",
    budget: 15000,
    pricingUnit: "month",
    currency: "PKR",
    teachingMode: "online",
    schedule: "Mon–Thu, 6 PM",
    status: "open",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
}

async function makeBid(requestId: Types.ObjectId, tutorId: Types.ObjectId, overrides: Record<string, unknown> = {}) {
  return Bid.create({
    request: requestId,
    tutor: tutorId,
    amount: 15000,
    initialStudentRate: 15000,
    currency: "PKR",
    message: "Happy to teach — can start Monday.",
    status: "submitted",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    ...overrides,
  });
}

describe("offer IDOR boundaries — mutation endpoints", () => {
  it("a stranger student cannot shortlist someone else's offer (403, unchanged)", async () => {
    const owner = await makeUser("student", "owner-shortlist");
    const tutor = await makeUser("tutor", "t-shortlist");
    const attacker = await makeUser("student", "attacker-shortlist");
    const target = await makeRequest(owner.user._id as Types.ObjectId);
    const offer = await makeBid(target._id as Types.ObjectId, tutor.user._id as Types.ObjectId);

    const res = await request(app)
      .post(`/api/v1/offers/${offer.id}/shortlist`)
      .set("Authorization", `Bearer ${attacker.token}`)
      .send({});

    expect(res.status).toBe(403);

    const after = await Bid.findById(offer._id);
    expect(after?.shortlistedAt).toBeFalsy();
  });

  it("the request owner can shortlist their own offer (positive control)", async () => {
    const owner = await makeUser("student", "owner-shortlist-ok");
    const tutor = await makeUser("tutor", "t-shortlist-ok");
    const target = await makeRequest(owner.user._id as Types.ObjectId);
    const offer = await makeBid(target._id as Types.ObjectId, tutor.user._id as Types.ObjectId);

    const res = await request(app)
      .post(`/api/v1/offers/${offer.id}/shortlist`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.shortlisted).toBe(true);

    const after = await Bid.findById(offer._id);
    expect(after?.shortlistedAt).toBeTruthy();
  });

  it("a stranger student cannot mark someone else's offer as viewed", async () => {
    const owner = await makeUser("student", "owner-view");
    const tutor = await makeUser("tutor", "t-view");
    const attacker = await makeUser("student", "attacker-view");
    const target = await makeRequest(owner.user._id as Types.ObjectId);
    const offer = await makeBid(target._id as Types.ObjectId, tutor.user._id as Types.ObjectId);

    const res = await request(app)
      .post(`/api/v1/offers/${offer.id}/view`)
      .set("Authorization", `Bearer ${attacker.token}`)
      .send({});

    expect(res.status).toBe(403);

    const after = await Bid.findById(offer._id);
    expect(after?.status).toBe("submitted");
    expect(after?.viewedAt).toBeFalsy();
  });

  it("a stranger cannot decline an offer they are not party to", async () => {
    const owner = await makeUser("student", "owner-decline");
    const tutor = await makeUser("tutor", "t-decline");
    const stranger = await makeUser("student", "stranger-decline");
    const target = await makeRequest(owner.user._id as Types.ObjectId);
    const offer = await makeBid(target._id as Types.ObjectId, tutor.user._id as Types.ObjectId);

    const res = await request(app)
      .post(`/api/v1/offers/${offer.id}/decline`)
      .set("Authorization", `Bearer ${stranger.token}`)
      .send({});

    expect(res.status).toBe(403);

    const after = await Bid.findById(offer._id);
    expect(after?.status).toBe("submitted");
  });

  it("a stranger tutor cannot renew another tutor's offer (404 — findOne scoped)", async () => {
    const owner = await makeUser("student", "owner-renew");
    const tutor = await makeUser("tutor", "t-renew");
    const attackerTutor = await makeUser("tutor", "attacker-renew");
    const target = await makeRequest(owner.user._id as Types.ObjectId);
    const offer = await makeBid(target._id as Types.ObjectId, tutor.user._id as Types.ObjectId, {
      status: "expired",
      expiresAt: new Date(Date.now() - 60 * 1000),
    });

    const res = await request(app)
      .post(`/api/v1/offers/${offer.id}/renew`)
      .set("Authorization", `Bearer ${attackerTutor.token}`)
      .send({ amount: 15000, message: "Renewing" });

    // 404 (not 403) — the handler must not reveal the offer exists under
    // a different tutor's account.
    expect(res.status).toBe(404);

    const after = await Bid.findById(offer._id);
    expect(after?.status).toBe("expired");
    expect(after?.renewalCount || 0).toBe(0);
  });

  it("a stranger cannot accept an offer that isn't theirs — financial boundary", async () => {
    const owner = await makeUser("student", "owner-accept");
    const tutor = await makeUser("tutor", "t-accept");
    const attacker = await makeUser("student", "attacker-accept");
    const target = await makeRequest(owner.user._id as Types.ObjectId);
    const offer = await makeBid(target._id as Types.ObjectId, tutor.user._id as Types.ObjectId);

    const res = await request(app)
      .post(`/api/v1/offers/${offer.id}/accept`)
      .set("Authorization", `Bearer ${attacker.token}`)
      .send({});

    // Status may be 403 (not a party) or 409 (market/state) depending on
    // ordering — either way, acceptance must not succeed and the offer
    // must stay unaccepted.
    expect([403, 409]).toContain(res.status);

    const after = await Bid.findById(offer._id);
    expect(after?.status).not.toBe("accepted");
    expect(after?.status).not.toBe("payment_pending");
  });
});
