import { Types } from "mongoose";
import TutorProfile from "../models/TutorProfile.model";
import Booking from "../models/Booking.model";
import Request from "../models/Request.model";
import AuditLog from "../models/AuditLog.model";
import TutorApplicationStatusHistory from "../models/TutorApplicationStatusHistory.model";
import { persistTutorEducationEdit } from "../services/educationEditPersistence.service";

describe("atomic self-service education persistence", () => {
  it("commits profile reset, booking flag, history, and audit together", async () => {
    const tutor = new Types.ObjectId(); const request = new Types.ObjectId();
    const profile = await TutorProfile.create({ user: tutor, fullName: "Edit Tutor", subjectEligibility: [
      { subject: "Physics", status: "pending", levels: [], reason: "The supporting qualification changed or was removed. A fresh qualification and subject review is required." },
    ] });
    await Request.collection.insertOne({ _id: request, subject: "Physics" });
    await Booking.collection.insertOne({ _id: new Types.ObjectId(), tutor, request, status: "upcoming" });
    await persistTutorEducationEdit({ profileId: profile._id.toString(), update: { hourlyRate: 1250 }, resetSubjects: ["Physics"], actor: { id: tutor.toString(), name: "Edit Tutor" } });
    expect((await TutorProfile.findById(profile._id))!.hourlyRate).toBe(1250);
    expect(await Booking.countDocuments({ flaggedForReview: true })).toBe(1);
    expect(await AuditLog.countDocuments({ action: "subject_eligibility_reset_after_education_edit" })).toBe(1);
    expect(await TutorApplicationStatusHistory.countDocuments({ event: "SUBJECT_ELIGIBILITY_REVIEW_REQUIRED" })).toBe(1);
  });

  it("rolls back profile and booking flag when immutable history fails", async () => {
    const tutor = new Types.ObjectId(); const request = new Types.ObjectId();
    const profile = await TutorProfile.create({ user: tutor, fullName: "Rollback Tutor" });
    await Request.collection.insertOne({ _id: request, subject: "Physics" });
    await Booking.collection.insertOne({ _id: new Types.ObjectId(), tutor, request, status: "upcoming" });
    const failure = jest.spyOn(TutorApplicationStatusHistory, "create").mockRejectedValueOnce(new Error("History unavailable") as never);
    try { await expect(persistTutorEducationEdit({ profileId: profile._id.toString(), update: { hourlyRate: 999 }, resetSubjects: ["Physics"], actor: { id: tutor.toString(), name: "Rollback Tutor" } })).rejects.toThrow("History unavailable"); }
    finally { failure.mockRestore(); }
    expect((await TutorProfile.findById(profile._id))!.hourlyRate).not.toBe(999);
    expect(await Booking.countDocuments({ flaggedForReview: true })).toBe(0);
    expect(await AuditLog.countDocuments()).toBe(0);
  });
});
