import User from "../models/User.model";
import Booking from "../models/Booking.model";
import { getMyPayouts, requestPayout } from "../controllers/earnings.controller";

const response = () => {
  const res: any = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

describe("tutor payout history", () => {
  it("rejects non-tutors and invalid filters", async () => {
    const res = response();
    await getMyPayouts({ user: { role: "student" }, query: {} } as any, res);
    expect(res.status).toHaveBeenCalledWith(403);
    const tutorRes = response();
    await getMyPayouts({ user: { role: "tutor" }, query: { status: "settled-ish" } } as any, tutorRes);
    expect(tutorRes.status).toHaveBeenCalledWith(400);
  });

  it("calculates totals across every result, not only the current page", async () => {
    const [student, tutor] = await User.create([
      { name: "Student", email: "history-student@test.com", password: "password123", role: "student" },
      { name: "Tutor", email: "history-tutor@test.com", password: "password123", role: "tutor" },
    ]);
    const base = { student: student._id, tutor: tutor._id, amount: 1000, finalAgreedRate: 1000, pricingUnit: "session", sessionCount: 1, subtotal: 1000, studentFee: 0, tutorFee: 200, tax: 30, studentTotal: 1000, tutorNet: 770, feeConfig: { version: "test" }, platformFee: 230, tutorPayout: 770, schedule: "Evening", teachingMode: "online", status: "completed", paymentStatus: "confirmed" };
    await Booking.create({ ...base, payoutStatus: "pending" } as any);
    await Booking.create({ ...base, payoutStatus: "paid", payoutPaidAt: new Date() } as any);
    const res = response();
    await getMyPayouts({ user: { _id: tutor._id, role: "tutor" }, query: { limit: "1" } } as any, res);
    const body = res.json.mock.calls[0][0];
    expect(body.payouts).toHaveLength(1);
    expect(body.stats).toMatchObject({ totalPayoutAmount: 1540, pendingAmount: 770, paidAmount: 770 });
  });

  it("records request and processing timestamps", async () => {
    const [student, tutor] = await User.create([
      { name: "Student Two", email: "request-student@test.com", password: "password123", role: "student" },
      { name: "Tutor Two", email: "request-tutor@test.com", password: "password123", role: "tutor" },
    ]);
    const booking = await Booking.create({ student: student._id, tutor: tutor._id, amount: 1000, finalAgreedRate: 1000, pricingUnit: "session", sessionCount: 1, subtotal: 1000, studentFee: 0, tutorFee: 200, tax: 30, studentTotal: 1000, tutorNet: 770, feeConfig: { version: "test" }, platformFee: 230, tutorPayout: 770, schedule: "Evening", teachingMode: "online", status: "completed", paymentStatus: "confirmed", payoutStatus: "pending" });
    const res = response();
    await requestPayout({ user: { _id: tutor._id, role: "tutor" }, params: { bookingId: booking._id.toString() } } as any, res);
    const updated = await Booking.findById(booking._id).lean();
    expect(updated?.payoutStatus).toBe("processing");
    expect(updated?.payoutRequestedAt).toBeInstanceOf(Date);
    expect(updated?.payoutProcessingAt).toBeInstanceOf(Date);
  });
});
