// src/tests/booking.test.ts
//
// Covers BE-02 (arbitrary booking-state transitions) from the audit report:
// neither the student nor the tutor should be able to set a booking directly
// to "completed" (which unlocks referrals, ratings, and guarantee
// eligibility) — only an admin/system flow should do that. Students may
// only cancel; tutors may start (ongoing) or cancel.

import User from "../models/User.model";
import Booking from "../models/Booking.model";
import { updateBookingStatus } from "../controllers/booking.controller";
import { AuthRequest } from "../types";
import { Response } from "express";

jest.mock("../utils/sendEmail", () => jest.fn().mockResolvedValue(undefined));

function mockResponse(): Response {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

function mockAuthRequest(overrides: Partial<AuthRequest>): AuthRequest {
  return {
    params: {},
    body: {},
    user: undefined,
    ...overrides,
  } as unknown as AuthRequest;
}

async function makeBooking(studentId: any, tutorId: any) {
  return Booking.create({
    student: studentId,
    tutor: tutorId,
    amount: 1000,
    schedule: "Mon 5pm",
    status: "upcoming",
  });
}

describe("BE-02: booking state-transition authorization", () => {
  it("a student cannot mark their own booking as completed", async () => {
    const student = await User.create({ name: "S", email: "s1@test.com", password: "password123", role: "student" });
    const tutor = await User.create({ name: "T", email: "t1@test.com", password: "password123", role: "tutor" });
    const booking = await makeBooking(student._id, tutor._id);

    const req = mockAuthRequest({
      params: { id: booking._id.toString() },
      body: { status: "completed" },
      user: { _id: student._id, role: "student" } as any,
    });
    const res = mockResponse();

    await updateBookingStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    const unchanged = await Booking.findById(booking._id);
    expect(unchanged?.status).toBe("upcoming");
  });

  it("a tutor cannot mark a booking as completed", async () => {
    const student = await User.create({ name: "S2", email: "s2@test.com", password: "password123", role: "student" });
    const tutor = await User.create({ name: "T2", email: "t2@test.com", password: "password123", role: "tutor" });
    const booking = await makeBooking(student._id, tutor._id);

    const req = mockAuthRequest({
      params: { id: booking._id.toString() },
      body: { status: "completed" },
      user: { _id: tutor._id, role: "tutor" } as any,
    });
    const res = mockResponse();

    await updateBookingStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    const unchanged = await Booking.findById(booking._id);
    expect(unchanged?.status).toBe("upcoming");
  });

  it("a student CAN cancel their own upcoming booking", async () => {
    const student = await User.create({ name: "S3", email: "s3@test.com", password: "password123", role: "student" });
    const tutor = await User.create({ name: "T3", email: "t3@test.com", password: "password123", role: "tutor" });
    const booking = await makeBooking(student._id, tutor._id);

    const req = mockAuthRequest({
      params: { id: booking._id.toString() },
      body: { status: "cancelled", cancelReason: "Change of plans" },
      user: { _id: student._id, role: "student" } as any,
    });
    const res = mockResponse();

    await updateBookingStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const updated = await Booking.findById(booking._id);
    expect(updated?.status).toBe("cancelled");
  });

  it("a tutor CAN mark a booking as ongoing, but not a student", async () => {
    const student = await User.create({ name: "S4", email: "s4@test.com", password: "password123", role: "student" });
    const tutor = await User.create({ name: "T4", email: "t4@test.com", password: "password123", role: "tutor" });
    const booking = await makeBooking(student._id, tutor._id);

    // Student attempts "ongoing" — should be rejected.
    const studentReq = mockAuthRequest({
      params: { id: booking._id.toString() },
      body: { status: "ongoing" },
      user: { _id: student._id, role: "student" } as any,
    });
    const studentRes = mockResponse();
    await updateBookingStatus(studentReq, studentRes);
    expect(studentRes.status).toHaveBeenCalledWith(403);

    // Tutor attempts "ongoing" — should succeed.
    const tutorReq = mockAuthRequest({
      params: { id: booking._id.toString() },
      body: { status: "ongoing" },
      user: { _id: tutor._id, role: "tutor" } as any,
    });
    const tutorRes = mockResponse();
    await updateBookingStatus(tutorReq, tutorRes);
    expect(tutorRes.status).toHaveBeenCalledWith(200);

    const updated = await Booking.findById(booking._id);
    expect(updated?.status).toBe("ongoing");
  });

  it("a user with no role on the booking (not participant) is rejected before reaching the status check", async () => {
    const student = await User.create({ name: "S5", email: "s5@test.com", password: "password123", role: "student" });
    const tutor = await User.create({ name: "T5", email: "t5@test.com", password: "password123", role: "tutor" });
    const outsider = await User.create({ name: "Outsider", email: "outsider@test.com", password: "password123", role: "student" });
    const booking = await makeBooking(student._id, tutor._id);

    const req = mockAuthRequest({
      params: { id: booking._id.toString() },
      body: { status: "cancelled" },
      user: { _id: outsider._id, role: "student" } as any,
    });
    const res = mockResponse();

    await updateBookingStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    const unchanged = await Booking.findById(booking._id);
    expect(unchanged?.status).toBe("upcoming");
  });

  it("cannot transition a booking that is already cancelled", async () => {
    const student = await User.create({ name: "S6", email: "s6@test.com", password: "password123", role: "student" });
    const tutor = await User.create({ name: "T6", email: "t6@test.com", password: "password123", role: "tutor" });
    const booking = await Booking.create({
      student: student._id,
      tutor: tutor._id,
      amount: 1000,
      schedule: "Mon 5pm",
      status: "cancelled",
    });

    const req = mockAuthRequest({
      params: { id: booking._id.toString() },
      body: { status: "cancelled" },
      user: { _id: student._id, role: "student" } as any,
    });
    const res = mockResponse();

    await updateBookingStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});