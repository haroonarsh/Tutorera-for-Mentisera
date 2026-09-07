import { ClientSession, Types } from "mongoose";
import Booking, { IBooking } from "../models/Booking.model";
import Request from "../models/Request.model";
import StudentTutorRelationship from "../models/StudentTutorRelationship.model";

type RelationshipBooking = IBooking & {
  request?: Types.ObjectId | { subject?: string } | null;
};

async function bookingSubject(booking: RelationshipBooking, session?: ClientSession): Promise<string> {
  const request = booking.request as { subject?: string } | Types.ObjectId | undefined;
  if (request && typeof request === "object" && "subject" in request && request.subject) {
    return request.subject;
  }
  if (request) {
    const row = await Request.findById(request).select("subject").session(session || null).lean();
    if (row?.subject) return row.subject;
  }
  return "Tutoring";
}

export async function syncStudentTutorRelationship(
  booking: RelationshipBooking,
  session?: ClientSession
) {
  const subject = await bookingSubject(booking, session);
  const timestamped = booking as RelationshipBooking & { updatedAt?: Date };
  const completedBookings = await Booking.countDocuments({
    student: booking.student,
    tutor: booking.tutor,
    status: "completed",
  }).session(session || null);
  const totalBookings = await Booking.countDocuments({
    student: booking.student,
    tutor: booking.tutor,
  }).session(session || null);

  return StudentTutorRelationship.findOneAndUpdate(
    { student: booking.student, tutor: booking.tutor, subject },
    {
      $setOnInsert: {
        student: booking.student,
        tutor: booking.tutor,
        subject,
        firstBooking: booking._id,
      },
      $set: {
        lastBooking: booking._id,
        completedBookings,
        repeatBookingCount: Math.max(0, totalBookings - 1),
        relationshipStatus: "active",
        ...(booking.status === "completed" ? { lastSessionAt: timestamped.updatedAt || new Date() } : {}),
      },
    },
    { new: true, upsert: true, session }
  );
}
