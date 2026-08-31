// src/tests/auth.test.ts
//
// Covers FE/BE-01 (logout does not terminate the session) from the audit
// report. Uses supertest against the real app (src/app.ts) so the full
// stack — routes, middleware, cookie handling — is exercised exactly as
// production would run it.

import request from "supertest";
import app from "../app";
import User from "../models/User.model";

jest.mock("../utils/sendEmail", () => jest.fn().mockResolvedValue(undefined));

// generateToken/sendTokenResponse need JWT_SECRET — tests run without a real
// .env, so set one directly for this suite.
beforeAll(() => {
  process.env.JWT_SECRET = "test-secret-at-least-16-chars";
});

describe("FE/BE-01: logout session invalidation", () => {
  const email = "logout-test@test.com";
  const password = "password123";

  async function registerAndLoginAgent() {
    await User.create({ name: "Logout Test", email, password, role: "student" });

    const agent = request.agent(app);
    const loginRes = await agent
      .post("/api/v1/auth/login")
      .send({ email, password })
      .expect(200);

    return { agent, token: loginRes.body.token as string };
  }

  it("logged-in user can access /auth/me via the session cookie", async () => {
    const { agent } = await registerAndLoginAgent();

    const res = await agent.get("/api/v1/auth/me").expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(email);
  });

  it("after logout, the same cookie-based agent can no longer access /auth/me", async () => {
    const { agent } = await registerAndLoginAgent();

    await agent.get("/api/v1/auth/me").expect(200);

    await agent.post("/api/v1/auth/logout").expect(200);

    // The agent automatically sends whatever cookie the server just set on
    // logout — this proves the cleared cookie no longer authenticates.
    await agent.get("/api/v1/auth/me").expect(401);
  });

  // ── Known gap, documented rather than silently missed ──────────────────
  // protect() checks the Authorization: Bearer header BEFORE falling back to
  // the cookie. logout() only clears the cookie — it does not (and, with
  // stateless JWTs and no server-side blacklist, currently CANNOT) invalidate
  // a bearer token that was already issued. So a client that saved the token
  // from the login response (e.g. in localStorage, as the frontend currently
  // does per FE-02) stays authenticated via that token for its full 7-day
  // life, even after calling /auth/logout.
  //
  // This test intentionally asserts the CURRENT (concerning) behavior so a
  // future fix shows up here as a passing improvement, not a silent gap.
  // Fixing this for real requires either a server-side token blacklist/short
  // token lifetime with refresh tokens, or moving to cookie-only auth (the
  // single-strategy fix the audit recommended under FE-02).
  it("KNOWN GAP: a bearer token issued before logout still authenticates after logout", async () => {
    const { agent, token } = await registerAndLoginAgent();

    await agent.post("/api/v1/auth/logout").expect(200);

    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${token}`)
      .expect(200); // documents the gap — this SHOULD be 401 once FE-02 is resolved

    expect(res.body.user.email).toBe(email);
  });

  it("a suspended user is rejected even with a previously valid cookie", async () => {
    const { agent } = await registerAndLoginAgent();
    await agent.get("/api/v1/auth/me").expect(200);

    await User.findOneAndUpdate({ email }, { isActive: false });

    await agent.get("/api/v1/auth/me").expect(403);
  });
});