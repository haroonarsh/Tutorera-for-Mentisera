// src/tests/refund-idor.test.ts
//
// Audit §15 follow-on: refund-request IDOR. A refund is a direct
// financial reversal — if a stranger or the opposing party could file
// one, they could cause the platform to pay money back to the wrong
// account or lock a legitimate booking's funds.
//
// submitRefundRequest (refundRequest.controller.ts) scopes the booking
// lookup to the booking's student OR parent, requires a paid-through
// paymentStatus, and rejects a second refund on the same booking.

import request from "supertest";
import { Types } from "mongoose";
import jwt from "jsonwebtoken";
import app from "../app";
import User from "../models/User.model";
import Booking from "../models/Booking.model";
import RefundRequest from "../models/RefundRequest.model";

function tokenFor(userId: string): string {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET as string, { expiresIn: "1h" });
}

async function makeUser(role: "student" | "parent" | "tutor", suffix: string) {
  const user = await User.create({
    name: `${role[0].toUpperCase() + role.slice(1)} ${suffix}`,
    email: `${role}-${suffix}@refund-idor.test`,
    password: "password123",
    role,
    isActive: true,
  });
  return { user, token: tokenFor(user.id) };
}

async function makeRefundableBooking(studentId: Types.ObjectId, tutorId: Types.ObjectId, parentId?: Types.ObjectId) {
  // paymentStatus must be "confirmed" or "received" for the handler to
  // consider the booking refund-eligible.
  return Booking.create({
    student: studentId,
    tutor: tutorId,
    parent: parentId,
    amount: 1000,
    finalAgreedRate: 1000,
    pricingUnit: "hour",
    sessionCount: 1,
    subtotal: 1000,
    studentFee: 0,
    tutorFee: 200,
    tax: 30,
    studentTotal: 1030,
    tutorNet: 770,
    feeConfig: { version: "test" },
    platformFee: 230,
    tutorPayout: 770,
    schedule: "Evening",
    teachingMode: "online",
    status: "cancelled",
    paymentStatus: "confirmed",
    payoutStatus: "pending",
  });
}

describe("refund-request IDOR boundaries — /api/v1/bookings/:id/refund-request", () => {
  it("a stranger student cannot file a refund on someone else's booking (404, no refund created)", async () => {
    const owner = await makeUser("student", "owner-stranger");
    const tutor = await makeUser("tutor", "tutor-stranger");
    const attacker = await makeUser("student", "attacker-stranger");
    const booking = await makeRefundableBooking(
      owner.user._id as Types.ObjectId,
      tutor.user._id as Types.ObjectId,
    );

    const res = await request(app)
      .post(`/api/v1/bookings/${booking.id}/refund-request`)
      .set("Authorization", `Bearer ${attacker.token}`)
      .send({ reason: "quality_issue", details: "forged refund" });

    expect(res.status).toBe(404);
    expect(await RefundRequest.countDocuments({ booking: booking._id })).toBe(0);
  });

  it("the TUTOR cannot file a refund on their own booking (not in the OR filter → 404)", async () => {
    // The handler intentionally restricts refund initiation to the
    // paying side (student or parent). A tutor trying to refund
    // themselves — e.g. to escape a payment hold — must be refused.
    const owner = await makeUser("student", "owner-tutor-refund");
    const tutor = await makeUser("tutor", "tutor-filing-refund");
    const booking = await makeRefundableBooking(
      owner.user._id as Types.ObjectId,
      tutor.user._id as Types.ObjectId,
    );

    const res = await request(app)
      .post(`/api/v1/bookings/${booking.id}/refund-request`)
      .set("Authorization", `Bearer ${tutor.token}`)
      .send({ reason: "other" });

    expect(res.status).toBe(404);
    expect(await RefundRequest.countDocuments({ booking: booking._id })).toBe(0);
  });

  it("a refund cannot be filed on a booking that was never paid for (payment gate)", async () => {
    const owner = await makeUser("student", "owner-unpaid");
    const tutor = await makeUser("tutor", "tutor-unpaid");
    const booking = await Booking.create({
      student: owner.user._id,
      tutor: tutor.user._id,
      amount: 1000,
      finalAgreedRate: 1000,
      pricingUnit: "hour",
      sessionCount: 1,
      subtotal: 1000,
      studentFee: 0,
      tutorFee: 200,
      tax: 30,
      studentTotal: 1030,
      tutorNet: 770,
      feeConfig: { version: "test" },
      platformFee: 230,
      tutorPayout: 770,
      schedule: "Evening",
      teachingMode: "online",
      status: "upcoming",
      paymentStatus: "pending",
      payoutStatus: "pending",
    });

    const res = await request(app)
      .post(`/api/v1/bookings/${booking.id}/refund-request`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ reason: "other" });

    expect(res.status).toBe(404);
    expect(await RefundRequest.countDocuments({ booking: booking._id })).toBe(0);
  });

  it("a second refund request on the same booking is rejected (409)", async () => {
    const owner = await makeUser("student", "owner-dup-refund");
    const tutor = await makeUser("tutor", "tutor-dup-refund");
    const booking = await makeRefundableBooking(
      owner.user._id as Types.ObjectId,
      tutor.user._id as Types.ObjectId,
    );

    const first = await request(app)
      .post(`/api/v1/bookings/${booking.id}/refund-request`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ reason: "quality_issue" });
    expect(first.status).toBe(201);

    const second = await request(app)
      .post(`/api/v1/bookings/${booking.id}/refund-request`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ reason: "duplicate_charge" });

    expect(second.status).toBe(409);
    expect(await RefundRequest.countDocuments({ booking: booking._id })).toBe(1);
  });

  it("the real student can file one refund (positive control)", async () => {
    const owner = await makeUser("student", "owner-ok-refund");
    const tutor = await makeUser("tutor", "tutor-ok-refund");
    const booking = await makeRefundableBooking(
      owner.user._id as Types.ObjectId,
      tutor.user._id as Types.ObjectId,
    );

    const res = await request(app)
      .post(`/api/v1/bookings/${booking.id}/refund-request`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ reason: "quality_issue", details: "The tutor did not show up." });

    expect(res.status).toBe(201);

    const refund = await RefundRequest.findOne({ booking: booking._id });
    expect(refund).toBeTruthy();
    expect(refund?.student.toString()).toBe((owner.user._id as Types.ObjectId).toString());
  });

  it("the linked parent CAN file a refund on their child's booking (positive control)", async () => {
    // Parent accounts can pay for a child's booking and so must also
    // be able to initiate the refund. The $or filter in the handler
    // includes `parent: req.user._id`.
    const student = await makeUser("student", "child-refund");
    const parent = await makeUser("parent", "guardian-refund");
    const tutor = await makeUser("tutor", "t-parent-refund");
    const booking = await makeRefundableBooking(
      student.user._id as Types.ObjectId,
      tutor.user._id as Types.ObjectId,
      parent.user._id as Types.ObjectId,
    );

    const res = await request(app)
      .post(`/api/v1/bookings/${booking.id}/refund-request`)
      .set("Authorization", `Bearer ${parent.token}`)
      .send({ reason: "scheduling_conflict" });

    expect(res.status).toBe(201);
    expect(await RefundRequest.countDocuments({ booking: booking._id })).toBe(1);
  });
});
