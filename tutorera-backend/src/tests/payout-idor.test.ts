// src/tests/payout-idor.test.ts
//
// Audit §15: IDOR regression suite for /api/v1/earnings — direct
// financial boundary. A tutor must only ever see / act on their own
// bookings' payouts; a student must never reach any payout endpoint.
//
// Handlers (earnings.controller.ts) scope all reads/writes with
// `tutor: req.user._id` baked into the Mongo query (findOneAndUpdate
// returns null → 404 on a wrong-tutor booking) and reject non-tutor
// roles with 403 up front.

import request from "supertest";
import { Types } from "mongoose";
import jwt from "jsonwebtoken";
import app from "../app";
import User from "../models/User.model";
import Booking from "../models/Booking.model";

function tokenFor(userId: string): string {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET as string, { expiresIn: "1h" });
}

async function makeUser(role: "student" | "tutor", suffix: string) {
  const user = await User.create({
    name: `${role === "student" ? "Student" : "Tutor"} ${suffix}`,
    email: `${role}-${suffix}@payout-idor.test`,
    password: "password123",
    role,
    isActive: true,
  });
  return { user, token: tokenFor(user.id) };
}

async function makePayableBooking(studentId: Types.ObjectId, tutorId: Types.ObjectId) {
  // The request-payout handler requires status: "completed",
  // paymentStatus: "confirmed", payoutStatus: "pending" and no prior
  // payoutRequestedAt — i.e. a booking that is actually eligible for a
  // fresh payout request.
  return Booking.create({
    student: studentId,
    tutor: tutorId,
    amount: 1000,
    finalAgreedRate: 1000,
    pricingUnit: "hour",
    sessionCount: 1,
    subtotal: 1000,
    studentFee: 0,
    tutorFee: 200,
    tax: 30,
    studentTotal: 1000,
    tutorNet: 770,
    feeConfig: { version: "test" },
    platformFee: 230,
    tutorPayout: 770,
    schedule: "Evening",
    teachingMode: "online",
    status: "completed",
    paymentStatus: "confirmed",
    payoutStatus: "pending",
  });
}

describe("payout IDOR boundaries — /api/v1/earnings", () => {
  it("a student cannot request a payout (403, non-tutor role)", async () => {
    const student = await makeUser("student", "role-check");
    const tutor = await makeUser("tutor", "owner-role-check");
    const booking = await makePayableBooking(
      student.user._id as Types.ObjectId,
      tutor.user._id as Types.ObjectId,
    );

    const res = await request(app)
      .post(`/api/v1/earnings/payouts/${booking.id}/request`)
      .set("Authorization", `Bearer ${student.token}`)
      .send({});

    expect(res.status).toBe(403);

    const after = await Booking.findById(booking._id);
    expect(after?.payoutRequestedAt).toBeFalsy();
  });

  it("a tutor cannot request a payout on another tutor's booking (404, state unchanged)", async () => {
    const student = await makeUser("student", "owner-x");
    const owner = await makeUser("tutor", "owner-cross");
    const attacker = await makeUser("tutor", "attacker-cross");
    const booking = await makePayableBooking(
      student.user._id as Types.ObjectId,
      owner.user._id as Types.ObjectId,
    );

    const res = await request(app)
      .post(`/api/v1/earnings/payouts/${booking.id}/request`)
      .set("Authorization", `Bearer ${attacker.token}`)
      .send({});

    // 404 — the findOneAndUpdate filter { _id, tutor } does not match,
    // so the handler must not reveal that the booking exists.
    expect(res.status).toBe(404);

    const after = await Booking.findById(booking._id);
    expect(after?.payoutRequestedAt).toBeFalsy();
    expect(after?.payoutNote).toBeFalsy();
  });

  it("the real tutor can request their own payout (positive control)", async () => {
    const student = await makeUser("student", "owner-happy-pr");
    const tutor = await makeUser("tutor", "owner-happy-pr");
    const booking = await makePayableBooking(
      student.user._id as Types.ObjectId,
      tutor.user._id as Types.ObjectId,
    );

    const res = await request(app)
      .post(`/api/v1/earnings/payouts/${booking.id}/request`)
      .set("Authorization", `Bearer ${tutor.token}`)
      .send({});

    expect(res.status).toBe(200);

    const after = await Booking.findById(booking._id);
    expect(after?.payoutRequestedAt).toBeTruthy();
  });

  it("getMyPayouts returns only the caller's own bookings — tutor cannot see another tutor's payouts", async () => {
    const student = await makeUser("student", "owner-list");
    const tutorA = await makeUser("tutor", "list-A");
    const tutorB = await makeUser("tutor", "list-B");

    // Each tutor gets their own payable booking.
    await makePayableBooking(
      student.user._id as Types.ObjectId,
      tutorA.user._id as Types.ObjectId,
    );
    const bBooking = await makePayableBooking(
      student.user._id as Types.ObjectId,
      tutorB.user._id as Types.ObjectId,
    );

    const res = await request(app)
      .get(`/api/v1/earnings/payouts`)
      .set("Authorization", `Bearer ${tutorA.token}`);

    expect(res.status).toBe(200);

    const payouts = Array.isArray(res.body.payouts) ? res.body.payouts : [];
    // Tutor A must not see tutor B's booking anywhere in the response.
    const idsReturned = payouts.map((p: { _id: string }) => p._id);
    expect(idsReturned).not.toContain(bBooking.id);
    // And every returned row must be a booking tutor A actually owns.
    for (const payout of payouts) {
      const booking = await Booking.findById(payout._id);
      expect(booking?.tutor.toString()).toBe((tutorA.user._id as Types.ObjectId).toString());
    }
  });

  it("a student cannot read the tutor payout history", async () => {
    const student = await makeUser("student", "list-role-check");

    const res = await request(app)
      .get(`/api/v1/earnings/payouts`)
      .set("Authorization", `Bearer ${student.token}`);

    expect(res.status).toBe(403);
  });
});
