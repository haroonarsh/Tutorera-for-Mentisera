import { paymentProvider } from "../services/paymentProvider.service";
import { rapidPayProvider } from "../services/rapidPayProvider.service";
import CheckoutGuard from "../models/CheckoutGuard.model";
import PaymentLedger from "../models/PaymentLedger.model";
import User from "../models/User.model";
import Request from "../models/Request.model";
import Bid from "../models/Bid.model";
import { releaseExpiredPaymentHold } from "../controllers/request.controller";

const checkout = {
  amount: 100, currency: "PKR", basketId: "BID-guard-fixture", customerMobileNo: "03001234567",
  customerEmail: "student@example.test", description: "Fixture", successUrl: "https://example.test/success",
  failureUrl: "https://example.test/failure", checkoutUrl: "https://example.test/processing",
  feeSnapshot: { subtotal: 100, studentFee: 0, tutorFee: 20, tax: 3, studentTotal: 100, tutorNet: 77, platformFee: 23 },
};
const created = { checkoutUrl: "https://checkout.test/1", sessionId: "fixture-session" } as never;
async function previous() {
  await PaymentLedger.create({ provider: "rapidpay", providerTransactionId: checkout.basketId, eventType: "checkout.created", status: "pending", grossAmount: 100, currency: "USD", metadata: { sessionId: "old-session" } });
}
afterEach(() => jest.restoreAllMocks());

describe("checkout creation safety", () => {
  it("only lets one in-flight attempt create a session for the basket", async () => {
    let started!: () => void; let finish!: (value: typeof created) => void;
    const entered = new Promise<void>((resolve) => { started = resolve; });
    const external = new Promise<typeof created>((resolve) => { finish = resolve; });
    const create = jest.spyOn(rapidPayProvider, "createCheckout").mockImplementation(() => { started(); return external; });
    const first = paymentProvider.createCheckout(checkout);
    await entered;
    try {
      await expect(paymentProvider.createCheckout(checkout)).rejects.toMatchObject({ code: "PAYMENT_ATTEMPT_BLOCKED" });
    } finally { finish(created); }
    expect(await first).toBe("https://checkout.test/1");
    expect(create).toHaveBeenCalledTimes(1);
    expect((await CheckoutGuard.findById(checkout.basketId))?.state).toBe("idle");
  });

  it("blocks retries after an ambiguous provider error", async () => {
    const create = jest.spyOn(rapidPayProvider, "createCheckout").mockRejectedValue(new Error("fixture timeout"));
    await expect(paymentProvider.createCheckout(checkout)).rejects.toMatchObject({ code: "PAYMENT_OUTCOME_UNKNOWN" });
    expect((await CheckoutGuard.findById(checkout.basketId))?.state).toBe("uncertain");
    await expect(paymentProvider.createCheckout(checkout)).rejects.toMatchObject({ code: "PAYMENT_ATTEMPT_BLOCKED" });
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("does not create a replacement if prior status or cancellation cannot be verified", async () => {
    await previous();
    jest.spyOn(rapidPayProvider, "getSessionStatus").mockResolvedValue({ status: "pending" } as never);
    const create = jest.spyOn(rapidPayProvider, "createCheckout");
    await expect(paymentProvider.createCheckout(checkout)).rejects.toMatchObject({ code: "PAYMENT_RETRY_UNVERIFIED" });
    expect(create).not.toHaveBeenCalled();
    expect((await CheckoutGuard.findById(checkout.basketId))?.state).toBe("idle");
  });

  it("requires a confirmed closed session before creating the replacement", async () => {
    await previous();
    await PaymentLedger.updateOne({ providerTransactionId: checkout.basketId, eventType: "checkout.created" }, { $set: { status: "failed" } });
    jest.spyOn(rapidPayProvider, "getSessionStatus").mockResolvedValueOnce({ status: "cancelled" } as never);
    const create = jest.spyOn(rapidPayProvider, "createCheckout").mockResolvedValue(created);
    await expect(paymentProvider.createCheckout(checkout)).resolves.toBe("https://checkout.test/1");
    expect(create).toHaveBeenCalledTimes(1);
    expect((await PaymentLedger.findOne({ providerTransactionId: checkout.basketId, eventType: "checkout.created" }))?.status).toBe("pending");
  });

  it("never creates a replacement after the previous session succeeds during cancellation", async () => {
    await previous();
    jest.spyOn(rapidPayProvider, "getSessionStatus").mockResolvedValueOnce({ status: "success" } as never);
    const create = jest.spyOn(rapidPayProvider, "createCheckout");
    await expect(paymentProvider.createCheckout(checkout)).rejects.toMatchObject({ code: "PAYMENT_ALREADY_COMPLETED" });
    expect(create).not.toHaveBeenCalled();
  });

  it("preserves an expired request hold while a checkout outcome remains unknown", async () => {
    const student = await User.create({ name: "Student", email: "guard-student@test.local", password: "password123", role: "student" });
    const tutor = await User.create({ name: "Tutor", email: "guard-tutor@test.local", password: "password123", role: "tutor" });
    const requirement = await Request.create({ student: student._id, subject: "Math", level: "Matric", description: "Math help", budget: 100, schedule: "Evenings", status: "awaiting_payment" });
    const bid = await Bid.create({ request: requirement._id, tutor: tutor._id, amount: 100, initialStudentRate: 100, message: "Available", status: "payment_pending", expiresAt: new Date(Date.now() + 86400000), paymentPendingExpiresAt: new Date(Date.now() - 1000) });
    await Request.updateOne({ _id: requirement._id }, { $set: { acceptedOffer: bid._id } });
    const basket = `BID-${bid.id}`;
    await CheckoutGuard.create({ _id: basket, state: "uncertain", owner: "fixture" });
    await releaseExpiredPaymentHold(requirement._id);
    expect((await Request.findById(requirement._id))?.status).toBe("awaiting_payment");
    await CheckoutGuard.updateOne({ _id: basket }, { $set: { state: "idle" } });
    await PaymentLedger.create({ provider: "rapidpay", providerTransactionId: basket, eventType: "checkout.created", status: "pending", grossAmount: 100, currency: "USD" });
    await releaseExpiredPaymentHold(requirement._id);
    expect((await Bid.findById(bid._id))?.status).toBe("payment_pending");
    await PaymentLedger.updateOne({ providerTransactionId: basket }, { $set: { status: "failed" } });
    await releaseExpiredPaymentHold(requirement._id);
    expect((await Request.findById(requirement._id))?.status).toBe("open");
    expect((await Bid.findById(bid._id))?.status).toBe("submitted");
  });
});
