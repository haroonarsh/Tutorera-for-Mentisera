// src/tests/availability-idor.test.ts
//
// Audit §15 follow-on: tutor availability IDOR + mass-assignment.
// Availability directly drives marketplace matching, so if tutor A
// could overwrite tutor B's weeklySlots they could knock B's bookable
// hours out of the matching pool. Protection is three-layer; this
// suite asserts all three hold, mirroring tutor-profile-idor
// (c7dd81c6) for an endpoint with the same shape.

import request from "supertest";
import { Types } from "mongoose";
import jwt from "jsonwebtoken";
import app from "../app";
import User from "../models/User.model";
import TutorAvailability from "../models/TutorAvailability.model";

function tokenFor(userId: string): string {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET as string, { expiresIn: "1h" });
}

async function makeUser(role: "tutor" | "student", suffix: string) {
  const user = await User.create({
    name: `${role === "tutor" ? "Tutor" : "Student"} ${suffix}`,
    email: `${role}-${suffix}@availability-idor.test`,
    password: "password123",
    role,
    isActive: true,
  });
  return { user, token: tokenFor(user.id) };
}

async function seedAvailability(tutorId: Types.ObjectId, day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday", startTime: string, endTime: string) {
  return TutorAvailability.create({
    tutor: tutorId,
    weeklySlots: [{ day, startTime, endTime }],
    blockedDates: [],
  });
}

describe("tutor availability IDOR + mass-assignment boundaries", () => {
  it("a student cannot save tutor availability (role gate → 403)", async () => {
    const student = await makeUser("student", "role-check");
    const tutor = await makeUser("tutor", "target-role");
    const original = await seedAvailability(tutor.user._id as Types.ObjectId, "Monday", "17:00", "19:00");

    const res = await request(app)
      .post(`/api/v1/tutors/availability`)
      .set("Authorization", `Bearer ${student.token}`)
      .send({ weeklySlots: [{ day: "Monday", startTime: "09:00", endTime: "10:00" }] });

    expect(res.status).toBe(403);

    const after = await TutorAvailability.findById(original._id);
    expect(after?.weeklySlots).toHaveLength(1);
    expect(after?.weeklySlots[0].startTime).toBe("17:00");
    expect(after?.weeklySlots[0].endTime).toBe("19:00");
  });

  it("tutor A updating their availability does NOT touch tutor B's row", async () => {
    const tutorA = await makeUser("tutor", "A-slots");
    const tutorB = await makeUser("tutor", "B-untouched");
    await seedAvailability(tutorA.user._id as Types.ObjectId, "Monday", "17:00", "19:00");
    const bOriginal = await seedAvailability(tutorB.user._id as Types.ObjectId, "Tuesday", "10:00", "12:00");

    const res = await request(app)
      .post(`/api/v1/tutors/availability`)
      .set("Authorization", `Bearer ${tutorA.token}`)
      .send({ weeklySlots: [{ day: "Wednesday", startTime: "18:00", endTime: "20:00" }] });

    expect(res.status).toBe(200);

    const refreshedA = await TutorAvailability.findOne({ tutor: tutorA.user._id });
    const refreshedB = await TutorAvailability.findById(bOriginal._id);

    expect(refreshedA?.weeklySlots).toHaveLength(1);
    expect(refreshedA?.weeklySlots[0].day).toBe("Wednesday");

    // Tutor B's row must be completely untouched.
    expect(refreshedB?.weeklySlots).toHaveLength(1);
    expect(refreshedB?.weeklySlots[0].day).toBe("Tuesday");
    expect(refreshedB?.weeklySlots[0].startTime).toBe("10:00");
    expect(refreshedB?.weeklySlots[0].endTime).toBe("12:00");
  });

  it("mass-assignment is defended — `tutor` field in the body is stripped (no row hijack)", async () => {
    // The Zod saveAvailabilitySchema allows only weeklySlots +
    // blockedDates. A tutor stuffing `tutor: <someoneElse>` into the
    // body must be stripped by the validator; even if the handler
    // somehow received it, it unconditionally sets
    // `tutor: req.user?._id` in the upsert, so the caller's own row
    // is the only one touched.
    const tutorA = await makeUser("tutor", "A-hijack");
    const tutorB = await makeUser("tutor", "B-target");
    await seedAvailability(tutorA.user._id as Types.ObjectId, "Monday", "17:00", "19:00");
    const bOriginal = await seedAvailability(tutorB.user._id as Types.ObjectId, "Tuesday", "10:00", "12:00");

    const res = await request(app)
      .post(`/api/v1/tutors/availability`)
      .set("Authorization", `Bearer ${tutorA.token}`)
      .send({
        weeklySlots: [{ day: "Friday", startTime: "20:00", endTime: "22:00" }],
        // Attack payload: not in the saveAvailabilitySchema allowlist.
        tutor: (tutorB.user._id as Types.ObjectId).toString(),
      });

    expect(res.status).toBe(200);

    // Caller's own row updated to Friday 20:00-22:00.
    const aRow = await TutorAvailability.findOne({ tutor: tutorA.user._id });
    expect(aRow?.weeklySlots[0].day).toBe("Friday");

    // Tutor B's row completely unchanged.
    const bRow = await TutorAvailability.findById(bOriginal._id);
    expect(bRow?.weeklySlots).toHaveLength(1);
    expect(bRow?.weeklySlots[0].day).toBe("Tuesday");
    expect(bRow?.weeklySlots[0].startTime).toBe("10:00");
    expect(bRow?.weeklySlots[0].endTime).toBe("12:00");
  });

  it("a tutor without prior availability can create a new row via upsert (positive control)", async () => {
    const tutor = await makeUser("tutor", "new-upsert");

    const res = await request(app)
      .post(`/api/v1/tutors/availability`)
      .set("Authorization", `Bearer ${tutor.token}`)
      .send({ weeklySlots: [{ day: "Saturday", startTime: "08:00", endTime: "10:00" }] });

    expect(res.status).toBe(200);

    const row = await TutorAvailability.findOne({ tutor: tutor.user._id });
    expect(row).toBeTruthy();
    expect(row?.weeklySlots[0].day).toBe("Saturday");
  });
});
