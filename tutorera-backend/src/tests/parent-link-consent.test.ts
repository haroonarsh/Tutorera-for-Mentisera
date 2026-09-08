import request from "supertest";
import app from "../app";
import User from "../models/User.model";
import ParentProfile from "../models/ParentProfile.model";
import sendEmail from "../utils/sendEmail";

jest.mock("../utils/sendEmail", () => jest.fn().mockResolvedValue(undefined));

beforeAll(() => { process.env.JWT_SECRET = "test-secret-at-least-16-chars"; });

describe("parent and student account linking", () => {
  async function loginParent() {
    const email = `consent-parent-${Date.now()}@test.com`;
    const parent = await User.create({ name: "Consent Parent", email, password: "password123", role: "parent" });
    const agent = request.agent(app);
    await agent.post("/api/v1/auth/login").send({ email, password: "password123" }).expect(200);
    return { agent, parent };
  }

  it("does not grant access until the emailed student code is confirmed", async () => {
    const { agent, parent } = await loginParent();
    const student = await User.create({ name: "Consent Student", email: `consent-student-${Date.now()}@test.com`, password: "password123", role: "student" });

    const requested = await agent.post("/api/v1/parent/children").send({
      studentEmail: student.email,
      name: student.name,
      level: "O-Level",
      subjects: ["Mathematics"],
      relationship: "child",
    }).expect(202);

    const beforeConfirmation = await ParentProfile.findOne({ user: parent._id }).lean();
    expect(beforeConfirmation?.children).toHaveLength(0);

    const emailCalls = (sendEmail as jest.Mock).mock.calls;
    const emailOptions = emailCalls[emailCalls.length - 1]?.[0];
    expect(emailOptions.to).toBe(student.email);
    expect(emailOptions.eventType).toBe("account.parent_link_verification_requested");
    const code = String(emailOptions.html).match(/>(\d{6})</)?.[1];
    expect(code).toMatch(/^\d{6}$/);

    await agent.post("/api/v1/parent/children/confirm").send({ requestId: requested.body.requestId, code }).expect(200);
    const afterConfirmation = await ParentProfile.findOne({ user: parent._id }).lean();
    expect(afterConfirmation?.children).toHaveLength(1);
    expect(afterConfirmation?.children[0].studentUser.toString()).toBe(student._id.toString());
  });

  it("rejects an incorrect consent code without linking the account", async () => {
    const { agent, parent } = await loginParent();
    const student = await User.create({ name: "Protected Student", email: `protected-student-${Date.now()}@test.com`, password: "password123", role: "student" });
    const requested = await agent.post("/api/v1/parent/children").send({ studentEmail: student.email, name: student.name }).expect(202);

    const response = await agent.post("/api/v1/parent/children/confirm").send({ requestId: requested.body.requestId, code: "000000" }).expect(400);
    expect(response.body.attemptsRemaining).toBe(4);
    const profile = await ParentProfile.findOne({ user: parent._id }).lean();
    expect(profile?.children).toHaveLength(0);
  });

  it("rejects the legacy direct student identifier contract", async () => {
    const { agent } = await loginParent();
    const student = await User.create({ name: "Direct Link Student", email: `direct-student-${Date.now()}@test.com`, password: "password123", role: "student" });
    await agent.post("/api/v1/parent/children").send({ studentUserId: student._id, name: student.name }).expect(400);
  });
});
