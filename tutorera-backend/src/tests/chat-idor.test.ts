// src/tests/chat-idor.test.ts
//
// Audit §15: IDOR regression suite for the /api/v1/chat endpoints.
// Chat message bodies routinely carry PII (names, areas, scheduling
// details, exam context), so an authorization bypass here is a direct
// privacy exposure, not just a data-integrity issue.
//
// Handlers (chat.controller.ts) scope on
//   conversation.student.toString() === userId || conversation.tutor === userId
// A stranger must get 403 on reads and on sends; the message collection
// for the targeted conversation must stay untouched.

import request from "supertest";
import { Types } from "mongoose";
import jwt from "jsonwebtoken";
import app from "../app";
import User from "../models/User.model";
import Booking from "../models/Booking.model";
import Conversation from "../models/Conversation.model";
import Message from "../models/Message.model";

function tokenFor(userId: string): string {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET as string, { expiresIn: "1h" });
}

async function makeUser(role: "student" | "tutor", suffix: string) {
  const user = await User.create({
    name: `${role === "student" ? "Student" : "Tutor"} ${suffix}`,
    email: `${role}-${suffix}@chat-idor.test`,
    password: "password123",
    role,
    isActive: true,
  });
  return { user, token: tokenFor(user.id) };
}

async function makeBooking(studentId: Types.ObjectId, tutorId: Types.ObjectId) {
  // Same shape as admin-finance.test fixture — all required Booking fields.
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
  });
}

async function makeConversation(studentId: Types.ObjectId, tutorId: Types.ObjectId, bookingId: Types.ObjectId) {
  return Conversation.create({ student: studentId, tutor: tutorId, booking: bookingId });
}

async function seedConversation(studentSuffix: string, tutorSuffix: string, attackerSuffix: string) {
  const owner = await makeUser("student", studentSuffix);
  const tutor = await makeUser("tutor", tutorSuffix);
  const attacker = await makeUser("student", attackerSuffix);
  const booking = await makeBooking(owner.user._id as Types.ObjectId, tutor.user._id as Types.ObjectId);
  const conversation = await makeConversation(
    owner.user._id as Types.ObjectId,
    tutor.user._id as Types.ObjectId,
    booking._id as Types.ObjectId,
  );
  return { owner, tutor, attacker, conversation };
}

describe("chat IDOR boundaries — conversation reads & sends", () => {
  it("a stranger cannot read messages from a conversation they aren't a party to", async () => {
    const { owner, tutor, attacker, conversation } = await seedConversation(
      "owner-read", "t-read", "attacker-read",
    );
    // Seed one message so a successful bypass would have real content to leak.
    await Message.create({
      conversation: conversation._id,
      sender: tutor.user._id,
      content: "Lesson scheduled for Monday at your home.",
    });

    const res = await request(app)
      .get(`/api/v1/chat/${conversation.id}/messages`)
      .set("Authorization", `Bearer ${attacker.token}`);

    expect(res.status).toBe(403);
    expect(res.body.messages).toBeUndefined();

    // Ensure the stranger didn't accidentally mark messages read either.
    const [m] = await Message.find({ conversation: conversation._id });
    expect(m.isRead).toBe(false);
    expect(owner.user._id).toBeDefined();
  });

  it("the real participant can read their own conversation (positive control)", async () => {
    const { owner, tutor, conversation } = await seedConversation(
      "owner-read-ok", "t-read-ok", "attacker-read-ok-unused",
    );
    await Message.create({
      conversation: conversation._id,
      sender: tutor.user._id,
      content: "Hello from your tutor.",
    });

    const res = await request(app)
      .get(`/api/v1/chat/${conversation.id}/messages`)
      .set("Authorization", `Bearer ${owner.token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.messages)).toBe(true);
    expect(res.body.messages).toHaveLength(1);
    expect(res.body.messages[0].content).toBe("Hello from your tutor.");
  });

  it("a stranger cannot send a message into a conversation they aren't a party to", async () => {
    const { conversation, attacker } = await seedConversation(
      "owner-send", "t-send", "attacker-send",
    );
    const before = await Message.countDocuments({ conversation: conversation._id });

    const res = await request(app)
      .post(`/api/v1/chat/${conversation.id}/messages`)
      .set("Authorization", `Bearer ${attacker.token}`)
      .send({ content: "I injected this message." });

    expect(res.status).toBe(403);

    const after = await Message.countDocuments({ conversation: conversation._id });
    expect(after).toBe(before);
  });

  it("a request for a conversation that does not exist returns 404 (not 403)", async () => {
    // Make sure the handler distinguishes "no such conversation" from
    // "exists but you're not a party" — the audit flagged both as
    // information-leak surfaces that need separate handling.
    const stranger = await makeUser("student", "no-such-convo");
    const fakeId = new Types.ObjectId().toString();

    const res = await request(app)
      .get(`/api/v1/chat/${fakeId}/messages`)
      .set("Authorization", `Bearer ${stranger.token}`);

    expect(res.status).toBe(404);
  });
});
