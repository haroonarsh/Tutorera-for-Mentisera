// src/tests/missing-documents-reminder.test.ts
//
// Covers the missing-documents reminder cron: a tutor stalled on
// onboarding with no education entry or no subject eligibility request
// gets emailed, a tutor who has submitted both doesn't, and a tutor is
// never emailed twice within the same throttle window.

import User from "../models/User.model";
import TutorProfile from "../models/TutorProfile.model";
import { sendMissingDocumentsReminders } from "../services/missingDocumentsReminder.service";

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
    name: overrides.name || "Stalled Tutor",
    email: (overrides.email as string) || `stalled-${Date.now()}-${Math.random()}@test.com`,
    password: "password123",
    role: "tutor",
    applicationId: "TUT-STALLED-1",
  });
  const profile = await TutorProfile.create({
    user: user._id,
    fullName: user.name,
    countryCode: "PK",
    onboardingStep: 2,
    onboardingComplete: false,
    ...overrides,
  });
  return { user, profile };
}

describe("Missing documents reminder cron", () => {
  beforeEach(() => {
    sendEmailMock.mockClear();
  });

  it("emails a tutor with no education entry at all", async () => {
    await makeTutor();

    const result = await sendMissingDocumentsReminders();

    expect(result.emailsSent).toBe(1);
    expect(result.failures).toBe(0);
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    const emailArgs = sendEmailMock.mock.calls[0][0];
    expect(emailArgs.subject).toContain("application");

    const updated = await TutorProfile.findOne({ fullName: "Stalled Tutor" });
    expect(updated?.missingDocsReminderLastSentAt).toBeTruthy();
    expect(updated?.missingDocsReminderCount).toBe(1);
  });

  it("emails a tutor who has an education entry but no subject eligibility requests", async () => {
    await makeTutor({
      education: [{ degree: "BS Computer Science", institution: "FAST", year: 2022, degreeDoc: "", degreeDocPublicId: "" }],
      subjects: [],
      subjectEligibility: [],
    });

    const result = await sendMissingDocumentsReminders();
    expect(result.emailsSent).toBe(1);
  });

  it("does not email a tutor who has both an education entry and a subject eligibility request", async () => {
    await makeTutor({
      education: [{ degree: "BS Computer Science", institution: "FAST", year: 2022, degreeDoc: "", degreeDocPublicId: "" }],
      subjects: ["Computer Science"],
      subjectEligibility: [{ subject: "Computer Science", levels: [], status: "pending", matchesDiscipline: false, requestedAt: new Date() }],
    });

    const result = await sendMissingDocumentsReminders();
    expect(result.emailsSent).toBe(0);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("does not email a tutor who is already active", async () => {
    await makeTutor({
      tutorStatus: "active",
      verificationStatus: "approved",
      marketplaceEligible: true,
      cnicVerificationStatus: "approved",
      degreeVerificationStatus: "approved",
      demoVideoStatus: "approved",
      agreementAcceptedAt: new Date("2020-01-01"),
    });

    const result = await sendMissingDocumentsReminders();
    expect(result.emailsSent).toBe(0);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("does not email a tutor twice within the same throttle window", async () => {
    await makeTutor();

    const first = await sendMissingDocumentsReminders();
    expect(first.emailsSent).toBe(1);

    const second = await sendMissingDocumentsReminders();
    expect(second.emailsSent).toBe(0);
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
  });

  it("issues a fresh passwordless tracking token in the email link", async () => {
    const { user } = await makeTutor();
    expect(user.trackingTokenHash).toBeFalsy();

    await sendMissingDocumentsReminders();

    const emailArgs = sendEmailMock.mock.calls[0][0];
    expect(emailArgs.html).toContain("/track/tutor/");

    const updatedUser = await User.findById(user._id);
    expect(updatedUser?.trackingTokenHash).toBeTruthy();
  });
});
