// src/tests/review-idor.test.ts
//
// Audit §15: IDOR regression suite for the /api/v1/reviews write
// endpoint. Fake-review prevention is a direct product-trust concern —
// if an attacker can post a review for a tutor they never booked, every
// published rating becomes unreliable.
//
// createReview (review.controller.ts) requires a Booking matching the
// posting user, the target tutor, AND status: "completed". The matrix
// below drives each clause of that invariant explicitly, plus the
// duplicate-review guard and a positive control.

import request from "supertest";
import { Types } from "mongoose";
import jwt from "jsonwebtoken";
import app from "../app";
import User from "../models/User.model";
import Booking from "../models/Booking.model";
import Review from "../models/Review.model";
import TutorProfile from "../models/TutorProfile.model";

function tokenFor(userId: string): string {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET as string, { expiresIn: "1h" });
}

async function makeUser(role: "student" | "tutor", suffix: string) {
  const user = await User.create({
    name: `${role === "student" ? "Student" : "Tutor"} ${suffix}`,
    email: `${role}-${suffix}@review-idor.test`,
    password: "password123",
    role,
    isActive: true,
  });
  return { user, token: tokenFor(user.id) };
}

async function makeTutorProfile(tutorUserId: Types.ObjectId) {
  // A minimal TutorProfile so the aggregate-rating update at the end of
  // createReview has a document to target. averageRating / totalReviews
  // start at 0 so a rejected review test can assert they stay at 0.
  return TutorProfile.create({ user: tutorUserId, averageRating: 0, totalReviews: 0 });
}

async function makeBooking(studentId: Types.ObjectId, tutorId: Types.ObjectId, status: "completed" | "upcoming") {
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
    paymentStatus: "received",
    payoutStatus: "pending",
    status,
  });
}

describe("review IDOR boundaries — createReview", () => {
  it("a stranger student with NO booking cannot post a review", async () => {
    const owner = await makeUser("student", "owner-nobook");
    const tutor = await makeUser("tutor", "t-nobook");
    const attacker = await makeUser("student", "attacker-nobook");
    await makeTutorProfile(tutor.user._id as Types.ObjectId);
    // Legitimate booking by owner so a bookingId can be guessed/leaked.
    const booking = await makeBooking(
      owner.user._id as Types.ObjectId,
      tutor.user._id as Types.ObjectId,
      "completed",
    );

    const res = await request(app)
      .post(`/api/v1/reviews/${tutor.user.id}`)
      .set("Authorization", `Bearer ${attacker.token}`)
      .send({ rating: 5, comment: "Fake praise", bookingId: booking.id });

    expect(res.status).toBe(400);

    const reviewCount = await Review.countDocuments({ tutor: tutor.user._id });
    expect(reviewCount).toBe(0);
    const profile = await TutorProfile.findOne({ user: tutor.user._id });
    expect(profile?.averageRating).toBe(0);
    expect(profile?.totalReviews).toBe(0);
  });

  it("a student cannot review before the booking is completed", async () => {
    const owner = await makeUser("student", "owner-upcoming");
    const tutor = await makeUser("tutor", "t-upcoming");
    await makeTutorProfile(tutor.user._id as Types.ObjectId);
    const booking = await makeBooking(
      owner.user._id as Types.ObjectId,
      tutor.user._id as Types.ObjectId,
      "upcoming",
    );

    const res = await request(app)
      .post(`/api/v1/reviews/${tutor.user.id}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ rating: 5, comment: "Jumping the gun", bookingId: booking.id });

    expect(res.status).toBe(400);

    expect(await Review.countDocuments({ tutor: tutor.user._id })).toBe(0);
  });

  it("a student with a booking for tutor A cannot submit a review on tutor B using that bookingId", async () => {
    const owner = await makeUser("student", "owner-crosstutor");
    const tutorA = await makeUser("tutor", "t-A");
    const tutorB = await makeUser("tutor", "t-B");
    await makeTutorProfile(tutorA.user._id as Types.ObjectId);
    await makeTutorProfile(tutorB.user._id as Types.ObjectId);
    const booking = await makeBooking(
      owner.user._id as Types.ObjectId,
      tutorA.user._id as Types.ObjectId,
      "completed",
    );

    const res = await request(app)
      .post(`/api/v1/reviews/${tutorB.user.id}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ rating: 1, comment: "Cross-tutor smear", bookingId: booking.id });

    expect(res.status).toBe(400);

    expect(await Review.countDocuments({ tutor: tutorB.user._id })).toBe(0);
    const profileB = await TutorProfile.findOne({ user: tutorB.user._id });
    expect(profileB?.averageRating).toBe(0);
    expect(profileB?.totalReviews).toBe(0);
  });

  it("a second review on the same booking is rejected", async () => {
    const owner = await makeUser("student", "owner-dup");
    const tutor = await makeUser("tutor", "t-dup");
    await makeTutorProfile(tutor.user._id as Types.ObjectId);
    const booking = await makeBooking(
      owner.user._id as Types.ObjectId,
      tutor.user._id as Types.ObjectId,
      "completed",
    );

    const first = await request(app)
      .post(`/api/v1/reviews/${tutor.user.id}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ rating: 5, comment: "First review", bookingId: booking.id });
    expect(first.status).toBe(201);

    const second = await request(app)
      .post(`/api/v1/reviews/${tutor.user.id}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ rating: 1, comment: "Rage edit", bookingId: booking.id });

    expect(second.status).toBe(400);
    expect(await Review.countDocuments({ booking: booking._id })).toBe(1);
  });

  it("the real student can post one review on a completed booking (positive control)", async () => {
    const owner = await makeUser("student", "owner-ok");
    const tutor = await makeUser("tutor", "t-ok");
    await makeTutorProfile(tutor.user._id as Types.ObjectId);
    const booking = await makeBooking(
      owner.user._id as Types.ObjectId,
      tutor.user._id as Types.ObjectId,
      "completed",
    );

    const res = await request(app)
      .post(`/api/v1/reviews/${tutor.user.id}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ rating: 4, comment: "Clear teaching style", bookingId: booking.id });

    expect(res.status).toBe(201);

    expect(await Review.countDocuments({ tutor: tutor.user._id })).toBe(1);
    const profile = await TutorProfile.findOne({ user: tutor.user._id });
    expect(profile?.averageRating).toBe(4);
    expect(profile?.totalReviews).toBe(1);
  });
});
