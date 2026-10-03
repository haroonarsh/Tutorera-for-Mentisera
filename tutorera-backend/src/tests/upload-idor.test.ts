// src/tests/upload-idor.test.ts
//
// Audit §15 follow-on: upload endpoint authorization. Uploads touch
// sensitive data — avatars rewrite User.avatar, verification docs
// rewrite TutorProfile verification fields and status, blog covers
// require admin role. A bypass on any of these would let the wrong
// user change someone else's profile picture, forge document URLs on
// another tutor's record, or push blog imagery as a non-admin.

import request from "supertest";
import { Types } from "mongoose";
import jwt from "jsonwebtoken";
import app from "../app";
import User from "../models/User.model";
import TutorProfile from "../models/TutorProfile.model";

// Mock Cloudinary so the test never calls out to the real API — the
// IDOR test is about who may invoke the handler, not whether the
// upload transport works.
jest.mock("../utils/uploadToCloudinary", () => ({
  uploadToCloudinary: jest.fn().mockResolvedValue({
    secure_url: "https://cloudinary.test/mock.jpg",
    public_id: "mock_public_id",
  }),
  deleteFromCloudinary: jest.fn().mockResolvedValue(undefined),
  getSignedViewUrl: jest.fn().mockReturnValue("https://cloudinary.test/signed"),
}));

// File-signature verification does a magic-byte sniff on req.file.buffer.
// Our test uploads a tiny Buffer so the sniff would fail; mock to allow.
jest.mock("../middlewares/upload.middleware", () => ({
  ...jest.requireActual("../middlewares/upload.middleware"),
  verifyFileSignature: jest.fn().mockResolvedValue({ valid: true, detectedType: "image/jpeg" }),
}));

function tokenFor(userId: string): string {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET as string, { expiresIn: "1h" });
}

async function makeUser(role: "student" | "tutor" | "admin" | "parent", suffix: string) {
  const user = await User.create({
    name: `${role[0].toUpperCase() + role.slice(1)} ${suffix}`,
    email: `${role}-${suffix}@upload-idor.test`,
    password: "password123",
    role,
    isActive: true,
  });
  return { user, token: tokenFor(user.id) };
}

async function makeTutorProfile(userId: Types.ObjectId, overrides: Record<string, unknown> = {}) {
  return TutorProfile.create({
    user: userId,
    bio: "An honest biography describing teaching background.",
    subjects: ["Mathematics"],
    hourlyRate: 1500,
    teachingMode: "online",
    cnicFront: "https://old-cnic-front.test/orig.jpg",
    cnicFrontPublicId: "orig_cnic_front",
    cnicVerificationStatus: "approved",
    ...overrides,
  });
}

// A tiny JPEG-looking buffer. verifyFileSignature is mocked to accept it,
// so the content doesn't matter — supertest just needs a byte stream.
const FAKE_IMAGE = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);

describe("upload endpoint authorization boundaries", () => {
  it("an unauthenticated request to /upload/avatar is rejected (401)", async () => {
    const res = await request(app)
      .post(`/api/v1/upload/avatar`)
      .attach("avatar", FAKE_IMAGE, "pic.jpg");

    expect(res.status).toBe(401);
  });

  it("avatar upload rewrites the CALLER's User.avatar, never anyone else's", async () => {
    // The handler scopes User.findByIdAndUpdate to req.user._id, so a
    // bypass would require forging req.user — not possible via a plain
    // HTTP body. Positive-control: confirm user A's upload touched A's
    // row and left user B's avatar unchanged.
    const alice = await makeUser("student", "avatar-alice");
    const bob = await makeUser("student", "avatar-bob");
    await User.findByIdAndUpdate(bob.user._id, { avatar: "https://old.test/bob.jpg" });

    const res = await request(app)
      .post(`/api/v1/upload/avatar`)
      .set("Authorization", `Bearer ${alice.token}`)
      .attach("avatar", FAKE_IMAGE, "pic.jpg");

    expect(res.status).toBe(200);

    const aliceAfter = await User.findById(alice.user._id);
    const bobAfter = await User.findById(bob.user._id);
    expect(aliceAfter?.avatar).toBe("https://cloudinary.test/mock.jpg");
    expect(bobAfter?.avatar).toBe("https://old.test/bob.jpg");
  });

  it("a student cannot upload verification docs (role gate → 403)", async () => {
    const student = await makeUser("student", "verif-role");

    const res = await request(app)
      .post(`/api/v1/upload/verification`)
      .set("Authorization", `Bearer ${student.token}`)
      .attach("cnicFront", FAKE_IMAGE, "cnic.jpg");

    expect(res.status).toBe(403);
  });

  it("verification upload rewrites the CALLER's TutorProfile only, never a different tutor's", async () => {
    // Core IDOR invariant: tutor A uploading a replacement cnicFront
    // must only touch TutorProfile where user === A. Tutor B's
    // cnicFront URL + verification status must survive untouched.
    const tutorA = await makeUser("tutor", "verif-A");
    const tutorB = await makeUser("tutor", "verif-B");
    await makeTutorProfile(tutorA.user._id as Types.ObjectId);
    const profileB = await makeTutorProfile(tutorB.user._id as Types.ObjectId, {
      cnicFront: "https://B-untouched.test/cnic.jpg",
      cnicFrontPublicId: "B_cnic_front",
      cnicVerificationStatus: "approved",
    });

    const res = await request(app)
      .post(`/api/v1/upload/verification`)
      .set("Authorization", `Bearer ${tutorA.token}`)
      .attach("cnicFront", FAKE_IMAGE, "cnic-new.jpg");

    expect(res.status).toBe(200);

    // A's record is updated with the mocked Cloudinary URL and status
    // flipped to pending.
    const aAfter = await TutorProfile.findOne({ user: tutorA.user._id });
    expect(aAfter?.cnicFront).toBe("https://cloudinary.test/mock.jpg");
    expect(aAfter?.cnicVerificationStatus).toBe("pending");

    // B's record is identical to seed — verification status still
    // approved, old URL still present.
    const bAfter = await TutorProfile.findById(profileB._id);
    expect(bAfter?.cnicFront).toBe("https://B-untouched.test/cnic.jpg");
    expect(bAfter?.cnicVerificationStatus).toBe("approved");
  });

  it("a non-admin (tutor) cannot upload a blog cover image (role gate → 403)", async () => {
    const tutor = await makeUser("tutor", "blog-role");

    const res = await request(app)
      .post(`/api/v1/upload/blog-cover`)
      .set("Authorization", `Bearer ${tutor.token}`)
      .attach("coverImage", FAKE_IMAGE, "cover.jpg");

    expect(res.status).toBe(403);
  });

  it("a student cannot use the /resubmit alias to touch verification docs (role gate → 403)", async () => {
    // /resubmit is routed through the same handler + verificationFields
    // multer config as /verification, and the audit flagged the alias
    // specifically as a surface worth guarding.
    const student = await makeUser("student", "resubmit-role");

    const res = await request(app)
      .post(`/api/v1/upload/resubmit`)
      .set("Authorization", `Bearer ${student.token}`)
      .attach("cnicFront", FAKE_IMAGE, "cnic.jpg");

    expect(res.status).toBe(403);
  });
});
