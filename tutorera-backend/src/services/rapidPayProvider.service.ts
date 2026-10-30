import axios from "axios";
import { httpError } from "../utils/httpError";

// Phone/CNIC normalizers — PK-specific customer data utils reused by
// offer and request controllers regardless of which gateway is active.

/** Pakistani CNIC: exactly 13 digits once dashes/spaces are stripped. */
export function normalizeCnic(raw: string | undefined | null): string | undefined {
  const digits = String(raw || "").replace(/\D/g, "");
  return /^\d{13}$/.test(digits) ? digits : undefined;
}

/**
 * Normalise a Pakistani mobile number to the "03XXXXXXXXX" format RapidPay
 * accepts. Returns undefined for anything that can't be normalised so the
 * caller omits the field rather than sending a value the gateway rejects.
 */
export function normalizePkMobile(raw: string | undefined | null): string | undefined {
  let digits = String(raw || "").replace(/\D/g, "");
  if (digits.startsWith("0092")) digits = digits.slice(4);
  else if (digits.startsWith("92")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return /^3\d{9}$/.test(digits) ? `0${digits}` : undefined;
}

// RapidPay integration — embedded iframe checkout (no redirect).
//
// Credentials are loaded from environment variables:
//   RAPIDPAY_API_KEY      — Client secret issued by RapidPay
//   RAPIDPAY_MERCHANT_ID  — Merchant ID (numeric), also the OAuth2 client_id
//   RAPIDPAY_BASE_URL     — Base URL (defaults to https://secure.rapid-gateway.com)
//
// Auth: OAuth2 client credentials. POST /oauth2/token with
//   Authorization: Basic base64(merchantId:clientSecret)
//   Content-Type: application/x-www-form-urlencoded; body: grant_type=client_credentials
// Token expires in ~299 seconds; cached with a 30-second safety buffer.
//
// Checkout: POST /v1/checkout-sessions → returns { sessionId, clientSecret, publishableKey }.
// The clientSecret and publishableKey are passed to the frontend, which mounts
// the RapidPay JS SDK (https://secure.rapid-gateway.com/sdk/v1/rapidpay.js).
// The customer never leaves the page; the SDK renders an iframe.
//
// Status: GET /v1/checkout-sessions/{sessionId} → SUCCEEDED | FAILED | PROCESSING | EXPIRED

export interface RapidPayCheckoutParams {
  amount: number;
  currency: string;
  marketCountryCode?: string;
  reference: string;
  customerEmail?: string;
  customerMobile?: string;
  metadata?: Record<string, unknown>;
}

export interface RapidPaySessionStatus {
  sessionId: string;
  status: "pending" | "success" | "failed" | "expired" | "cancelled";
  amount: number;
  currency: string;
  reference: string;
}

export interface RapidPayCheckoutResult {
  sessionId: string;
  clientSecret: string;
  publishableKey: string;
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw httpError(`${name} is not configured`, 503, "PAYMENT_GATEWAY_NOT_CONFIGURED");
  }
  return value;
}

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

const DEFAULT_BASE_URL = "https://secure.rapid-gateway.com";

function rapidPayBaseUrl(): string {
  const configured = process.env.RAPIDPAY_BASE_URL?.trim();
  if (configured) {
    try {
      const url = new URL(configured);
      if (url.protocol !== "https:") throw new Error("must be HTTPS");
      return url.origin;
    } catch {
      throw httpError("RAPIDPAY_BASE_URL must be a valid HTTPS URL", 503, "PAYMENT_GATEWAY_URL_INVALID");
    }
  }
  if (isProduction()) {
    throw httpError("RAPIDPAY_BASE_URL must be configured in production", 503, "PAYMENT_GATEWAY_NOT_CONFIGURED");
  }
  return DEFAULT_BASE_URL;
}

export function assertRapidPayRuntimeConfiguration(): void {
  requireEnv("RAPIDPAY_API_KEY");
  requireEnv("RAPIDPAY_MERCHANT_ID");
  rapidPayBaseUrl();
}

export function getRapidPayCapabilities() {
  const configured = process.env.RAPIDPAY_SUPPORTED_MARKETS?.split(",").map((m) => m.trim().toUpperCase()).filter(Boolean);
  const markets = new Set(configured && configured.length > 0 ? configured : ["PK", "AE", "GB", "US", "SA", "IN"]);
  // RapidPay processes in PKR for PK; other markets use their offer currency.
  // The gateway accepts whichever currency the session is created with.
  const currencies = new Set(["PKR", "USD", "GBP", "AED", "SAR", "INR"]);
  return { markets, currencies };
}

export function assertRapidPayCheckoutCapability(countryCode: string | undefined, currency: string): void {
  const { markets } = getRapidPayCapabilities();
  if (!markets.has((countryCode || "PK").toUpperCase())) {
    throw httpError(
      "RapidPay checkout is not approved for this market.",
      409,
      "RAPIDPAY_MARKET_OR_CURRENCY_UNSUPPORTED"
    );
  }
}

// OAuth2 token cache — avoids fetching a new token on every request.
// The token expires in ~299 seconds; refresh 30 seconds early.
interface TokenCache { value: string; expiresAt: number; }
let cachedToken: TokenCache | null = null;

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 30_000) return cachedToken.value;

  const merchantId = requireEnv("RAPIDPAY_MERCHANT_ID");
  const clientSecret = requireEnv("RAPIDPAY_API_KEY");
  const baseUrl = rapidPayBaseUrl();
  const credentials = Buffer.from(`${merchantId}:${clientSecret}`).toString("base64");

  try {
    const res = await axios.post(
      `${baseUrl}/oauth2/token`,
      "grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        timeout: 15_000,
      }
    );
    const { access_token, expires_in } = res.data;
    if (!access_token) throw new Error("access_token missing from token response");
    cachedToken = { value: access_token, expiresAt: now + (Number(expires_in || 299) * 1000) };
    return cachedToken.value;
  } catch (error) {
    cachedToken = null;
    const axErr = error as { response?: { data?: { message?: string } }; message?: string };
    const msg = axErr?.response?.data?.message || axErr?.message || "unknown error";
    throw httpError(`RapidPay token fetch failed: ${msg}`, 502, "RAPIDPAY_AUTH_FAILED");
  }
}

export const rapidPayProvider = {
  async createCheckout(params: RapidPayCheckoutParams): Promise<RapidPayCheckoutResult> {
    assertRapidPayCheckoutCapability(params.marketCountryCode, params.currency);

    const merchantId = requireEnv("RAPIDPAY_MERCHANT_ID");
    const baseUrl = rapidPayBaseUrl();
    const token = await getAccessToken();

    const metadata = params.metadata || {};
    const customerEmail = params.customerEmail || String(metadata.studentEmail || "").trim();
    const customerMobile = params.customerMobile || String(metadata.studentMobileNo || "").trim();

    try {
      const response = await axios.post(
        `${baseUrl}/v1/checkout-sessions`,
        {
          merchantId: Number(merchantId),
          amount: params.amount,
          currency: params.currency.toUpperCase(),
          basketId: params.reference,
          customerEmail: customerEmail || undefined,
          customerMobile: customerMobile || undefined,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Environment": isProduction() ? "LIVE" : "TEST",
          },
          timeout: 15_000,
        }
      );

      const sessionId: string = response.data?.sessionId || "";
      const clientSecret: string = response.data?.clientSecret || "";
      const publishableKey: string = response.data?.publishableKey || "";

      if (!sessionId) throw new Error("RapidPay returned no sessionId");
      if (!clientSecret) throw new Error("RapidPay returned no clientSecret");

      return { sessionId, clientSecret, publishableKey };
    } catch (error) {
      const axErr = error as { statusCode?: number; response?: { status?: number; data?: { message?: string } }; message?: string };
      if (axErr?.statusCode) throw error;
      // Re-acquire the token on next attempt if this was an auth error.
      if (axErr?.response?.status === 401) cachedToken = null;
      const status = axErr?.response?.status;
      const gatewayMessage = axErr?.response?.data?.message;
      throw httpError(
        gatewayMessage ? `RapidPay checkout failed: ${gatewayMessage}` : `RapidPay checkout failed${axErr?.message ? `: ${axErr.message}` : ""}`,
        status && status >= 400 && status < 500 ? status : 502,
        "RAPIDPAY_CHECKOUT_FAILED"
      );
    }
  },

  async getSessionStatus(sessionId: string): Promise<RapidPaySessionStatus> {
    const baseUrl = rapidPayBaseUrl();
    const token = await getAccessToken();

    try {
      const response = await axios.get(
        `${baseUrl}/v1/checkout-sessions/${encodeURIComponent(sessionId)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          timeout: 15_000,
        }
      );

      // Map RapidPay uppercase statuses to the lowercase values used internally.
      const rawStatus = String(response.data?.status || "").toUpperCase();
      let status: RapidPaySessionStatus["status"] = "pending";
      if (rawStatus === "SUCCEEDED") status = "success";
      else if (rawStatus === "FAILED") status = "failed";
      else if (rawStatus === "EXPIRED") status = "expired";
      else if (rawStatus === "PROCESSING") status = "pending";

      return {
        sessionId: response.data?.sessionId || sessionId,
        status,
        amount: Number(response.data?.amount) || 0,
        currency: String(response.data?.currency || "").toUpperCase(),
        reference: String(response.data?.basketId || response.data?.reference || ""),
      };
    } catch (error) {
      const axErr = error as { response?: { status?: number }; message?: string };
      if (axErr?.response?.status === 401) cachedToken = null;
      const status = axErr?.response?.status;
      throw httpError(
        `RapidPay session status check failed${axErr?.message ? `: ${axErr.message}` : ""}`,
        status && status >= 400 && status < 500 ? status : 502,
        "RAPIDPAY_STATUS_CHECK_FAILED"
      );
    }
  },
};
