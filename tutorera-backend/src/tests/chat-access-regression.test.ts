import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../app";
import User from "../models/User.model";

describe("Chat role access", () => {
  beforeAll(() => { process.env.JWT_SECRET = "test-secret-at-least-16-chars"; });

  it("denies non-student/non-tutor actors before conversation handlers run", async () => {
    const parent = await User.create({
      name: "Chat Parent", email: "chat-role-parent-" + Date.now() + "@example.test",
      password: "password123", role: "parent", isActive: true,
    });
    const token = jwt.sign({ id: parent._id.toString(), role: "parent" }, process.env.JWT_SECRET!);
    const headers = { Authorization: `Bearer ${token}` };
    const list = await request(app).get("/api/v1/chat/conversations").set(headers).expect(403);
    expect(list.body.success).toBe(false);
    const create = await request(app).post("/api/v1/chat/conversation")
      .set(headers).send({ bookingId: "507f1f77bcf86cd799439011" }).expect(403);
    expect(create.body.success).toBe(false);
  });
});
