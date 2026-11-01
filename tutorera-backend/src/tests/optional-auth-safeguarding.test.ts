import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import User from "../models/User.model";
import { optionalAuth } from "../middlewares/auth.middleware";

beforeAll(() => { process.env.JWT_SECRET = "test-secret-at-least-16-chars"; });
let sequence = 0;

const probe = express();
probe.get("/public/discovery", optionalAuth, (req: any, res) => {
  res.json({ authenticated: !!req.user, role: req.user?.role ?? null });
});

async function account(role: "student" | "parent" | "pending", isMinor = false, approved = false) {
  const user = await User.create({
    name: "Visibility Probe", email: `optional-guardian-${Date.now()}-${++sequence}@example.test`,
    password: "password123", role, isMinor, parentConsentVerified: approved,
  });
  const token = jwt.sign({ id: user._id.toString(), role }, process.env.JWT_SECRET as string, { expiresIn: "1h" });
  return { user, token };
}

describe("Phase 5 — optional authentication must not bypass safeguarding", () => {
  it("treats an unapproved minor JWT as anonymous on optional-auth public routes", async () => {
    const { token } = await account("student", true, false);
    const response = await request(probe).get("/public/discovery").set("Authorization", `Bearer ${token}`).expect(200);
    expect(response.body).toEqual({ authenticated: false, role: null });
  });

  it("treats unselected Google role JWT as anonymous on optional-auth public routes", async () => {
    const { token } = await account("pending");
    const response = await request(probe).get("/public/discovery").set("Authorization", `Bearer ${token}`).expect(200);
    expect(response.body).toEqual({ authenticated: false, role: null });
  });

  it("keeps verified supervised students and adult parents authenticated where appropriate", async () => {
    const verified = await account("student", true, true);
    const parent = await account("parent");
    for (const { token, role } of [
      { token: verified.token, role: "student" },
      { token: parent.token, role: "parent" },
    ]) {
      const response = await request(probe).get("/public/discovery").set("Authorization", `Bearer ${token}`).expect(200);
      expect(response.body).toEqual({ authenticated: true, role });
    }
  });

  it("rechecks the database for each optional-auth request after guardian revocation", async () => {
    const { user, token } = await account("student", true, true);
    const first = await request(probe).get("/public/discovery").set("Authorization", `Bearer ${token}`).expect(200);
    expect(first.body.authenticated).toBe(true);
    await User.updateOne({ _id: user._id }, { $set: { parentConsentVerified: false } });
    const after = await request(probe).get("/public/discovery").set("Authorization", `Bearer ${token}`).expect(200);
    expect(after.body.authenticated).toBe(false);
  });
});
