import axios from "axios";
import crypto from "crypto";

// TUTORERA uses Rapid Gateway directly from the trusted backend. There is no
// intermediate payment Worker or second payment authority in the flow.
//
// CONFIRMED against a real working request captured via browser DevTools on
// 2026-09-21 (Rapid Gateway's own documentation/demo page). The previous
// version of this file (introduced in the "Replace SafePay worker with
// direct Rapid Gateway integration" commit) was built against a generic
// Stripe-like POST /v1/payments JSON API that does not exist for this
// provider — it was never tested and never worked. The real API:
//
//   1. Fetch a Bearer token via OAuth2 client_credentials grant.
//   2. POST the transaction as application/x-www-form-urlencoded with
//      SCREAMING_SNAKE_CASE field names.
//   3. The response is an HTTP 302 redirect — the checkout URL is in the
//      Location header, NOT a JSON body field.
export interface RapidpayCheckoutParams {
  amount: number;
  currency?: string;
  reference: string;
  metadata?: Record<string, unknown>;
}

const DEFAULT_API_BASE_URL = "https://secure.rapid-gateway.com";
const WEBHOOK_TOLERANCE_SECONDS = 5 * 60;

// Token cache — avoids fetching a new token on every checkout. Tokens are
// short-lived (confirmed expires_in: 299 seconds ≈ 5 minutes in sandbox), so
// cache with a safety margin and refetch once close to expiry.
let cachedToken: { accessToken: string; expiresAt: number } | null = null;

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    const error = new Error(`${name} is not configured`) as Error & { statusCode?: number; code?: string };
    error.statusCode = 503;
    error.code = "PAYMENT_GATEWAY_NOT_CONFIGURED";
    throw error;
  }
  return value;
}

function normalizePakistaniPhone(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("+")) return trimmed.replace(/[^+\d]/g, "");

  const digits = trimmed.replace(/\D/g, "");
  if (digits.startsWith("92")) return `+${digits}`;
  if (digits.startsWith("03") && digits.length === 11) return `+92${digits.slice(1)}`;
  return trimmed;
}

function safeEqualHex(received: string, expected: string): boolean {
  const normalizedReceived = received.replace(/^sha256=/i, "").trim().toUpperCase();
  const normalizedExpected = expected.trim().toUpperCase();
  if (!normalizedReceived || normalizedReceived.length !== normalizedExpected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(normalizedReceived, "utf8"), Buffer.from(normalizedExpected, "utf8"));
}

/**
 * Fetch (or reuse a cached) OAuth2 Bearer token via client_credentials grant.
 *
 * Confirmed real request:
 *   POST {apiBaseUrl}/oauth2/token
 *   Authorization: Basic base64(clientId:clientSecret)
 *   Content-Type: application/x-www-form-urlencoded
 *   Body: grant_type=client_credentials
 *
 * Sandbox uses a shared public test credential ("client" / "secret" — the
 * literal strings, documented on Rapid Gateway's own sandbox testing page,
 * same pair for every merchant). Live requires real per-merchant
 * credentials issued by Rapid Gateway — RAPID_GATEWAY_CLIENT_ID and
 * RAPID_GATEWAY_CLIENT_SECRET must be set before RAPID_GATEWAY_ENV is ever
 * switched to "live".
 */
async function getAccessToken(apiBaseUrl: string): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now) {
    return cachedToken.accessToken;
  }

  const isLive = (process.env.RAPID_GATEWAY_ENV || "sandbox").toLowerCase() === "live";
  const clientId = isLive ? requireEnv("RAPID_GATEWAY_CLIENT_ID") : (process.env.RAPID_GATEWAY_CLIENT_ID?.trim() || "client");
  const clientSecret = isLive ? requireEnv("RAPID_GATEWAY_CLIENT_SECRET") : (process.env.RAPID_GATEWAY_CLIENT_SECRET?.trim() || "secret");

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`, "utf8").toString("base64");

  try {
    const response = await axios.post(
      `${apiBaseUrl}/oauth2/token`,
      new URLSearchParams({ grant_type: "client_credentials" }).toString(),
      {
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        timeout: 15_000,
      }
    );

    const accessToken = response.data?.access_token;
    const expiresIn = Number(response.data?.expires_in) || 240; // seconds
    if (!accessToken || typeof accessToken !== "string") {
      throw new Error("Rapid Gateway token response missing access_token");
    }

    // Refresh 30 seconds before actual expiry as a safety margin.
    cachedToken = { accessToken, expiresAt: now + (expiresIn - 30) * 1000 };
    return accessToken;
  } catch (error: any) {
    const status = error?.response?.status;
    const wrapped = new Error(
      status === 401
        ? "Rapid Gateway rejected the client credentials (invalid_client) — check RAPID_GATEWAY_CLIENT_ID/SECRET"
        : `Rapid Gateway token request failed${error?.message ? `: ${error.message}` : ""}`
    ) as Error & { statusCode?: number; code?: string };
    wrapped.statusCode = 502;
    wrapped.code = "RAPID_GATEWAY_TOKEN_FAILED";
    throw wrapped;
  }
}

export const rapidpayProvider = {
  /**
   * Create a hosted Rapid Gateway checkout directly from the Render backend.
   * Customer card/wallet data never enters TUTORERA's application servers.
   *
   * Confirmed real request:
   *   POST {apiBaseUrl}/sandbox/process-transaction   (sandbox)
   *   POST {apiBaseUrl}/rapid/process-transaction      (live — path per
   *        original pre-rewrite integration; confirm with Rapid Gateway
   *        support before flipping RAPID_GATEWAY_ENV to "live")
   *   Authorization: Bearer <access_token from getAccessToken()>
   *   Content-Type: application/x-www-form-urlencoded
   *   Body fields (SCREAMING_SNAKE_CASE, confirmed via DevTools capture):
   *     MERCHANT_ID, MERCHANT_NAME, TXNAMT, CURRENCY_CODE,
   *     CUSTOMER_MOBILE_NO, BASKET_ID, SUCCESS_URL, FAILURE_URL
   *   Response: HTTP 302 redirect. The checkout URL is in the Location
   *   header — NOT a JSON body. axios must be told not to auto-follow the
   *   redirect (maxRedirects: 0) so the Location header stays readable.
   */
  async createCheckout(params: RapidpayCheckoutParams): Promise<string> {
    const apiBaseUrl = (process.env.RAPID_GATEWAY_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, "");
    const merchantId = requireEnv("RAPID_GATEWAY_MERCHANT_ID");
    const merchantName = process.env.RAPID_GATEWAY_MERCHANT_NAME?.trim() || "TUTORERA";
    const isLive = (process.env.RAPID_GATEWAY_ENV || "sandbox").toLowerCase() === "live";
    const transactionPath = isLive ? "/rapid/process-transaction" : "/sandbox/process-transaction";

    const currency = (params.currency || "PKR").toUpperCase();
    if (currency !== "PKR") {
      const error = new Error(
        `Rapid Gateway checkout is currently enabled only for PKR transactions; received ${currency}.`
      ) as Error & { statusCode?: number; code?: string };
      error.statusCode = 409;
      error.code = "RAPID_GATEWAY_CURRENCY_UNSUPPORTED";
      throw error;
    }

    if (!Number.isFinite(params.amount) || params.amount <= 0) {
      const error = new Error("Payment amount must be a positive number") as Error & { statusCode?: number; code?: string };
      error.statusCode = 400;
      error.code = "INVALID_PAYMENT_AMOUNT";
      throw error;
    }

    const metadata = params.metadata || {};
    const phone = normalizePakistaniPhone(String(metadata.studentMobileNo || ""));
    const successUrl = String(metadata.successUrl || metadata.checkoutUrl || "").trim();
    const failureUrl = String(metadata.failureUrl || successUrl).trim();

    if (!successUrl) {
      const error = new Error("Rapid Gateway success URL is missing") as Error & { statusCode?: number; code?: string };
      error.statusCode = 500;
      error.code = "PAYMENT_RETURN_URL_MISSING";
      throw error;
    }

    if (!phone) {
      const error = new Error("A customer mobile number is required for checkout") as Error & { statusCode?: number; code?: string };
      error.statusCode = 400;
      error.code = "PAYMENT_CUSTOMER_MISSING";
      throw error;
    }

    const accessToken = await getAccessToken(apiBaseUrl);

    const formBody = new URLSearchParams({
      MERCHANT_ID: merchantId,
      MERCHANT_NAME: merchantName,
      TXNAMT: String(params.amount),
      CURRENCY_CODE: currency,
      CUSTOMER_MOBILE_NO: phone,
      BASKET_ID: params.reference,
      SUCCESS_URL: successUrl,
      FAILURE_URL: failureUrl,
    });

    try {
      const response = await axios.post(`${apiBaseUrl}${transactionPath}`, formBody.toString(), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "*/*",
        },
        timeout: 15_000,
        maxRedirects: 0, // Critical — the checkout URL lives in the Location header of a 302, not a JSON body.
        validateStatus: (status) => status === 302 || (status >= 200 && status < 300),
      });

      const checkoutUrl = response.headers?.location;
      if (!checkoutUrl || typeof checkoutUrl !== "string") {
        throw new Error("Rapid Gateway returned no redirect Location header");
      }

      return checkoutUrl;
    } catch (error: any) {
      if (error?.statusCode) throw error;

      const status = error?.response?.status;
      const gatewayMessage = error?.response?.data?.message || error?.response?.data?.error;
      const wrapped = new Error(
        gatewayMessage ? `Rapid Gateway checkout failed: ${gatewayMessage}` : `Rapid Gateway checkout failed${error?.message ? `: ${error.message}` : ""}`
      ) as Error & { statusCode?: number; code?: string };
      wrapped.statusCode = status && status >= 400 && status < 500 ? status : 502;
      wrapped.code = "RAPID_GATEWAY_CHECKOUT_FAILED";
      throw wrapped;
    }
  },

  /**
   * Verify Rapid Gateway webhook signatures. Confirmed from documentation:
   * signed with HMAC-SHA256 over the raw request body using the webhook
   * signing salt, delivered as header X-RG-Signature. Payload de-duplicates
   * on `eventId`; correlates to your own request via `merchantTransactionId`
   * (always equals the BASKET_ID you submitted).
   */
  verifyWebhookSignature(rawBody: Buffer, signature: string, timestamp?: string): boolean {
    const webhookSecret = process.env.RAPID_GATEWAY_WEBHOOK_SECRET?.trim();
    if (!webhookSecret || !signature || !rawBody) return false;

    try {
      if (timestamp) {
        if (!/^\d+$/.test(timestamp)) return false;
        const sentAt = Number(timestamp);
        const now = Math.floor(Date.now() / 1000);
        if (!Number.isFinite(sentAt) || Math.abs(now - sentAt) > WEBHOOK_TOLERANCE_SECONDS) return false;

        const expected = crypto
          .createHmac("sha256", webhookSecret)
          .update(`${timestamp}.${rawBody.toString("utf8")}`)
          .digest("hex")
          .toUpperCase();
        return safeEqualHex(signature, expected);
      }

      const legacyExpected = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");
      return safeEqualHex(signature, legacyExpected);
    } catch {
      return false;
    }
  },
};