import axios from "axios";
import crypto from "crypto";

// RapidPay is TutorEra's payment gateway (backed by the Safepay processing
// infrastructure - getsafepay.com - hence the underlying URLs/env var names).
export interface RapidpayCheckoutParams {
  amount: number;
  currency?: string;
  reference: string; // The basketId or transaction reference
  metadata?: Record<string, unknown>;
}

// RapidPay Cloudflare Worker URL (kept on the SAFEPAY_* env vars - these are
// the real, already-deployed Render/Cloudflare configuration values).
const RAPIDPAY_WORKER_URL = process.env.SAFEPAY_WORKER_URL || "https://my-safepay-app.workers.dev";
const RAPIDPAY_WEBHOOK_SECRET = process.env.SAFEPAY_WEBHOOK_SECRET || "";

export const rapidpayProvider = {
  /**
   * Request a checkout URL from the Edge Worker
   */
  async createCheckout(params: RapidpayCheckoutParams): Promise<string> {
    try {
      if (!process.env.SAFEPAY_WORKER_URL) {
        console.warn("SAFEPAY_WORKER_URL is unset. Falling back to sandbox mock checkout.");
        return `https://sandbox.api.getsafepay.com/checkout/pay?env=sandbox&reference=${params.reference}&amount=${params.amount}`;
      }

      const response = await axios.post(`${RAPIDPAY_WORKER_URL}/checkout`, {
        amount: params.amount,
        currency: params.currency || "PKR",
        reference: params.reference,
        ...params.metadata,
      });

      if (!response.data || !response.data.checkoutUrl) {
        throw new Error("Invalid response from RapidPay Edge Worker");
      }

      return response.data.checkoutUrl;
    } catch (error: any) {
      console.error("RapidPay Edge Worker checkout failed:", error.response?.data || error.message);
      // Fallback in case the edge worker fails (e.g. locally)
      if (process.env.NODE_ENV !== "production") {
        console.warn("Falling back to sandbox mock checkout due to error.");
        return `https://sandbox.api.getsafepay.com/checkout/pay?env=sandbox&reference=${params.reference}&amount=${params.amount}`;
      }
      throw new Error("Failed to generate RapidPay checkout link via edge worker.");
    }
  },

  /**
   * Verify signature of incoming webhooks directly sent to backend
   * (Though webhooks might now go directly to the Edge worker, if we still receive them here:)
   */
  verifyWebhookSignature(rawBody: Buffer, signature: string, timestamp?: string): boolean {
    if (!signature || !RAPIDPAY_WEBHOOK_SECRET) return false;
    try {
      const expectedSignature = crypto
        .createHmac("sha256", RAPIDPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest("hex");
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    } catch (error) {
      return false;
    }
  },
};
