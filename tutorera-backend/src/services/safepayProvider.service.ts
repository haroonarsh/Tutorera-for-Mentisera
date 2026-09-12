import axios from "axios";
import crypto from "crypto";

export interface SafepayCheckoutParams {
  amount: number;
  currency?: string;
  reference: string; // The basketId or transaction reference
  metadata?: Record<string, unknown>;
}

// Safepay Cloudflare Worker URL
const SAFEPAY_WORKER_URL = process.env.SAFEPAY_WORKER_URL || "https://my-safepay-app.workers.dev";
const SAFEPAY_WEBHOOK_SECRET = process.env.SAFEPAY_WEBHOOK_SECRET || "";

export const safepayProvider = {
  /**
   * Request a checkout URL from the Edge Worker
   */
  async createCheckout(params: SafepayCheckoutParams): Promise<string> {
    try {
      const response = await axios.post(`${SAFEPAY_WORKER_URL}/checkout`, {
        amount: params.amount,
        currency: params.currency || "PKR",
        reference: params.reference,
        ...params.metadata,
      });

      if (!response.data || !response.data.checkoutUrl) {
        throw new Error("Invalid response from Safepay Edge Worker");
      }

      return response.data.checkoutUrl;
    } catch (error: any) {
      console.error("Safepay Edge Worker checkout failed:", error.response?.data || error.message);
      throw new Error("Failed to generate Safepay checkout link via edge worker.");
    }
  },

  /**
   * Verify signature of incoming webhooks directly sent to backend
   * (Though webhooks might now go directly to the Edge worker, if we still receive them here:)
   */
  verifyWebhookSignature(rawBody: Buffer, signature: string, timestamp?: string): boolean {
    if (!signature || !SAFEPAY_WEBHOOK_SECRET) return false;
    try {
      const expectedSignature = crypto
        .createHmac("sha256", SAFEPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest("hex");
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    } catch (error) {
      return false;
    }
  },
};
