import crypto from "crypto";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import request from "supertest";

const reconcileSwichCallback = jest.fn();
jest.mock("../services/paymentReconciliation.service", () => ({ reconcileSwichCallback }));

import app from "../app";

const callbackSecret = "test-swich-callback-secret";
const checksumFor = (customerTransactionId: string, orderId: string, amount: string, status: string) =>
  crypto.createHmac("sha256", callbackSecret).update(`SWCallback:${customerTransactionId}:${orderId}:${amount}:${status}`, "utf8").digest("hex");

describe("Swich PayIN callback", () => {
  beforeEach(() => {
    process.env.SWICH_CALLBACK_SECRET = callbackSecret;
    reconcileSwichCallback.mockResolvedValue({ confirmed: true, finalized: true });
  });

  afterEach(() => {
    delete process.env.SWICH_CALLBACK_SECRET;
    jest.clearAllMocks();
  });

  it("verifies the documented checksum before reconciling a payment", async () => {
    const values = { CustomerTransactionId: "swich-transaction-1", OrderId: "BID-123", Amount: "125.00", Status: "Success" };
    const response = await request(app)
      .get("/api/v1/payments/swich/callback")
      .query({ ...values, checksum: checksumFor(values.CustomerTransactionId, values.OrderId, values.Amount, values.Status) });

    expect(response.status).toBe(200);
    expect(reconcileSwichCallback).toHaveBeenCalledWith({ basketId: "BID-123", customerTransactionId: "swich-transaction-1", amount: "125.00", status: "Success" });
  });

  it("rejects forged callbacks without invoking payment reconciliation", async () => {
    const response = await request(app)
      .get("/api/v1/payments/swich/callback")
      .query({ CustomerTransactionId: "forged", OrderId: "BID-123", Amount: "125.00", Status: "Success", checksum: "not-a-valid-signature" });

    expect(response.status).toBe(401);
    expect(reconcileSwichCallback).not.toHaveBeenCalled();
  });
});
