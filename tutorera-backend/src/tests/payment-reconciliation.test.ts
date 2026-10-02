import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { reconcileSwichCheckout } from "../services/paymentReconciliation.service";
import PaymentLedger from "../models/PaymentLedger.model";
import Bid from "../models/Bid.model";
import Request from "../models/Request.model";
import Booking from "../models/Booking.model";
import { paymentProvider } from "../services/paymentProvider.service";
import * as requestController from "../controllers/request.controller";

describe("Payment reconciliation service (P0-03 browser abandonment & idempotency)", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("reconciles an abandoned browser checkout when Switch payment succeeded", async () => {
    const bidId = "507f191e810c19729de860ea";
    const studentId = "507f191e810c19729de860eb";
    const tutorId = "507f191e810c19729de860ec";
    const reqId = "507f191e810c19729de860ed";
    const basketId = `BID-${bidId}`;
    const fakeCheckout = {
      _id: "507f191e810c19729de860ee",
      provider: "swich",
      providerTransactionId: basketId,
      eventType: "checkout.created",
      status: "pending",
      grossAmount: 100,
      currency: "USD",
      bid: bidId,
      student: studentId,
      tutor: tutorId,
      createdAt: new Date(Date.now() - 5 * 60 * 1000),
    };

    jest.spyOn(PaymentLedger, "findOne").mockReturnValue({
      sort: jest.fn().mockResolvedValue(fakeCheckout),
    } as any);

    jest.spyOn(PaymentLedger, "exists").mockResolvedValue(null as any);

    jest.spyOn(paymentProvider, "confirmCheckout").mockResolvedValue({
      confirmed: true,
      amount: 100,
      currency: "USD",
      sessionStatus: "Success",
      raw: {},
    });

    jest.spyOn(Bid, "findById").mockResolvedValue({
      _id: bidId,
      request: reqId,
      tutor: tutorId,
    } as any);

    jest.spyOn(Request, "findById").mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: reqId,
        student: studentId,
      }),
    } as any);

    const finalizeSpy = jest.spyOn(requestController, "finalizeBidAcceptance").mockResolvedValue({} as any);
    const findOneAndUpdateSpy = jest.spyOn(PaymentLedger, "findOneAndUpdate").mockResolvedValue({} as any);

    const result = await reconcileSwichCheckout(basketId);

    expect(result.confirmed).toBe(true);
    expect(result.sessionStatus).toBe("Success");
    expect(result.finalized).toBe(true);
    expect(finalizeSpy).toHaveBeenCalledWith(bidId, undefined);
    expect(findOneAndUpdateSpy).toHaveBeenCalledWith(
      { providerTransactionId: basketId, eventType: "payment.succeeded" },
      expect.objectContaining({
        $setOnInsert: expect.objectContaining({
          providerTransactionId: basketId,
          eventType: "payment.succeeded",
          status: "succeeded",
          grossAmount: 100,
          currency: "USD",
        }),
      }),
      { upsert: true, new: true }
    );
  });

  it("does not re-finalize or duplicate if checkout was already settled (idempotency)", async () => {
    const basketId = "BID-507f191e810c19729de860ea";
    const fakeCheckout = {
      _id: "507f191e810c19729de860ee",
      provider: "swich",
      providerTransactionId: basketId,
      eventType: "checkout.created",
      status: "pending",
      grossAmount: 100,
      currency: "USD",
    };

    jest.spyOn(PaymentLedger, "findOne").mockReturnValue({
      sort: jest.fn().mockResolvedValue(fakeCheckout),
    } as any);

    jest.spyOn(PaymentLedger, "exists").mockResolvedValue({ _id: "settled_ledger_1" } as any);

    const confirmSpy = jest.spyOn(paymentProvider, "confirmCheckout");
    const finalizeSpy = jest.spyOn(requestController, "finalizeBidAcceptance");

    const result = await reconcileSwichCheckout(basketId);

    expect(result.confirmed).toBe(true);
    expect(result.sessionStatus).toBe("Success");
    expect(result.finalized).toBe(false);
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(finalizeSpy).not.toHaveBeenCalled();
  });

  it("marks checkout failed when Switch returns Failed session status", async () => {
    const bidId = "507f191e810c19729de860ea";
    const studentId = "507f191e810c19729de860eb";
    const tutorId = "507f191e810c19729de860ec";
    const basketId = `BID-${bidId}`;
    const fakeCheckout = {
      _id: "507f191e810c19729de860ee",
      provider: "swich",
      providerTransactionId: basketId,
      eventType: "checkout.created",
      status: "pending",
      grossAmount: 100,
      currency: "USD",
      bid: bidId,
      student: studentId,
      tutor: tutorId,
      createdAt: new Date(),
    };

    jest.spyOn(PaymentLedger, "findOne").mockReturnValue({
      sort: jest.fn().mockResolvedValue(fakeCheckout),
    } as any);

    jest.spyOn(PaymentLedger, "exists").mockResolvedValue(null as any);

    jest.spyOn(paymentProvider, "confirmCheckout").mockResolvedValue({
      confirmed: false,
      amount: 100,
      currency: "USD",
      sessionStatus: "Failed",
      raw: {},
    });

    const updateOneSpy = jest.spyOn(PaymentLedger, "updateOne").mockResolvedValue({} as any);
    const findOneAndUpdateSpy = jest.spyOn(PaymentLedger, "findOneAndUpdate").mockResolvedValue({} as any);

    const result = await reconcileSwichCheckout(basketId);

    expect(result.confirmed).toBe(false);
    expect(result.sessionStatus).toBe("Failed");
    expect(result.finalized).toBe(false);
    expect(updateOneSpy).toHaveBeenCalledWith(
      { _id: "507f191e810c19729de860ee", status: "pending" },
      { $set: { status: "failed", "metadata.sessionStatus": "Failed" } }
    );
    expect(findOneAndUpdateSpy).toHaveBeenCalledWith(
      { providerTransactionId: basketId, eventType: "payment.failed" },
      expect.objectContaining({
        $setOnInsert: expect.objectContaining({
          providerTransactionId: basketId,
          eventType: "payment.failed",
          status: "failed",
        }),
      }),
      { upsert: true, new: true }
    );
  });
});
