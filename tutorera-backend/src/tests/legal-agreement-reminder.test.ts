// src/tests/legal-agreement-reminder.test.ts
//
// Covers the daily reminder cron: already-activated tutors who still
// haven't accepted the current Tutor Agreement get emailed, tutors who
// aren't activated or already signed don't, and a tutor is never emailed
// twice within the same throttle window.

import User from "../models/User.model";
import TutorProfile from "../models/TutorProfile.model";
import { seedDefaultLegalAgreements } from "../services/legalAgreement.service";
import { sendAgreementReminders } from "../services/legalAgreementReminder.service";

const sendEmailMock = jest.fn().mockResolvedValue(undefined);
jest.mock("../utils/sendEmail", () => ({
  __esModule: true,
  default: (...args: unknown[]) => sendEmailMock(...args),
}));
jest.mock("../utils/socket", () => ({
  sendNotification: jest.fn().mockResolvedValue(undefined),
}));

async function makeTutor(overrides: Partial<Record<string, unknown>> = {}) {
  const user = await User.create({
    name: overrides.name || "Reminder Tutor",
    email: (overrides.email as string) || `reminder-${Date.now()}-${Math.random()}@test.com`,
    password: "password123",
    role: "tutor",
    applicationId: "TUT-REMIND-1",
  });
  // TutorProfile's pre("save") hook recomputes tutorStatus from
  // marketplaceEligible/agreementAcceptedAt on every save - marketplaceEligible:
  // true is what makes it actually land on "active" (matching a real tutor who
  // was already live before a new agreement version was published), rather
  // than the hook overriding it back to "approved_pending_agreement".
  const profile = await TutorProfile.create({
    user: user._id,
    fullName: user.name,
    countryCode: "PK",
    tutorStatus: "active",
    verificationStatus: "approved",
    marketplaceEligible: true,
    agreementAcceptedAt: new Date("2020-01-01"),
    agreementAcceptanceRequired: true,
    agreementVersion: "some-old-version",
    ...overrides,
  });
  return { user, profile };
}

describe("Legal agreement reminder cron", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-key-at-least-32-chars-long";
  });

  beforeEach(() => {
    sendEmailMock.mockClear();
  });

  it("emails an already-active tutor who hasn't accepted the current agreement", async () => {
    const agreement = await seedDefaultLegalAgreements();
    await makeTutor();

    const result = await sendAgreementReminders();

    expect(result.emailsSent).toBe(1);
    expect(result.failures).toBe(0);
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    const emailArgs = sendEmailMock.mock.calls[0][0];
    expect(emailArgs.subject).toContain(agreement.version);

    const updated = await TutorProfile.findOne({ fullName: "Reminder Tutor" });
    expect(updated?.agreementReminderLastSentAt).toBeTruthy();
    expect(updated?.agreementReminderCount).toBe(1);
  });

  it("does not email a tutor who already accepted the current version", async () => {
    const agreement = await seedDefaultLegalAgreements();
    await makeTutor({ agreementVersion: agreement.version });

    const result = await sendAgreementReminders();

    expect(result.emailsSent).toBe(0);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("does not email a tutor who isn't already activated (e.g. still under verification)", async () => {
    await seedDefaultLegalAgreements();
    await makeTutor({ tutorStatus: "under_verification", verificationStatus: "pending" });

    const result = await sendAgreementReminders();

    expect(result.emailsSent).toBe(0);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("does not email a tutor twice within the same throttle window", async () => {
    await seedDefaultLegalAgreements();
    await makeTutor();

    const first = await sendAgreementReminders();
    expect(first.emailsSent).toBe(1);

    const second = await sendAgreementReminders();
    expect(second.emailsSent).toBe(0);
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
  });

  it("recognizes a tutor who was already flagged as agreement_reacceptance_required as already-activated", async () => {
    await seedDefaultLegalAgreements();
    await makeTutor({ tutorStatus: "agreement_reacceptance_required" });

    const result = await sendAgreementReminders();

    expect(result.emailsSent).toBe(1);
  });
});
