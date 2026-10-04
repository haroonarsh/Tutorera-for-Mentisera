import { Types } from "mongoose";
import TutorProfile from "../models/TutorProfile.model";
import AuditLog from "../models/AuditLog.model";
import TutorApplicationStatusHistory from "../models/TutorApplicationStatusHistory.model";
import { commitSubjectEvidenceDecision, EvidenceDecisionError } from "../services/subjectEvidenceDecision.service";

async function fixture() {
  await Promise.all([AuditLog.init(), TutorApplicationStatusHistory.init()]);
  const profile = await TutorProfile.create({ user: new Types.ObjectId(), fullName: "Evidence Tutor", subjectEligibility: [{ subject: "Chemistry", levels: [], status: "pending", matchesDiscipline: false, evidence: [{ url: "private-url", publicId: "private-id", status: "pending" }] }] });
  return { profileId: profile._id.toString(), subject: "Chemistry", index: 0, status: "approved" as const, reason: "Issuer and academic scope verified", actor: { id: new Types.ObjectId().toString(), name: "Reviewer" } };
}

describe("atomic subject evidence decision", () => {
  it("commits a decision and both audit records with the reviewer identity", async () => {
    const input = await fixture();
    await commitSubjectEvidenceDecision(input);
    const profile = await TutorProfile.findById(input.profileId);
    expect(profile!.subjectEligibility![0].evidence![0].status).toBe("approved");
    const audit = await AuditLog.findOne({ targetId: input.profileId });
    expect(audit?.actorId).toBe(input.actor.id);
    expect(audit?.metadata).toMatchObject({ previousStatus: "pending", status: "approved" });
    const history = await TutorApplicationStatusHistory.findOne({ tutorProfile: input.profileId });
    expect(history?.actorId?.toString()).toBe(input.actor.id);
    expect(history?.isPublic).toBe(false);
  });

  it("rolls back the decision if the audit write fails", async () => {
    const input = await fixture();
    const failure = jest.spyOn(AuditLog, "create").mockRejectedValueOnce(new Error("Audit unavailable") as never);
    try { await expect(commitSubjectEvidenceDecision(input)).rejects.toThrow("Audit unavailable"); }
    finally { failure.mockRestore(); }
    expect((await TutorProfile.findById(input.profileId))!.subjectEligibility![0].evidence![0].status).toBe("pending");
    expect(await TutorApplicationStatusHistory.countDocuments()).toBe(0);
  });

  it("rolls back the decision and audit if tracking history cannot be saved", async () => {
    const input = await fixture();
    const failure = jest.spyOn(TutorApplicationStatusHistory, "create").mockRejectedValueOnce(new Error("History unavailable") as never);
    try { await expect(commitSubjectEvidenceDecision(input)).rejects.toThrow("History unavailable"); }
    finally { failure.mockRestore(); }
    expect((await TutorProfile.findById(input.profileId))!.subjectEligibility![0].evidence![0].status).toBe("pending");
    expect(await AuditLog.countDocuments()).toBe(0);
  });

  it("allows only one of two simultaneous contradictory decisions", async () => {
    const input = await fixture();
    const results = await Promise.allSettled([
      commitSubjectEvidenceDecision(input),
      commitSubjectEvidenceDecision({ ...input, status: "rejected", reason: "Invalid credential" }),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const loser = results.find((result) => result.status === "rejected") as PromiseRejectedResult;
    expect(loser.reason).toBeInstanceOf(EvidenceDecisionError);
    expect(loser.reason.statusCode).toBe(409);
    expect(await AuditLog.countDocuments({ targetId: input.profileId })).toBe(1);
    expect(await TutorApplicationStatusHistory.countDocuments({ tutorProfile: input.profileId })).toBe(1);
  });
});
