// src/tests/bid-concurrency.test.ts
//
// Covers scenario #3 from the audit's minimum backend test suite: two
// concurrent bid-accept requests must never both win. This is what BE-07's
// fix (atomic findOneAndUpdate({status:"open"}) guard inside a Mongo
// transaction) is supposed to guarantee — this test actually fires both
// requests at once instead of trusting the code reads correctly.
//
// Offer acceptance is now a two-phase, payment-gated flow (see
// request.controller.ts): acceptBid/initiateAcceptBid only reserves the
// request/bid (moving them to "awaiting_payment"/"payment_pending") and
// returns a payment checkout URL - the same atomic guard BE-07 added, just
// one step earlier than when this test was first written. The Booking
// itself is only created by finalizeBidAcceptance(), called once the
// payment gateway's webhook confirms payment - so these tests assert the
// race is won by only one side at the reservation step, then finalize the
// winner to confirm exactly one booking results end to end.

import User from "../models/User.model";
import Request from "../models/Request.model";
import Bid from "../models/Bid.model";
import Booking from "../models/Booking.model";
import { acceptBid, finalizeBidAcceptance } from "../controllers/request.controller";
import { AuthRequest } from "../types";
import { Response } from "express";

jest.mock("../utils/socket", () => ({
  sendNotification: jest.fn().mockResolvedValue(undefined),
}));
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
    app: { get: () => ({ to: () => ({ emit: jest.fn() }) }) },
    ...overrides,
  } as unknown as AuthRequest;
}

describe("BE-07: concurrent bid acceptance is race-safe", () => {
  it("firing two simultaneous accept calls on the same bid creates exactly one booking", async () => {
    const student = await User.create({ name: "Student", email: "race-student@test.com", password: "password123", role: "student" });
    const tutor = await User.create({ name: "Tutor", email: "race-tutor@test.com", password: "password123", role: "tutor" });

    const requestDoc = await Request.create({
      student: student._id,
      subject: "Math",
      level: "Matric",
      description: "Need help",
      budget: 1000,
      schedule: "Evenings",
      status: "open",
    });
    const bid = await Bid.create({
      request: requestDoc._id,
      tutor: tutor._id,
      amount: 1000,
      initialStudentRate: 1000,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      message: "I can help",
    });

    const makeReq = () =>
      mockAuthRequest({
        params: { id: requestDoc._id.toString(), bidId: bid._id.toString() },
        user: { _id: student._id } as any,
      });

    const res1 = mockResponse();
    const res2 = mockResponse();

    // Fire both "simultaneously" — no await between them — so both requests
    // race to read the request's "open" status before either commits.
    await Promise.all([acceptBid(makeReq(), res1), acceptBid(makeReq(), res2)]);

    const statusCalls = [
      (res1.status as jest.Mock).mock.calls[0]?.[0],
      (res2.status as jest.Mock).mock.calls[0]?.[0],
    ];

    // Exactly one of the two must have succeeded (200); the other must have
    // been rejected as a conflict (409) or bad request — never both 200.
    const successCount = statusCalls.filter((code) => code === 200).length;
    expect(successCount).toBe(1);

    // No matter how the two requests raced, the reservation guard must have
    // let exactly one through to "payment_pending"/"awaiting_payment".
    const reservedBid = await Bid.findById(bid._id);
    expect(reservedBid?.status).toBe("payment_pending");
    const reservedRequest = await Request.findById(requestDoc._id);
    expect(reservedRequest?.status).toBe("awaiting_payment");

    // Completing payment (the webhook) must then produce exactly one booking.
    await finalizeBidAcceptance(bid._id.toString(), { to: () => ({ emit: jest.fn() }) });
    const bookings = await Booking.find({ request: requestDoc._id });
    expect(bookings.length).toBe(1);

    // And the request must have ended up closed, not stuck open or double-processed.
    const finalRequest = await Request.findById(requestDoc._id);
    expect(finalRequest?.status).toBe("closed");
  });

  it("firing two concurrent accept calls for two DIFFERENT bids on the same request also results in only one booking", async () => {
    // A second, related race: two different tutors' bids on the SAME
    // request both get accepted "at once" (e.g. two browser tabs, or a
    // double-click). Only one bid should end up accepted; the request can
    // only close once.
    const student = await User.create({ name: "Student2", email: "race-student2@test.com", password: "password123", role: "student" });
    const tutorA = await User.create({ name: "TutorA", email: "race-tutorA@test.com", password: "password123", role: "tutor" });
    const tutorB = await User.create({ name: "TutorB", email: "race-tutorB@test.com", password: "password123", role: "tutor" });

    const requestDoc = await Request.create({
      student: student._id,
      subject: "Physics",
      level: "Matric",
      description: "Need help",
      budget: 1500,
      schedule: "Mornings",
      status: "open",
    });
    const bidExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const bidA = await Bid.create({ request: requestDoc._id, tutor: tutorA._id, amount: 1500, initialStudentRate: 1500, expiresAt: bidExpiry, message: "A" });
    const bidB = await Bid.create({ request: requestDoc._id, tutor: tutorB._id, amount: 1400, initialStudentRate: 1400, expiresAt: bidExpiry, message: "B" });

    const reqA = mockAuthRequest({
      params: { id: requestDoc._id.toString(), bidId: bidA._id.toString() },
      user: { _id: student._id } as any,
    });
    const reqB = mockAuthRequest({
      params: { id: requestDoc._id.toString(), bidId: bidB._id.toString() },
      user: { _id: student._id } as any,
    });

    const resA = mockResponse();
    const resB = mockResponse();

    await Promise.all([acceptBid(reqA, resA), acceptBid(reqB, resB)]);

    // Exactly one bid must have won the reservation race.
    const reservedBids = await Bid.find({ request: requestDoc._id, status: "payment_pending" });
    expect(reservedBids.length).toBe(1);
    const winningBid = reservedBids[0];

    // The loser must be untouched (still its original "submitted" status) -
    // it never made it past the atomic guard.
    const loserBid = await Bid.findOne({ request: requestDoc._id, _id: { $ne: winningBid._id } });
    expect(loserBid?.status).toBe("submitted");

    // Completing payment for the winner must produce exactly one booking and
    // finally mark the loser "not_selected".
    await finalizeBidAcceptance(winningBid._id.toString(), { to: () => ({ emit: jest.fn() }) });
    const bookings = await Booking.find({ request: requestDoc._id });
    expect(bookings.length).toBe(1);

    const acceptedBids = await Bid.find({ request: requestDoc._id, status: "accepted" });
    expect(acceptedBids.length).toBe(1);
    const finalLoserBid = await Bid.findById(loserBid?._id);
    expect(finalLoserBid?.status).toBe("not_selected");
  });
});
