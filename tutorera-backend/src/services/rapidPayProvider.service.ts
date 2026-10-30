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
 * and Swich both accept. Returns undefined for anything that can't be normalised
 * so the caller omits the field rather than sending a value the gateway rejects.
 */
export function normalizePkMobile(raw: string | undefined | null): string | undefined {
  let digits = String(raw || "").replace(/\D/g, "");
  if (digits.startsWith("0092")) digits = digits.slice(4);
  else if (digits.startsWith("92")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return /^3\d{9}$/.test(digits) ? `0${digits}` : undefined;
}

// RapidPay integration.
//
// Credentials are loaded from environment variables:
//   RAPIDPAY_API_KEY      — API key issued by RapidPay (Bearer token on all requests)
//   RAPIDPAY_MERCHANT_ID  — Merchant ID (numeric, issued on account approval)
//   RAPIDPAY_BASE_URL     — Base URL for RapidPay API (defaults to live endpoint in production)
//
// The checkout and confirmation flows below are structured to match the Swich
// interface used by paymentProvider.service.ts, so callers are unaffected.
//
// NOTE: Endpoint paths, request/response shapes and webhook signing are marked
// CONFIRM_WITH_DOCS throughout. Fill them in once you have the merchant docs.
// The provider is already wired as the active gateway — set contractVerified: true
// in payment-release-policy.json only after the HTTP contract is confirmed and
// tested end-to-end.

export interface RapidPayCheckoutParams {
  amount: number;
  currency: string;
  marketCountryCode?: string;
  reference: string;
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
  checkoutUrl: string;
  sessionId: string;
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

// CONFIRM_WITH_DOCS: replace with the official live endpoint base URL once confirmed.
const FALLBACK_BASE_URL = "https://api.rapidpay.co"; // placeholder — verify against merchant docs

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
  return FALLBACK_BASE_URL;
}

export function assertRapidPayRuntimeConfiguration(): void {
  requireEnv("RAPIDPAY_API_KEY");
  requireEnv("RAPIDPAY_MERCHANT_ID");
  rapidPayBaseUrl();
}

export function getRapidPayCapabilities() {
  // RapidPay is authorised for all six launch markets, settling in USD.
  // The RAPIDPAY_SUPPORTED_MARKETS env var overrides this if needed.
  const configured = process.env.RAPIDPAY_SUPPORTED_MARKETS?.split(",").map((m) => m.trim().toUpperCase()).filter(Boolean);
  const markets = new Set(configured && configured.length > 0 ? configured : ["PK", "AE", "GB", "US", "SA", "IN"]);
  const currencies = new Set(["USD"]);
  return { markets, currencies };
}

export function assertRapidPayCheckoutCapability(countryCode: string | undefined, currency: string): void {
  const { markets, currencies } = getRapidPayCapabilities();
  if (!markets.has((countryCode || "PK").toUpperCase()) || !currencies.has(currency.toUpperCase())) {
    throw httpError(
      "RapidPay checkout is not approved for this market and currency combination.",
      409,
      "RAPIDPAY_MARKET_OR_CURRENCY_UNSUPPORTED"
    );
  }
}

export const rapidPayProvider = {
  async createCheckout(params: RapidPayCheckoutParams): Promise<RapidPayCheckoutResult> {
    assertRapidPayCheckoutCapability(params.marketCountryCode, params.currency || "USD");

    const apiKey = requireEnv("RAPIDPAY_API_KEY");
    const merchantId = requireEnv("RAPIDPAY_MERCHANT_ID");
    const baseUrl = rapidPayBaseUrl();

    const metadata = params.metadata || {};
    const customerEmail = String(metadata.studentEmail || "").trim();
    const customerName = String(metadata.customerName || "TUTORERA Student").trim();
    const successUrl = String(metadata.successUrl || "").trim();
    const failedUrl = String(metadata.failureUrl || successUrl).trim();
    const description = String(metadata.description || "TUTORERA tutoring session").slice(0, 999);

    if (!successUrl) {
      throw httpError("RapidPay success URL is missing", 500, "PAYMENT_RETURN_URL_MISSING");
    }

    // CONFIRM_WITH_DOCS: replace /v1/checkout with the actual initiate endpoint path.
    // CONFIRM_WITH_DOCS: replace request body fields with the actual RapidPay schema.
    // CONFIRM_WITH_DOCS: confirm whether RapidPay returns a redirect URL or a session token.
    try {
      const response = await axios.post(
        `${baseUrl}/v1/checkout`,
        {
          merchantId,
          amount: params.amount,
          currency: (params.currency || "USD").toUpperCase(),
          reference: params.reference,
          description,
          customer: { name: customerName, email: customerEmail },
          successUrl,
          failedUrl,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          timeout: 15_000,
        }
      );

      // CONFIRM_WITH_DOCS: adjust field names to match the real RapidPay response.
      const checkoutUrl = response.data?.checkoutUrl || response.data?.url || response.data?.redirectUrl;
      const sessionId = response.data?.sessionId || response.data?.id || response.data?.transactionId || "";

      if (!checkoutUrl || typeof checkoutUrl !== "string") {
        throw new Error("RapidPay returned no checkout URL");
      }

      return { checkoutUrl, sessionId };
    } catch (error) {
      const axErr = error as { statusCode?: number; response?: { status?: number; data?: { message?: string } }; message?: string };
      if (axErr?.statusCode) throw error;
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
    const apiKey = requireEnv("RAPIDPAY_API_KEY");
    const baseUrl = rapidPayBaseUrl();

    // CONFIRM_WITH_DOCS: replace /v1/checkout/{id} with the actual status endpoint.
    // CONFIRM_WITH_DOCS: adjust response field mapping to match real RapidPay schema.
    try {
      const response = await axios.get(`${baseUrl}/v1/checkout/${encodeURIComponent(sessionId)}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
        },
        timeout: 15_000,
      });

      return {
        sessionId: response.data?.sessionId || response.data?.id || sessionId,
        status: (response.data?.status || "pending").toLowerCase(),
        amount: Number(response.data?.amount) || 0,
        currency: String(response.data?.currency || "USD").toUpperCase(),
        reference: String(response.data?.reference || ""),
      };
    } catch (error) {
      const axErr = error as { response?: { status?: number }; message?: string };
      const status = axErr?.response?.status;
      throw httpError(
        `RapidPay session status check failed${axErr?.message ? `: ${axErr.message}` : ""}`,
        status && status >= 400 && status < 500 ? status : 502,
        "RAPIDPAY_STATUS_CHECK_FAILED"
      );
    }
  },
};
