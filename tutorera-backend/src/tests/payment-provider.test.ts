import axios from "axios";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { paymentProvider } from "../services/paymentProvider.service";
import { swichProvider } from "../services/swichProvider.service";

describe("Swich Payment Session integration", () => {
  beforeEach(() => {
    process.env.SWICH_CLIENT_ID = "swich_test_client_id";
    process.env.SWICH_CLIENT_SECRET = "swich_test_client_secret_123456";
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.SWICH_CLIENT_ID;
    delete process.env.SWICH_CLIENT_SECRET;
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
      currency: "PKR",
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

    // Confirmed real contract: token request is JSON (not form-urlencoded),
    // hits the separate sandbox-auth host, not the main api host.
    expect(post).toHaveBeenCalledWith(
      "https://sandbox-auth.swichnow.com/connect/token",
      expect.objectContaining({
        client_id: "swich_test_client_id",
        client_secret: "swich_test_client_secret_123456",
        grant_type: "client_credentials",
      }),
      expect.anything()
    );

    // Confirmed real contract: payment session creation body shape.
    expect(post).toHaveBeenCalledWith(
      "https://sandbox-api.swichnow.com/gateway/paymentsession/initiate",
      expect.objectContaining({
        amount: 100,
        currency: "PKR",
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

  it("rejects unsupported non-PKR checkout before contacting Swich", async () => {
    const post = jest.spyOn(axios, "post");

    await expect(
      swichProvider.createCheckout({
        amount: 100,
        currency: "AED",
        reference: "BID-aed-1",
        metadata: {
          studentMobileNo: "+971500000000",
          studentEmail: "student@example.test",
          successUrl: "https://example.test/success",
        },
      })
    ).rejects.toMatchObject({ code: "SWICH_CURRENCY_UNSUPPORTED", statusCode: 409 });

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
        currency: "PKR",
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