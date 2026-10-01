// src/tests/subject-eligibility.test.ts
//
// Covers the core qualification-based subject eligibility service: a
// tutor's self-declared subjects must never grant marketplace privilege on
// their own, approvals must require at least one level, and revoking a
// previously-approved subject must flag affected upcoming/ongoing bookings
// for admin review without cancelling them outright.

import User from "../models/User.model";
import TutorProfile from "../models/TutorProfile.model";
import Request from "../models/Request.model";
import Booking from "../models/Booking.model";
import {
  checkSubjectEligibility,
  isSubjectLevelApproved,
  requestSubjectEligibility,
  approveSubjectEligibility,
  rejectSubjectEligibility,
  revokeSubjectEligibility,
  grandfatherExistingSubjects,
  syncApprovedSubjects,
  NOT_ELIGIBLE_MESSAGE,
} from "../services/subjectEligibility.service";

jest.mock("../utils/logAudit", () => ({ logAudit: jest.fn().mockResolvedValue(undefined) }));

async function makeTutor() {
  const user = await User.create({
    name: "Eligibility Tutor",
    email: `eligibility-${Date.now()}-${Math.random()}@test.com`,
    password: "password123",
    role: "tutor",
  });
  const profile = await TutorProfile.create({ user: user._id, fullName: user.name });
  return { user, profile };
}

describe("subjectEligibility.service", () => {
  it("a self-declared subject with no eligibility entry is never approved", async () => {
    const { profile } = await makeTutor();
    const result = checkSubjectEligibility(profile, "Computer Science", "O-Level");
    expect(result.eligible).toBe(false);
    expect(result.message).toBe(NOT_ELIGIBLE_MESSAGE);
  });

  it("requestSubjectEligibility creates a pending entry that does not itself grant eligibility", async () => {
    const { profile } = await makeTutor();
    await requestSubjectEligibility(profile, "Computer Science");
    expect(profile.subjectEligibility?.[0].status).toBe("pending");
    expect(isSubjectLevelApproved(profile, "Computer Science")).toBe(false);
  });

  it("requestSubjectEligibility is idempotent per subject", async () => {
    const { profile } = await makeTutor();
    await requestSubjectEligibility(profile, "Computer Science");
    await requestSubjectEligibility(profile, "Computer Science");
    expect(profile.subjectEligibility?.length).toBe(1);
  });

  it("approveSubjectEligibility requires at least one level", async () => {
    const { profile } = await makeTutor();
    await requestSubjectEligibility(profile, "Computer Science");
    const result = await approveSubjectEligibility(profile, "Computer Science", [], { name: "Admin" });
    expect(result.success).toBe(false);
    expect(isSubjectLevelApproved(profile, "Computer Science")).toBe(false);
  });

  it("approveSubjectEligibility with levels grants eligibility and syncs approvedSubjects", async () => {
    const { profile } = await makeTutor();
    await requestSubjectEligibility(profile, "Computer Science");
    const result = await approveSubjectEligibility(profile, "Computer Science", ["O-Level", "A-Level"], { name: "Admin" });
    expect(result.success).toBe(true);
    expect(isSubjectLevelApproved(profile, "Computer Science", "O-Level")).toBe(true);
    expect(isSubjectLevelApproved(profile, "Computer Science", "University")).toBe(false);
    expect(profile.approvedSubjects).toContain("Computer Science");
  });

  it("rejectSubjectEligibility keeps the subject out of approvedSubjects", async () => {
    const { profile } = await makeTutor();
    await requestSubjectEligibility(profile, "Mathematics");
    const result = await rejectSubjectEligibility(profile, "Mathematics", "No supporting qualification provided.", { name: "Admin" });
    expect(result.success).toBe(true);
    expect(checkSubjectEligibility(profile, "Mathematics").eligible).toBe(false);
    expect(profile.approvedSubjects || []).not.toContain("Mathematics");
  });

  it("grandfatherExistingSubjects auto-approves an already-active tutor's current subjects", async () => {
    const { profile } = await makeTutor();
    profile.subjects = ["Physics", "Chemistry"];
    profile.levels = ["O-Level"];
    grandfatherExistingSubjects(profile);
    expect(isSubjectLevelApproved(profile, "Physics", "O-Level")).toBe(true);
    expect(isSubjectLevelApproved(profile, "Chemistry", "O-Level")).toBe(true);
    expect(profile.approvedSubjects?.sort()).toEqual(["Chemistry", "Physics"]);
  });

  it("grandfatherExistingSubjects does not duplicate an already-reviewed subject", async () => {
    const { profile } = await makeTutor();
    profile.subjects = ["Physics"];
    await approveSubjectEligibility(
      Object.assign(profile, { subjectEligibility: [{ subject: "Physics", levels: [], status: "pending", matchesDiscipline: false, requestedAt: new Date() }] }),
      "Physics",
      ["A-Level"],
      { name: "Admin" }
    );
    grandfatherExistingSubjects(profile);
    expect(profile.subjectEligibility?.filter((e) => e.subject === "Physics").length).toBe(1);
    expect(profile.subjectEligibility?.[0].levels).toEqual(["A-Level"]);
  });

  it("revokeSubjectEligibility removes approval and flags affected upcoming bookings without cancelling them", async () => {
    const { user, profile } = await makeTutor();
    const student = await User.create({ name: "Student", email: `student-${Date.now()}@test.com`, password: "password123", role: "student" });

    await requestSubjectEligibility(profile, "Computer Science");
    await approveSubjectEligibility(profile, "Computer Science", ["O-Level"], { name: "Admin" });
    await profile.save();

    const request = await Request.create({
      student: student._id,
      subject: "Computer Science",
      level: "O-Level",
      description: "Need help",
      budget: 1000,
      schedule: "Evenings",
      status: "open",
    });
    const booking = await Booking.create({
      student: student._id,
      tutor: user._id,
      request: request._id,
      amount: 1000,
      finalAgreedRate: 1000,
      subtotal: 1000,
      studentTotal: 1000,
      tutorNet: 1000,
      feeConfig: {},
      schedule: "Evenings",
      status: "upcoming",
    });

    const result = await revokeSubjectEligibility(profile, "Computer Science", "Degree verification overturned.", { name: "Admin" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.flaggedBookings).toBe(1);
    expect(checkSubjectEligibility(profile, "Computer Science").eligible).toBe(false);

    const flaggedBooking = await Booking.findById(booking._id);
    expect(flaggedBooking?.flaggedForReview).toBe(true);
    expect(flaggedBooking?.status).toBe("upcoming"); // not auto-cancelled
  });

  it("syncApprovedSubjects excludes approved entries with no levels attached", async () => {
    const { profile } = await makeTutor();
    profile.subjectEligibility = [
      { subject: "Biology", levels: [], status: "approved", matchesDiscipline: false, requestedAt: new Date() } as any,
    ];
    syncApprovedSubjects(profile);
    expect(profile.approvedSubjects || []).not.toContain("Biology");
  });
});
