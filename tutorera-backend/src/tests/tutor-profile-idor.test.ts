// src/tests/tutor-profile-idor.test.ts
//
// Audit §15 follow-on: tutor profile IDOR + mass-assignment hardening.
// If a tutor could overwrite another tutor's bio, subjects, rates or
// verification status, the entire marketplace rating/matching surface
// would be compromisable. The protection is two-layer:
//
//   1. Role gate (authorize("tutor")) blocks non-tutors.
//   2. Handler scopes the Mongo update to `user: req.user._id`.
//   3. The Zod tutorProfileSchema is allowlist — any field NOT declared
//      in the schema (isVerified, verificationStatus, user,
//      marketplaceEligible, …) is stripped from req.body before the
//      handler sees it.
//
// This file asserts all three layers hold.

import request from "supertest";
import { Types } from "mongoose";
import jwt from "jsonwebtoken";
import app from "../app";
import User from "../models/User.model";
import TutorProfile from "../models/TutorProfile.model";

function tokenFor(userId: string): string {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET as string, { expiresIn: "1h" });
}

async function makeUser(role: "tutor" | "student", suffix: string) {
  const user = await User.create({
    name: `${role === "tutor" ? "Tutor" : "Student"} ${suffix}`,
    email: `${role}-${suffix}@tutor-profile-idor.test`,
    password: "password123",
    role,
    isActive: true,
  });
  return { user, token: tokenFor(user.id) };
}

async function makeTutorProfile(userId: Types.ObjectId, bio: string) {
  return TutorProfile.create({
    user: userId,
    bio,
    subjects: ["Mathematics"],
    hourlyRate: 1500,
    teachingMode: "online",
    isVerified: false,
    verificationStatus: "pending",
    averageRating: 0,
    totalReviews: 0,
  });
}

describe("tutor profile IDOR + mass-assignment boundaries", () => {
  it("a student cannot update any tutor profile (role gate → 403)", async () => {
    const student = await makeUser("student", "role-check");
    const tutor = await makeUser("tutor", "role-check-target");
    const profile = await makeTutorProfile(tutor.user._id as Types.ObjectId, "Original tutor bio about teaching maths.");

    const res = await request(app)
      .post(`/api/v1/tutors/profile`)
      .set("Authorization", `Bearer ${student.token}`)
      .send({ bio: "Student injection into tutor space." });

    expect(res.status).toBe(403);

    const after = await TutorProfile.findById(profile._id);
    expect(after?.bio).toBe("Original tutor bio about teaching maths.");
  });

  it("tutor A editing their own profile does NOT touch tutor B's profile", async () => {
    const tutorA = await makeUser("tutor", "A-edit");
    const tutorB = await makeUser("tutor", "B-untouched");
    const profileA = await makeTutorProfile(tutorA.user._id as Types.ObjectId, "A original bio for the marketplace.");
    const profileB = await makeTutorProfile(tutorB.user._id as Types.ObjectId, "B original bio for the marketplace.");

    const res = await request(app)
      .post(`/api/v1/tutors/profile`)
      .set("Authorization", `Bearer ${tutorA.token}`)
      .send({ bio: "A updated bio — teaching advanced calculus and physics." });

    expect(res.status).toBe(200);

    const refreshedA = await TutorProfile.findById(profileA._id);
    const refreshedB = await TutorProfile.findById(profileB._id);
    expect(refreshedA?.bio).toBe("A updated bio — teaching advanced calculus and physics.");
    expect(refreshedB?.bio).toBe("B original bio for the marketplace.");
  });

  it("mass-assignment is defended — isVerified / verificationStatus in the body are stripped", async () => {
    // The Zod validator (tutorProfileSchema) is allowlist. Any field it
    // does not declare — isVerified, verificationStatus,
    // marketplaceEligible, averageRating, totalReviews — must never
    // reach the handler, so a tutor cannot self-promote by stuffing
    // those into the update payload.
    const tutor = await makeUser("tutor", "mass-assign");
    const profile = await makeTutorProfile(tutor.user._id as Types.ObjectId, "Honest bio about my teaching background.");

    const res = await request(app)
      .post(`/api/v1/tutors/profile`)
      .set("Authorization", `Bearer ${tutor.token}`)
      .send({
        bio: "Honest bio updated to be a bit longer than before.",
        // Attack payload — none of these are in the tutorProfileSchema
        // allowlist, so the validator strips them.
        isVerified: true,
        verificationStatus: "approved",
        marketplaceEligible: true,
        averageRating: 5,
        totalReviews: 100,
      });

    expect(res.status).toBe(200);

    const after = await TutorProfile.findById(profile._id);
    expect(after?.isVerified).toBe(false);
    expect(after?.verificationStatus).toBe("pending");
    expect(after?.marketplaceEligible).toBeFalsy();
    expect(after?.averageRating).toBe(0);
    expect(after?.totalReviews).toBe(0);
    // Confirm the legitimate field DID land, so the test is actually
    // exercising the write path and not merely a validation reject.
    expect(after?.bio).toBe("Honest bio updated to be a bit longer than before.");
  });

  it("mass-assignment is defended — `user` field in the body is stripped (no profile hijack)", async () => {
    // A tutor stuffing `user: <someoneElseId>` into their update must
    // NOT re-point their own profile's `user` reference to someone
    // else. The validator strips `user` (not in the schema), and even
    // if it leaked through, the handler's own
    // findOneAndUpdate({ user: req.user._id }, ...) filter would still
    // target the caller's row.
    const tutorA = await makeUser("tutor", "hijack-source");
    const tutorB = await makeUser("tutor", "hijack-target");
    const profileA = await makeTutorProfile(tutorA.user._id as Types.ObjectId, "A legit bio for marketplace signup.");

    const res = await request(app)
      .post(`/api/v1/tutors/profile`)
      .set("Authorization", `Bearer ${tutorA.token}`)
      .send({
        bio: "Still my own bio, just updated now.",
        user: (tutorB.user._id as Types.ObjectId).toString(),
      });

    expect(res.status).toBe(200);

    // profileA.user must still point at tutor A, not tutor B.
    const after = await TutorProfile.findById(profileA._id);
    expect(after?.user?.toString()).toBe((tutorA.user._id as Types.ObjectId).toString());
    // And tutor B must not have had a profile created for them by this
    // request either.
    const bProfiles = await TutorProfile.find({ user: tutorB.user._id });
    expect(bProfiles).toHaveLength(0);
  });
});
