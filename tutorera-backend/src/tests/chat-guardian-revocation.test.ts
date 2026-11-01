import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../app";
import User from "../models/User.model";
import Booking from "../models/Booking.model";
import Conversation from "../models/Conversation.model";
import Message from "../models/Message.model";
import { isConversationStudentEligible } from "../services/chatAccess.service";

jest.mock("../utils/socket", () => ({
  sendNotification: jest.fn().mockResolvedValue(undefined),
}));
beforeAll(() => { process.env.JWT_SECRET = "test-secret-at-least-16-chars"; });
const headers = (userId: string) => ({
  Authorization: `Bearer ${jwt.sign({ id: userId }, process.env.JWT_SECRET!, { expiresIn: "1h" })}`,
});
let index = 0;
async function fixture() {
  const suffix = `${Date.now()}-${++index}`;
  const tutor = await User.create({
    name: "Tutor Consent Chat", email: `chat-tutor-${suffix}@example.test`,
    role: "tutor", password: "password123", isActive: true,
  });
  const student = await User.create({
    name: "Supervised Chat Student", email: `chat-minor-${suffix}@example.test`,
    role: "student", password: "password123", isActive: true,
    isMinor: true, parentConsentVerified: true, dateOfBirth: new Date("2010-03-20"),
  });
  const booking = await Booking.create({
    student: student._id, tutor: tutor._id, amount: 1000, finalAgreedRate: 1000,
    subtotal: 1000, studentTotal: 1000, tutorNet: 800,
    feeConfig: { version: 1 }, schedule: "Monday 14:00",
  });
  const conversation = await Conversation.create({
    student: student._id, tutor: tutor._id, booking: booking._id,
  });
  // app.ts is used by Supertest without the live HTTP/Socket server.
  app.set("io", { to: () => ({ emit: jest.fn() }) });
  return { tutor, student, conversation };
}

describe("Guardian revocation — chat delivery protections", () => {
  it("allows a tutor to message a verified supervised student", async () => {
    const { tutor, student, conversation } = await fixture();
    expect(await isConversationStudentEligible(student._id)).toBe(true);
    const response = await request(app)
      .post(`/api/v1/chat/${conversation._id}/messages`)
      .set(headers(tutor._id.toString()))
      .send({ content: "Your maths homework is ready" })
      .expect(201);
    expect(response.body.success).toBe(true);
    expect(await Message.countDocuments({ conversation: conversation._id })).toBe(1);
  });

  it("rejects a tutor's valid JWT once the student's consent was revoked, with no message stored", async () => {
    const { tutor, student, conversation } = await fixture();
    await User.updateOne({ _id: student._id }, { $set: { parentConsentVerified: false } });
    expect(await isConversationStudentEligible(student._id)).toBe(false);
    const response = await request(app)
      .post(`/api/v1/chat/${conversation._id}/messages`)
      .set(headers(tutor._id.toString()))
      .send({ content: "Attempt after guardian revocation" })
      .expect(403);
    expect(response.body.code).toBe("STUDENT_CHAT_UNAVAILABLE");
    expect(await Message.countDocuments({ conversation: conversation._id })).toBe(0);
  });

  it("rejects new tutor messages to deactivated supervised students", async () => {
    const { tutor, student, conversation } = await fixture();
    await User.updateOne({ _id: student._id }, { $set: { isActive: false } });
    expect(await isConversationStudentEligible(student._id)).toBe(false);
    await request(app)
      .post(`/api/v1/chat/${conversation._id}/messages`)
      .set(headers(tutor._id.toString()))
      .send({ content: "Attempt against disabled account" })
      .expect(403);
    expect(await Message.countDocuments({ conversation: conversation._id })).toBe(0);
  });

  it("does not let revoked students access historic chat through their still-valid token", async () => {
    const { student, conversation } = await fixture();
    await User.updateOne({ _id: student._id }, { $set: { parentConsentVerified: false } });
    const response = await request(app)
      .get(`/api/v1/chat/${conversation._id}/messages`)
      .set(headers(student._id.toString()))
      .expect(403);
    expect(response.body.code).toBe("GUARDIAN_CONSENT_REQUIRED");
  });
});
