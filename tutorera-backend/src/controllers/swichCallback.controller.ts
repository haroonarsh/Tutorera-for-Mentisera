import crypto from "crypto";
import { Request, Response } from "express";
import logger from "../config/logger";
import { reconcileSwichCallback } from "../services/paymentReconciliation.service";

const queryValue = (query: Request["query"], ...keys: string[]): string => {
  for (const key of keys) {
    const value = query[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
};

const safeEqual = (provided: string, expected: string): boolean => {
  const a = Buffer.from(provided.toLowerCase(), "utf8");
  const b = Buffer.from(expected.toLowerCase(), "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

/**
 * Swich PayIN callback. Register this public GET URL with Swich:
 * https://<public-backend-host>/api/v1/payments/swich/callback
 *
 * The callback is not a browser endpoint: it verifies Swich's documented
 * HMAC before reconciling a ledger-backed checkout idempotently.
 */
export const handleSwichCallback = async (req: Request, res: Response): Promise<void> => {
  const secret = process.env.SWICH_CALLBACK_SECRET?.trim();
  if (!secret) {
    res.status(503).json({ success: false, message: "Payment callback verification is not configured." });
    return;
  }

  const customerTransactionId = queryValue(req.query, "CustomerTransactionId", "customerTransactionId");
  const basketId = queryValue(req.query, "OrderId", "orderId");
  const amount = queryValue(req.query, "Amount", "amount");
  const status = queryValue(req.query, "Status", "status");
  const checksum = queryValue(req.query, "checksum", "Checksum");
  if (!customerTransactionId || !basketId || !amount || !status || !checksum) {
    res.status(400).json({ success: false, message: "Incomplete payment callback." });
    return;
  }

  const signedValue = `SWCallback:${customerTransactionId}:${basketId}:${amount}:${status}`;
  const expectedChecksum = crypto.createHmac("sha256", secret).update(signedValue, "utf8").digest("hex");
  if (!safeEqual(checksum, expectedChecksum)) {
    logger.warn({ basketId, customerTransactionId }, "Rejected Swich callback with invalid checksum");
    res.status(401).json({ success: false, message: "Invalid payment callback signature." });
    return;
  }

  try {
    const result = await reconcileSwichCallback({ basketId, customerTransactionId, amount, status });
    logger.info({ basketId, customerTransactionId, status, confirmed: result.confirmed }, "Processed verified Swich payment callback");
    res.status(200).json({ success: true, received: true, confirmed: result.confirmed });
  } catch (error) {
    logger.error({ err: error, basketId, customerTransactionId }, "Failed to reconcile verified Swich callback");
    res.status(500).json({ success: false, message: "Payment callback could not be processed." });
  }
};
