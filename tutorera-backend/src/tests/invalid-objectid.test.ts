// src/tests/invalid-objectid.test.ts
//
// Covers BE-09 (missing centralized validation) from the audit, specifically
// its warning: "Invalid ObjectIds may become 500 responses." This test
// documents the CURRENT behavior on a route that queries by :id without a
// Zod/param validator in front of it — booking.routes' :id param, handled by
// updateBookingStatus. Mongoose throws a CastError for a malformed ObjectId,
// which has no .statusCode, so errorHandler's isKnownOperationalError check
// falls through to the generic 500 path.
//
// This is intentionally written as a KNOWN GAP test (asserting the current,
// undesirable 500) rather than silently expecting 400 — so if/when route
// param validation is added (the audit's suggested fix: a small Zod
// isValidObjectId check as route middleware), this test starts failing and
// tells you to update it to expect 400 instead, rather than the gap staying
// invisible either way.

import request from "supertest";
import app from "../app";
import User from "../models/User.model";

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret-at-least-16-chars";
});

describe("BE-09: malformed ObjectId in route params (documented gap)", () => {
  it("KNOWN GAP: PATCH /bookings/:id/status with a malformed id currently returns 500, not 400", async () => {
    const email = "objectid-test@test.com";
    const password = "password123";
    await User.create({ name: "ObjectId Test", email, password, role: "student" });

    const agent = request.agent(app);
    await agent.post("/api/v1/auth/login").send({ email, password }).expect(200);

    const res = await agent
      .patch("/api/v1/bookings/not-a-valid-object-id/status")
      .send({ status: "cancelled" });

    // Documents today's actual behavior. Once param-level ObjectId
    // validation is added (BE-09's recommended fix), change this
    // expectation to 400 — that will be the sign the fix landed correctly.
    expect(res.status).toBe(500);
  });
});