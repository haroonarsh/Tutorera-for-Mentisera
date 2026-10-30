import axios from "axios";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { paymentProvider } from "../services/paymentProvider.service";
import { rapidPayProvider } from "../services/rapidPayProvider.service";
import PaymentLedger from "../models/PaymentLedger.model";

describe("RapidPay payment provider integration", () => {
  beforeEach(() => {
    // Use placeholder credentials — real values must be set as env vars in
    // the deployment environment, never committed to source.
    process.env.RAPIDPAY_API_KEY = "test_api_key_placeholder";
    process.env.RAPIDPAY_MERCHANT_ID = "0000";
    process.env.RAPIDPAY_SUPPORTED_MARKETS = "PK,AE,GB,US,SA,IN";
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.RAPIDPAY_API_KEY;
    delete process.env.RAPIDPAY_MERCHANT_ID;
    delete process.env.RAPIDPAY_SUPPORTED_MARKETS;
  });

  it("calls the RapidPay checkout-sessions endpoint and records a ledger row", async () => {
    // Mock the token fetch first, then the session creation.
    const post = jest.spyOn(axios, "post")
      .mockResolvedValueOnce({ data: { access_token: "tok_test", expires_in: 299 } } as never)
      .mockResolvedValueOnce({
        data: {
          sessionId: "cs_session-abc-123",
          clientSecret: "cs_session-abc-123_secret_xyz",
          publishableKey: "pk_test_0000",
        },
      } as never);

    const session = await paymentProvider.createCheckout({
      amount: 100,
      currency: "USD",
      marketCountryCode: "PK",
      customerMobileNo: "03001234567",
      customerEmail: "student@example.test",
      basketId: "BID-rp-test1001",
      description: "Test checkout",
    });

    expect(session.sessionId).toBe("cs_session-abc-123");
    expect(session.clientSecret).toBe("cs_session-abc-123_secret_xyz");
    expect(session.publishableKey).toBe("pk_test_0000");

    const ledger = await PaymentLedger.findOne({ providerTransactionId: "BID-rp-test1001" }).lean();
    expect(ledger).toMatchObject({ grossAmount: 100, currency: "USD" });
    expect(ledger?.metadata).toMatchObject({
      sessionId: "cs_session-abc-123",
      platformAmount: 100,
      platformCurrency: "USD",
    });

    // Token fetch used Basic auth; session creation used Bearer token.
    expect(post).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("/oauth2/token"),
      expect.any(String),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: expect.stringMatching(/^Basic /) }) }),
    );
    expect(post).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("/v1/checkout-sessions"),
      expect.objectContaining({ merchantId: 0, amount: 100, currency: "USD", basketId: "BID-rp-test1001" }),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer tok_test" }) }),
    );
  });

  it("confirms a successful session via poll", async () => {
    await PaymentLedger.create({
      provider: "rapidpay",
      providerTransactionId: "BID-rp-confirm-1",
      eventType: "checkout.created",
      status: "pending",
      grossAmount: 50,
      currency: "USD",
      metadata: { sessionId: "cs_confirm-1", platformAmount: 50, platformCurrency: "USD" },
    });

    jest.spyOn(rapidPayProvider, "getSessionStatus").mockResolvedValueOnce({
      sessionId: "cs_confirm-1",
      status: "success",
      amount: 50,
      currency: "USD",
      reference: "BID-rp-confirm-1",
    });

    const result = await paymentProvider.confirmCheckout("BID-rp-confirm-1");
    expect(result.confirmed).toBe(true);
    expect(result.amount).toBe(50);
    expect(result.currency).toBe("USD");
  });

  it("returns confirmed:false when session is still pending", async () => {
    await PaymentLedger.create({
      provider: "rapidpay",
      providerTransactionId: "BID-rp-pending-1",
      eventType: "checkout.created",
      status: "pending",
      grossAmount: 50,
      currency: "USD",
      metadata: { sessionId: "cs_pending-1", platformAmount: 50, platformCurrency: "USD" },
    });

    jest.spyOn(rapidPayProvider, "getSessionStatus").mockResolvedValueOnce({
      sessionId: "cs_pending-1",
      status: "pending",
      amount: 50,
      currency: "USD",
      reference: "BID-rp-pending-1",
    });

    const result = await paymentProvider.confirmCheckout("BID-rp-pending-1");
    expect(result.confirmed).toBe(false);
    expect(result.sessionStatus).toBe("pending");
  });

  it("rejects a confirmed session where the amount doesn't match (tamper guard)", async () => {
    await PaymentLedger.create({
      provider: "rapidpay",
      providerTransactionId: "BID-rp-mismatch-1",
      eventType: "checkout.created",
      status: "pending",
      grossAmount: 50,
      currency: "USD",
      metadata: { sessionId: "cs_mismatch-1", platformAmount: 50, platformCurrency: "USD" },
    });

    jest.spyOn(rapidPayProvider, "getSessionStatus").mockResolvedValueOnce({
      sessionId: "cs_mismatch-1",
      status: "success",
      amount: 9999,
      currency: "USD",
      reference: "BID-rp-mismatch-1",
    });

    await expect(paymentProvider.confirmCheckout("BID-rp-mismatch-1")).rejects.toMatchObject({
      code: "RAPIDPAY_SESSION_MISMATCH",
    });
  });

  it("rejects a checkout if no session is found for confirmation", async () => {
    await expect(paymentProvider.confirmCheckout("BID-rp-nosession")).rejects.toMatchObject({
      code: "PAYMENT_SESSION_MISSING",
    });
  });

  it("rejects checkout for unsupported market", async () => {
    await expect(
      rapidPayProvider.createCheckout({ amount: 100, currency: "EUR", reference: "BID-unsupported-1", marketCountryCode: "XX" })
    ).rejects.toMatchObject({ code: "RAPIDPAY_MARKET_OR_CURRENCY_UNSUPPORTED" });
  });
});
