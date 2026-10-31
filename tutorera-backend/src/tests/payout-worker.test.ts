import User from "../models/User.model";
import Booking from "../models/Booking.model";
import { processPendingPayouts } from "../services/payout.service";

describe("scheduled payout safety", () => {
  it("skips a booking below the PKR minimum threshold without creating a payout", async () => {
    const [student, tutor] = await User.create([
      { name: "Payout Student", email: "payout-worker-student@test.com", password: "password123", role: "student" },
      { name: "Payout Tutor", email: "payout-worker-tutor@test.com", password: "password123", role: "tutor" },
    ]);
    // tutorPayout: 1540 PKR is below the 2500 PKR minimum threshold
    const booking = await Booking.create({ student: student._id, tutor: tutor._id, amount: 2000, finalAgreedRate: 2000, pricingUnit: "session", sessionCount: 1, subtotal: 2000, studentFee: 0, tutorFee: 400, tax: 60, studentTotal: 2000, tutorNet: 1540, feeConfig: { version: "test" }, platformFee: 460, tutorPayout: 1540, currency: "PKR", schedule: "Evening", teachingMode: "online", status: "completed", paymentStatus: "confirmed", payoutStatus: "pending" });

    const result = await processPendingPayouts();
    expect(result.scanned).toBe(1);
    expect(result.skippedBelowThreshold).toBe(1);
    expect(result.requested).toBe(0);
    expect(result.failed).toBe(0);
    const unchanged = await Booking.findById(booking._id).lean();
    expect(unchanged?.payoutStatus).toBe("pending");
    expect(unchanged?.payoutPaidAt).toBeUndefined();
  });
});
