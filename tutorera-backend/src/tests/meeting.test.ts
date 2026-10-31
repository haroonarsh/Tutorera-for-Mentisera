import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../app";
import User from "../models/User.model";
import Booking from "../models/Booking.model";
import BookingMeeting from "../models/BookingMeeting.model";

jest.mock("../utils/sendEmail", () => jest.fn().mockResolvedValue(undefined));
beforeAll(() => { process.env.JWT_SECRET = "meeting-test-secret-at-least-16-chars"; });

const auth = (user: any) => ({ Authorization: `Bearer ${jwt.sign({ id: user._id.toString(), role: user.role }, process.env.JWT_SECRET!)}` });
const makeUser = (name: string, role: "student" | "tutor" | "admin") =>
  User.create({ name, email: `${name}@example.test`, password: "password123", role });
const makeBooking = (student: any, tutor: any, paymentStatus: "confirmed" | "pending" = "confirmed") =>
  Booking.create({ student: student._id, tutor: tutor._id, amount: 1000, finalAgreedRate: 1000,
    subtotal: 1000, studentTotal: 1000, tutorNet: 800, feeConfig: { version: 1 },
    schedule: "Monday 17:00", teachingMode: "online", status: "upcoming", paymentStatus });

describe("tutor-hosted booking meetings", () => {
  it("rejects unauthenticated meeting submissions", async () => {
    await request(app).put("/api/v1/bookings/507f1f77bcf86cd799439011/meeting")
      .send({ url: "https://meet.google.com/abc-defg-hij" }).expect(401);
  });

  it("allows assigned tutor to submit a link and participant to retrieve it", async () => {
    const student = await makeUser("meeting-student", "student");
    const tutor = await makeUser("meeting-tutor", "tutor");
    const outsider = await makeUser("meeting-outsider", "student");
    const booking = await makeBooking(student, tutor);
    const path = `/api/v1/bookings/${booking._id}/meeting`;
    const forbidden = await request(app).put(path).set(auth(student)).send({ url: "https://meet.google.com/abc-defg-hij" }).expect(403);
    expect(forbidden.headers["cache-control"]).toContain("no-store");
    await request(app).put(path).set(auth(tutor)).send({ url: "https://meet.google.com/abc-defg-hij" }).expect(200);
    const response = await request(app).get(path).set(auth(student)).expect(200);
    expect(response.body.meeting.url).toBe("https://meet.google.com/abc-defg-hij");
    expect(Object.keys(response.body.meeting).sort()).toEqual(["provider", "updatedAt", "url"]);
    expect(response.headers["cache-control"]).toContain("no-store");
    await request(app).get(path).set(auth(outsider)).expect(403);
    expect(await BookingMeeting.countDocuments({ booking: booking._id })).toBe(1);
  });

  it("rejects unrelated tutors and unpaid bookings", async () => {
    const student = await makeUser("meeting-student-two", "student");
    const tutor = await makeUser("meeting-tutor-two", "tutor");
    const other = await makeUser("meeting-tutor-three", "tutor");
    const booking = await makeBooking(student, tutor, "pending");
    const path = `/api/v1/bookings/${booking._id}/meeting`;
    const url = "https://meet.google.com/abc-defg-hij";
    await request(app).put(path).set(auth(other)).send({ url }).expect(403);
    await request(app).put(path).set(auth(tutor)).send({ url }).expect(409);
    await request(app).get(path).set(auth(student)).expect(409);
  });

  it("rejects untrusted URLs and provider homepages", async () => {
    const student = await makeUser("meeting-student-three", "student");
    const tutor = await makeUser("meeting-tutor-four", "tutor");
    const booking = await makeBooking(student, tutor);
    const path = `/api/v1/bookings/${booking._id}/meeting`;
    for (const url of ["http://meet.google.com/abc-defg-hij", "https://meet.google.com.evil.test/abc-defg-hij",
      "https://meet.google.com/", "https://teams.microsoft.com/",
      "https://meet.google.com/abc-defg-hij?redirect=https://evil.test",
      "https://teams.microsoft.com/l/meetup-join/invalid",
      "https://teams.microsoft.com/l/meetup-join/first/extra/0",
      " https://meet.google.com/abc-defg-hij",
      "https://meet.google.com/abc-defg-hij#fragment"]) {
      await request(app).put(path).set(auth(tutor)).send({ url }).expect(400);
    }
  });

  it("accepts a Teams meeting URL and permits an administrator to inspect it", async () => {
    const student = await makeUser("meeting-student-five", "student");
    const tutor = await makeUser("meeting-tutor-six", "tutor");
    const admin = await makeUser("meeting-admin", "admin");
    const booking = await makeBooking(student, tutor);
    const path = `/api/v1/bookings/${booking._id}/meeting`;
    const url = "https://teams.microsoft.com/l/meetup-join/19%3ameeting_example%40thread.v2/0?context=%7B%7D";
    await request(app).put(path).set(auth(tutor)).send({ url }).expect(200);
    const result = await request(app).get(path).set(auth(admin)).expect(200);
    expect(result.body.meeting.provider).toBe("microsoft_teams");
    expect(result.body.meeting.url).toBe(url);
  });

  it("rejects meeting submissions for in-person bookings", async () => {
    const student = await makeUser("meeting-student-inperson", "student");
    const tutor = await makeUser("meeting-tutor-inperson", "tutor");
    const booking = await makeBooking(student, tutor);
    await Booking.updateOne({ _id: booking._id }, { $set: { teachingMode: "in-person" } });
    const path = `/api/v1/bookings/${booking._id}/meeting`;
    const url = "https://meet.google.com/abc-defg-hij";
    await request(app).put(path).set(auth(tutor)).send({ url }).expect(409);
    await request(app).get(path).set(auth(student)).expect(409);
  });

  it("revokes access when the booking is cancelled", async () => {
    const student = await makeUser("meeting-student-four", "student");
    const tutor = await makeUser("meeting-tutor-five", "tutor");
    const booking = await makeBooking(student, tutor);
    const path = `/api/v1/bookings/${booking._id}/meeting`;
    await request(app).put(path).set(auth(tutor)).send({ url: "https://meet.google.com/abc-defg-hij" }).expect(200);
    await Booking.updateOne({ _id: booking._id }, { $set: { status: "cancelled" } });
    await request(app).get(path).set(auth(student)).expect(409);
  });
});
