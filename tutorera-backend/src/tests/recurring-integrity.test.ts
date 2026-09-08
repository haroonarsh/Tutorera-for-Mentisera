import request from "supertest";
import app from "../app";
import User from "../models/User.model";
import RecurringPlan from "../models/RecurringPlan.model";
import RecurringBooking from "../models/RecurringBooking.model";
import ParentProfile from "../models/ParentProfile.model";

jest.mock("../utils/sendEmail", () => jest.fn().mockResolvedValue(undefined));

beforeAll(() => { process.env.JWT_SECRET = "test-secret-at-least-16-chars"; });

describe("recurring booking integrity", () => {
  async function login(role: "student" | "tutor" | "parent", suffix: string) {
    const email = `${suffix}@test.com`;
    const user = await User.create({ name: suffix, email, password: "password123", role });
    const agent = request.agent(app);
    await agent.post("/api/v1/auth/login").send({ email, password: "password123" }).expect(200);
    return { agent, user };
  }

  async function plan() {
    return RecurringPlan.create({
      name: "Four lesson package",
      type: "package_4",
      sessionCount: 4,
      durationWeeks: 4,
      pricePerSession: 1000,
      totalPrice: 4000,
      discountPercent: 0,
      isActive: true,
    });
  }

  it("advertises checkout as unavailable and does not create an unpaid active subscription", async () => {
    const { agent } = await login("student", `recurring-student-${Date.now()}`);
    const tutor = await User.create({ name: "Recurring Tutor", email: `recurring-tutor-${Date.now()}@test.com`, password: "password123", role: "tutor" });
    const recurringPlan = await plan();

    const plansResponse = await request(app).get("/api/v1/recurring/plans").expect(200);
    expect(plansResponse.body.subscription).toMatchObject({ enabled: false, code: "RECURRING_BILLING_UNAVAILABLE" });

    await agent.post("/api/v1/recurring/subscribe").send({
      tutorId: tutor._id,
      subject: "Mathematics",
      planId: recurringPlan._id,
    }).expect(503);

    expect(await RecurringBooking.countDocuments()).toBe(0);
  });

  it("records a paid session only once under simultaneous requests", async () => {
    const { agent: tutorAgent, user: tutor } = await login("tutor", `session-tutor-${Date.now()}`);
    const student = await User.create({ name: "Session Student", email: `session-student-${Date.now()}@test.com`, password: "password123", role: "student" });
    const recurringPlan = await plan();
    const recurringBooking = await RecurringBooking.create({
      student: student._id,
      tutor: tutor._id,
      subject: "Mathematics",
      plan: recurringPlan._id,
      planType: recurringPlan.type,
      sessionsRemaining: 4,
      sessionsCompleted: 0,
      sessionsUsed: [],
      startDate: new Date(),
      status: "active",
      paymentStatus: "confirmed",
      totalPaid: 4000,
    });

    const responses = await Promise.all([
      tutorAgent.patch(`/api/v1/recurring/${recurringBooking._id}/sessions/1`),
      tutorAgent.patch(`/api/v1/recurring/${recurringBooking._id}/sessions/1`),
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([200, 409]);
    const saved = await RecurringBooking.findById(recurringBooking._id).lean();
    expect(saved?.sessionsUsed).toEqual([1]);
    expect(saved?.sessionsCompleted).toBe(1);
    expect(saved?.sessionsRemaining).toBe(3);
  });

  it("does not allow a tutor to record sessions before payment confirmation", async () => {
    const { agent: tutorAgent, user: tutor } = await login("tutor", `unpaid-tutor-${Date.now()}`);
    const student = await User.create({ name: "Unpaid Student", email: `unpaid-student-${Date.now()}@test.com`, password: "password123", role: "student" });
    const recurringPlan = await plan();
    const recurringBooking = await RecurringBooking.create({
      student: student._id,
      tutor: tutor._id,
      subject: "Physics",
      plan: recurringPlan._id,
      planType: recurringPlan.type,
      sessionsRemaining: 4,
      sessionsCompleted: 0,
      sessionsUsed: [],
      startDate: new Date(),
      status: "active",
      paymentStatus: "pending",
      totalPaid: 0,
    });

    await tutorAgent.patch(`/api/v1/recurring/${recurringBooking._id}/sessions/1`).expect(409);
    const saved = await RecurringBooking.findById(recurringBooking._id).lean();
    expect(saved?.sessionsCompleted).toBe(0);
    expect(saved?.sessionsRemaining).toBe(4);
  });

  it("allows a parent to manage only a consent-linked child's paid plan", async () => {
    const { agent: parentAgent, user: parent } = await login("parent", `recurring-parent-${Date.now()}`);
    const linked = await User.create({ name: "Linked Child", email: `linked-child-${Date.now()}@test.com`, password: "password123", role: "student" });
    const other = await User.create({ name: "Other Child", email: `other-child-${Date.now()}@test.com`, password: "password123", role: "student" });
    const tutor = await User.create({ name: "Plan Tutor", email: `plan-tutor-${Date.now()}@test.com`, password: "password123", role: "tutor" });
    const recurringPlan = await plan();
    await ParentProfile.create({ user: parent._id, children: [{ studentUser: linked._id, name: linked.name }] });
    const linkedPlan = await RecurringBooking.create({ student: linked._id, tutor: tutor._id, subject: "Mathematics", plan: recurringPlan._id, planType: recurringPlan.type, sessionsRemaining: 4, sessionsCompleted: 0, sessionsUsed: [], startDate: new Date(), status: "active", paymentStatus: "confirmed", totalPaid: 4000 });
    const otherPlan = await RecurringBooking.create({ student: other._id, tutor: tutor._id, subject: "Physics", plan: recurringPlan._id, planType: recurringPlan.type, sessionsRemaining: 4, sessionsCompleted: 0, sessionsUsed: [], startDate: new Date(), status: "active", paymentStatus: "confirmed", totalPaid: 4000 });

    const history = await parentAgent.get(`/api/v1/recurring/my-bookings?childId=${linked._id}`).expect(200);
    expect(history.body.bookings).toHaveLength(1);
    expect(history.body.bookings[0].subject).toBe("Mathematics");
    await parentAgent.patch(`/api/v1/recurring/${linkedPlan._id}/pause`).expect(200);
    await parentAgent.patch(`/api/v1/recurring/${otherPlan._id}/pause`).expect(404);
  });

  it("keeps completed and cancelled plans immutable", async () => {
    const { agent: studentAgent, user: student } = await login("student", `terminal-student-${Date.now()}`);
    const tutor = await User.create({ name: "Terminal Tutor", email: `terminal-tutor-${Date.now()}@test.com`, password: "password123", role: "tutor" });
    const recurringPlan = await plan();
    const completed = await RecurringBooking.create({ student: student._id, tutor: tutor._id, subject: "English", plan: recurringPlan._id, planType: recurringPlan.type, sessionsRemaining: 0, sessionsCompleted: 4, sessionsUsed: [1,2,3,4], startDate: new Date(), status: "completed", paymentStatus: "confirmed", totalPaid: 4000 });
    await studentAgent.patch(`/api/v1/recurring/${completed._id}/cancel`).expect(404);
    await studentAgent.get("/api/v1/recurring/my-bookings?status=anything").expect(400);
    expect((await RecurringBooking.findById(completed._id).lean())?.status).toBe("completed");
  });
});
