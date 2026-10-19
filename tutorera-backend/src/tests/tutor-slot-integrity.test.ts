import Booking from "../models/Booking.model";
import BookedSlot from "../models/BookedSlot.model";
import Bid from "../models/Bid.model";
import Request from "../models/Request.model";
import User from "../models/User.model";
import { confirmExistingBookingPayment, finalizeBidAcceptance } from "../controllers/request.controller";
import { resolveMarketplaceFees } from "../services/pricing.service";

jest.mock("../utils/sendEmail", () => jest.fn().mockResolvedValue(undefined));

let seq = 0;
const nextEmail = (type: string) => `tutor-slot-${type}-${Date.now()}-${++seq}@example.test`;
const base = () => {
  const date = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000);
  date.setUTCHours(9, 0, 0, 0);
  return date;
};
const timeAt = (date: Date, minutes: number) => new Date(date.getTime() + minutes * 60_000);
const utcClock = (date: Date) => date.toISOString().slice(11, 16);

async function users() {
  const tutor = await User.create({ name: "Slot Tutor", email: nextEmail("t"), password: "password123", role: "tutor" });
  return { tutor };
}

async function prepareOffer(tutor: any, from: Date | null, until: Date | null, direct = false) {
  const student = await User.create({ name: "Slot Student", email: nextEmail("s"), password: "password123", role: "student" });
  const request = await Request.create({
    student: student._id,
    subject: "Mathematics", level: "Matric", description: "Need a scheduled lesson",
    budget: 1000, pricingUnit: "hour", currency: "PKR", allowCounterOffers: true,
    countryCode: "PK", timezone: "UTC", scheduleTimezone: "UTC",
    teachingMode: "online", schedule: from ? "Confirmed time" : "Flexible time",
    ...(from ? { selectedDate: from.toISOString().slice(0, 10), selectedStartTime: utcClock(from) } : {}),
    ...(until ? { selectedEndTime: utcClock(until) } : {}),
    ...(from ? { scheduledStartAt: from } : {}),
    ...(until ? { scheduledEndAt: until } : {}),
    isDirect: direct, ...(direct ? { targetTutor: tutor._id } : {}),
    status: "awaiting_payment",
  });
  const bid = await Bid.create({
    request: request._id, tutor: tutor._id, amount: 1000, currency: "PKR",
    pricingUnit: "hour", initialStudentRate: 1000,
    message: "Accepted tuition offer", status: "payment_pending",
    paymentPendingExpiresAt: new Date(Date.now() + 45 * 60 * 1000),
    expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), isDirect: direct,
  });
  await Request.updateOne({ _id: request._id }, { $set: { acceptedOffer: bid._id } });
  return { student, tutor, request, bid };
}

async function settleOffer(fixture: Awaited<ReturnType<typeof prepareOffer>>) {
  await finalizeBidAcceptance(fixture.bid._id.toString(), undefined);
  return Booking.findOne({ bid: fixture.bid._id });
}

async function pendingDirectBooking(fixture: Awaited<ReturnType<typeof prepareOffer>>) {
  const fee = await resolveMarketplaceFees(1000, "PK");
  return Booking.create({
    student: fixture.student._id, tutor: fixture.tutor._id,
    request: fixture.request._id, bid: fixture.bid._id,
    amount: 1000, finalAgreedRate: 1000, currency: "PKR", countryCode: "PK",
    timezone: "UTC", scheduleTimezone: "UTC",
    scheduledStartAt: fixture.request.scheduledStartAt,
    scheduledEndAt: fixture.request.scheduledEndAt,
    pricingUnit: "hour", sessionCount: 1, schedule: "Confirmed time",
    teachingMode: "online", ...fee, platformFee: fee.tutorFee + fee.tax,
    tutorPayout: fee.tutorNet, paymentStatus: "pending",
  });
}

describe("Phase 4 — universal booked-slot integrity", () => {
  it("blocks overlapping marketplace bookings, leaving the losing paid offer for finance reconciliation", async () => {
    const { tutor } = await users();
    const at = base();
    const first = await prepareOffer(tutor, at, timeAt(at, 60));
    const second = await prepareOffer(tutor, timeAt(at, 30), timeAt(at, 90));
    const confirmed = await settleOffer(first);
    expect(confirmed?.paymentStatus).toBe("confirmed");
    await expect(settleOffer(second)).rejects.toMatchObject({ code: "BOOKING_SLOT_TAKEN" });
    expect(await BookedSlot.countDocuments({ tutor: tutor._id })).toBe(1);
    expect(await Booking.countDocuments({ bid: second.bid._id })).toBe(0);
    expect((await Bid.findById(second.bid._id))?.status).toBe("payment_pending");
    expect((await Request.findById(second.request._id))?.status).toBe("awaiting_payment");
  });

  it("blocks marketplace settlement when direct booking holds the same tutor time", async () => {
    const { tutor } = await users();
    const at = base();
    const direct = await prepareOffer(tutor, at, timeAt(at, 60), true);
    const pending = await pendingDirectBooking(direct);
    await confirmExistingBookingPayment(pending._id.toString());
    const market = await prepareOffer(tutor, timeAt(at, 15), timeAt(at, 45));
    await expect(settleOffer(market)).rejects.toMatchObject({ code: "BOOKING_SLOT_TAKEN" });
    expect(await BookedSlot.countDocuments({ tutor: tutor._id })).toBe(1);
    expect((await Booking.findById(pending._id))?.paymentStatus).toBe("confirmed");
  });

  it("blocks direct settlement when a marketplace lesson is already confirmed", async () => {
    const { tutor } = await users();
    const at = base();
    const market = await prepareOffer(tutor, at, timeAt(at, 60));
    await settleOffer(market);
    const direct = await prepareOffer(tutor, timeAt(at, 20), timeAt(at, 50), true);
    const pending = await pendingDirectBooking(direct);
    await expect(confirmExistingBookingPayment(pending._id.toString())).rejects.toMatchObject({ code: "BOOKING_SLOT_TAKEN" });
    expect((await Booking.findById(pending._id))?.paymentStatus).toBe("pending");
    expect(await BookedSlot.countDocuments({ tutor: tutor._id })).toBe(1);
  });

  it("permits adjacent marketplace lessons (one ends when the next starts)", async () => {
    const { tutor } = await users();
    const at = base();
    const earlier = await prepareOffer(tutor, at, timeAt(at, 60));
    const later = await prepareOffer(tutor, timeAt(at, 60), timeAt(at, 120));
    await settleOffer(earlier);
    await settleOffer(later);
    const slots = await BookedSlot.find({ tutor: tutor._id }).sort("startAt");
    expect(slots).toHaveLength(2);
    expect(slots[0].endAt?.getTime()).toBe(slots[1].startAt?.getTime());
  });

  it("does not invent an occupied interval for a request with flexible unscheduled time", async () => {
    const { tutor } = await users();
    const unscheduled = await prepareOffer(tutor, null, null);
    const booking = await settleOffer(unscheduled);
    expect(booking?.paymentStatus).toBe("confirmed");
    expect(await BookedSlot.countDocuments({ tutor: tutor._id })).toBe(0);
  });

  it("rejects an incomplete interval instead of taking payment and silently skipping slot checks", async () => {
    const { tutor } = await users();
    const at = base();
    const invalid = await prepareOffer(tutor, at, null);
    await expect(settleOffer(invalid)).rejects.toMatchObject({ code: "INVALID_SCHEDULE" });
    expect(await Booking.countDocuments({ bid: invalid.bid._id })).toBe(0);
  });

  it("detects partial overlaps against legacy calendar rows missing UTC timestamps", async () => {
    const { tutor } = await users();
    const at = base();
    const student = await User.create({ name: "Legacy Student", email: nextEmail("legacy"), password: "password123", role: "student" });
    const oldBooking = await Booking.create({
      student: student._id, tutor: tutor._id, amount: 1000, finalAgreedRate: 1000,
      subtotal: 1000, studentTotal: 1000, tutorNet: 800, feeConfig: { version: "legacy" },
      schedule: "09:30–10:30", paymentStatus: "confirmed",
    });
    await BookedSlot.create({
      student: student._id, tutor: tutor._id, booking: oldBooking._id,
      date: new Date(at.toISOString().slice(0, 10) + "T00:00:00.000Z"),
      startTime: "09:30", endTime: "10:30", timezone: "UTC",
    });
    const next = await prepareOffer(tutor, at, timeAt(at, 60));
    await expect(settleOffer(next)).rejects.toMatchObject({ code: "BOOKING_SLOT_TAKEN" });
  });
});
