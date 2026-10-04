import mongoose, { Types } from "mongoose";
import Request from "../models/Request.model";
import Booking from "../models/Booking.model";
import { flagQualificationBookings, flagPendingQualificationBookings } from "../services/qualificationBookingReview.service";
import TutorProfile from "../models/TutorProfile.model";

async function fixture() {
  const tutor = new Types.ObjectId();
  const request = new Types.ObjectId();
  const otherRequest = new Types.ObjectId();
  await Request.collection.insertMany([{ _id: request, subject: "C++" }, { _id: otherRequest, subject: "Chemistry" }]);
  const rows = [
    { tutor, request, status: "upcoming" },
    { tutor, request, status: "ongoing" },
    { tutor, request, status: "completed" },
    { tutor: new Types.ObjectId(), request, status: "upcoming" },
    { tutor, request: otherRequest, status: "upcoming" },
  ].map(row => ({ ...row, _id: new Types.ObjectId() }));
  await Booking.collection.insertMany(rows);
  return { tutor, rows };
}

describe("qualification booking review flags", () => {
  it("flags reconciled pending approvals without treating ordinary subject requests as invalidations", async () => {
    const { tutor } = await fixture();
    const profile = new TutorProfile({ user: tutor, subjectEligibility: [
      { subject: "C++", status: "pending", reason: "The supporting qualification changed or was removed. A fresh qualification and subject review is required." },
      { subject: "Chemistry", status: "pending", reason: "New teaching request" },
    ] });
    expect(await flagPendingQualificationBookings(profile)).toBe(2);
  });
  it("matches literal subjects and flags only the affected tutor's active lessons", async () => {
    const { tutor, rows } = await fixture();
    expect(await flagQualificationBookings(tutor.toString(), ["C++"], "Qualification changed")).toBe(2);
    for (const [index, row] of rows.entries()) {
      const saved = await Booking.collection.findOne({ _id: row._id });
      expect(Boolean(saved!.flaggedForReview)).toBe(index < 2);
      expect(saved!.status).toBe(row.status);
    }
  });

  it("rolls back flags with the surrounding review transaction", async () => {
    const { tutor } = await fixture();
    const session = await mongoose.startSession();
    try {
      await expect(session.withTransaction(async () => {
        await flagQualificationBookings(tutor.toString(), ["C++"], "Qualification changed", session);
        throw new Error("Audit failed");
      })).rejects.toThrow("Audit failed");
    } finally { await session.endSession(); }
    expect(await Booking.countDocuments({ flaggedForReview: true })).toBe(0);
  });
});
