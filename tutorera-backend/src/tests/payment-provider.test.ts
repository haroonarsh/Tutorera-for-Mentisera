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

  it("calls the RapidPay checkout endpoint and records a ledger row", async () => {
    // CONFIRM_WITH_DOCS: update the expected URL path and response body once
    // merchant documentation confirms the real endpoint and response shape.
    const post = jest.spyOn(axios, "post").mockResolvedValueOnce({
      data: {
        checkoutUrl: "https://pay.rapidpay.co/checkout/session-abc-123",
        sessionId: "session-abc-123",
      },
    } as never);

    const checkoutUrl = await paymentProvider.createCheckout({
      amount: 100,
      currency: "USD",
      marketCountryCode: "PK",
      customerMobileNo: "03001234567",
      customerEmail: "student@example.test",
      basketId: "BID-rp-test1001",
      description: "Test checkout",
      successUrl: "https://example.test/success",
      failureUrl: "https://example.test/failure",
      checkoutUrl: "https://example.test/processing",
      feeSnapshot: {
        subtotal: 100, studentFee: 0, tutorFee: 0, tax: 0,
        studentTotal: 100, tutorNet: 100, platformFee: 0, gatewayFee: 0,
      },
    });

    expect(checkoutUrl).toBe("https://pay.rapidpay.co/checkout/session-abc-123");

    const ledger = await PaymentLedger.findOne({ providerTransactionId: "BID-rp-test1001" }).lean();
    expect(ledger).toMatchObject({ grossAmount: 100, currency: "USD" });
    expect(ledger?.metadata).toMatchObject({ sessionId: "session-abc-123", platformAmount: 100, platformCurrency: "USD" });

    // Verify the provider request carried the API key as a Bearer token.
    expect(post).toHaveBeenCalledWith(
      expect.stringContaining("/v1/checkout"),
      expect.objectContaining({
        merchantId: "0000",
        amount: 100,
        currency: "USD",
        reference: "BID-rp-test1001",
      }),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test_api_key_placeholder",
        }),
      }),
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
      metadata: { sessionId: "session-confirm-1", platformAmount: 50, platformCurrency: "USD" },
    });

    jest.spyOn(rapidPayProvider, "getSessionStatus").mockResolvedValueOnce({
      sessionId: "session-confirm-1",
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
      metadata: { sessionId: "session-pending-1", platformAmount: 50, platformCurrency: "USD" },
    });

    jest.spyOn(rapidPayProvider, "getSessionStatus").mockResolvedValueOnce({
      sessionId: "session-pending-1",
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
      metadata: { sessionId: "session-mismatch-1", platformAmount: 50, platformCurrency: "USD" },
    });

    jest.spyOn(rapidPayProvider, "getSessionStatus").mockResolvedValueOnce({
      sessionId: "session-mismatch-1",
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

  it("rejects checkout for unsupported market/currency", async () => {
    await expect(
      rapidPayProvider.createCheckout({ amount: 100, currency: "EUR", reference: "BID-eur-1" })
    ).rejects.toMatchObject({ code: "RAPIDPAY_MARKET_OR_CURRENCY_UNSUPPORTED" });
  });
});
