import axios from "axios";
import crypto from "crypto";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { paymentProvider } from "../services/paymentProvider.service";
import { swichProvider } from "../services/swichProvider.service";

describe("Swich Payment Session integration", () => {
  beforeEach(() => {
    process.env.SWICH_CLIENT_ID = "swich_test_client_id";
    process.env.SWICH_CLIENT_SECRET = "swich_test_client_secret_123456";
    process.env.SWICH_SUPPORTED_MARKETS = "PK,AE,GB,US,SA,IN";
    process.env.SWICH_SUPPORTED_CURRENCIES = "USD";
    process.env.SWICH_CHECKOUT_MODE = "session";
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.SWICH_CLIENT_ID;
    delete process.env.SWICH_CLIENT_SECRET;
    delete process.env.SWICH_SUPPORTED_MARKETS;
    delete process.env.SWICH_SUPPORTED_CURRENCIES;
    delete process.env.SWICH_CHECKOUT_MODE;
    delete process.env.SWICH_PWA_BASE_URL;
    delete process.env.SWICH_CALLBACK_SECRET;
  });

  it("fetches a token then creates a payment session with the confirmed field shape", async () => {
    const post = jest.spyOn(axios, "post").mockImplementation(async (url: string) => {
      if (url.includes("/connect/token")) {
        return {
          data: { access_token: "swich_test_access_token", token_type: "Bearer", expires_in: 3600 },
        } as any;
      }
      if (url.includes("/gateway/paymentsession/initiate")) {
        return {
          data: {
            status: "SUCCESS",
            code: "0000",
            message: "Payment session created successfully.",
            timestamp: "2026-08-27T10:15:32",
            url: "https://paymentsession.swichnow.com/PaymentSession?Id=test-session-guid-123",
          },
        } as any;
      }
      throw new Error(`Unexpected POST to ${url}`);
    });

    const checkoutUrl = await paymentProvider.createCheckout({
      amount: 100,
      currency: "USD",
      customerMobileNo: "03001234567",
      customerEmail: "student@example.test",
      basketId: "BID-test1001",
      description: "Test checkout",
      successUrl: "https://example.test/success",
      failureUrl: "https://example.test/failure",
      checkoutUrl: "https://example.test/processing",
      feeSnapshot: {
        subtotal: 100,
        studentFee: 0,
        tutorFee: 0,
        tax: 0,
        studentTotal: 100,
        tutorNet: 100,
        platformFee: 0,
        gatewayFee: 0,
      },
    });

    expect(checkoutUrl).toBe("https://paymentsession.swichnow.com/PaymentSession?Id=test-session-guid-123");

    // Swich's documented OAuth contract is form-urlencoded and uses the
    // separate auth host rather than the main API host.
    expect(post).toHaveBeenCalledWith(
      "https://sandbox-auth.swichnow.com/connect/token",
      expect.stringContaining("client_id=swich_test_client_id"),
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/x-www-form-urlencoded",
        }),
      }),
    );

    // Confirmed real contract: payment session creation body shape.
    expect(post).toHaveBeenCalledWith(
      "https://sandbox-api.swichnow.com/gateway/paymentsession/initiate",
      expect.objectContaining({
        amount: 100,
        currency: "USD",
        billReferenceNo: "BID-test1001",
        successURL: "https://example.test/success",
        failedURL: "https://example.test/failure",
        categoryList: expect.arrayContaining(["ewallet", "visamastercardpayment", "bankaccount", "rtpnowpayment"]),
        customerDetails: expect.objectContaining({
          email: "student@example.test",
          msisdn: "03001234567",
        }),
        // Required-but-empty for one-off payments per Swich's own docs.
        recurringDetails: expect.objectContaining({ recurringPaymentType: 0 }),
      }),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer swich_test_access_token",
        }),
      })
    );
  });

  it("rejects unsupported non-USD checkout before contacting Swich", async () => {
    const post = jest.spyOn(axios, "post");

    await expect(
      swichProvider.createCheckout({
        amount: 100,
        currency: "PKR",
        reference: "BID-pkr-1",
        metadata: {
          studentMobileNo: "+971500000000",
          studentEmail: "student@example.test",
          successUrl: "https://example.test/success",
        },
      })
    ).rejects.toMatchObject({ code: "SWICH_MARKET_OR_CURRENCY_UNSUPPORTED", statusCode: 409 });

    expect(post).not.toHaveBeenCalled();
  });

  it("builds a signed hosted PWA checkout URL without requesting an OAuth token", async () => {
    process.env.SWICH_CHECKOUT_MODE = "pwa";
    process.env.SWICH_PWA_BASE_URL = "https://payin-pwa.swichnow.com";
    process.env.SWICH_CALLBACK_SECRET = "PWA_SECRET_KEY";
    const post = jest.spyOn(axios, "post");

    const result = await swichProvider.createCheckout({
      amount: 125,
      currency: "USD",
      reference: "BID-pwa-1001",
      metadata: {
        studentMobileNo: "03001234567",
        studentEmail: "student@example.test",
        successUrl: "https://example.test/success",
        description: "TUTORERA tutoring session",
      },
    });

    const url = new URL(result.checkoutUrl);
    const item = "TUTORERA tutoring session";
    const expectedChecksum = crypto.createHmac("sha256", "PWA_SECRET_KEY").update(`Swich:BID-pwa-1001:${item}:125.00`, "utf8").digest("hex");
    expect(result).toMatchObject({ paymentSessionGuid: "", mode: "pwa" });
    expect(url.origin).toBe("https://payin-pwa.swichnow.com");
    expect(url.searchParams.get("customerTransactionId")).toBe("BID-pwa-1001");
    expect(url.searchParams.get("currency")).toBe("USD");
    expect(url.searchParams.get("checksum")).toBe(expectedChecksum);
    expect(post).not.toHaveBeenCalled();
  });

  it("confirms a successful payment session via poll (no webhook — Swich Payment Session has none documented)", async () => {
    jest.spyOn(axios, "post").mockResolvedValue({
      data: { access_token: "swich_test_access_token", token_type: "Bearer", expires_in: 3600 },
    } as any);
    const get = jest.spyOn(axios, "get").mockResolvedValue({
      data: {
        status: "SUCCESS",
        paymentSessionGuid: "test-session-guid-123",
        amount: 100,
        currency: "USD",
        billReferenceNo: "BID-test1001",
        sessionStatus: "Success",
        remainingAttempts: 9,
        remainingSeconds: 1000,
        createdAt: "2026-08-27T10:15:32",
        expiryAt: "2026-08-27T10:45:32",
      },
    } as any);

    const result = await swichProvider.getPaymentSessionStatus("test-session-guid-123");

    expect(result.sessionStatus).toBe("Success");
    expect(get).toHaveBeenCalledWith(
      "https://sandbox-api.swichnow.com/gateway/paymentsession/get",
      expect.objectContaining({
        params: { paymentSessionGuid: "test-session-guid-123" },
        headers: expect.objectContaining({ Authorization: "Bearer swich_test_access_token" }),
      })
    );
  });
});
