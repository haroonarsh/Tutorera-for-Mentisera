import User from "../models/User.model";
import Request from "../models/Request.model";
import Bid from "../models/Bid.model";
import Booking from "../models/Booking.model";
import { finalizeBidAcceptance } from "../controllers/request.controller";

jest.mock("../utils/sendEmail", () => jest.fn().mockResolvedValue(undefined));

describe("direct booking payment finalization", () => {
  it("creates one confirmed booking when the same direct-payment webhook is delivered twice", async () => {
    const student = await User.create({ name: "Student", email: "direct-student@test.com", password: "password123", role: "student" });
    const tutor = await User.create({ name: "Tutor", email: "direct-tutor@test.com", password: "password123", role: "tutor" });
    const request = await Request.create({
      student: student._id,
      subject: "Mathematics",
      level: "O-Level (Cambridge / Edexcel)",
      description: "Direct booking",
      budget: 2500,
      currency: "PKR",
      schedule: "Monday 17:00",
      teachingMode: "online",
      isDirect: true,
      targetTutor: tutor._id,
      status: "awaiting_payment",
    });
    const bid = await Bid.create({
      request: request._id,
      tutor: tutor._id,
      amount: 2500,
      currency: "PKR",
      originalAmount: 2500,
      originalCurrency: "PKR",
      convertedRequestAmount: 2500,
      exchangeRate: 1,
      initialStudentRate: 2500,
      pricingUnit: "hour",
      message: "Direct booking request",
      isDirect: true,
      status: "payment_pending",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    await finalizeBidAcceptance(bid._id.toString(), null);
    await finalizeBidAcceptance(bid._id.toString(), null);

    expect(await Booking.countDocuments({ bid: bid._id })).toBe(1);
    expect((await Booking.findOne({ bid: bid._id }))?.paymentStatus).toBe("confirmed");
    expect((await Bid.findById(bid._id))?.status).toBe("accepted");
    expect((await Request.findById(request._id))?.status).toBe("closed");
  });
});
