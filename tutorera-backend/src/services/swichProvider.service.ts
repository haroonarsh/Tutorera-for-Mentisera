import axios from "axios";

// Swich Payment Session integration. Confirmed against Swich's own API docs
// (api-docs.swichnow.com) on 2026-09-26, plus real request/response pairs
// captured directly from those docs — not guessed or inferred from an
// unsupported API contract.
//
// IMPORTANT ARCHITECTURAL DETAIL: Switch's Payment
// Session product has no documented push webhook. Its own docs say to
// confirm outcome by calling GET /gateway/paymentsession/get "rather than
// relying only on the customer redirect." That means payment confirmation
// must be PULLED by our backend (on the customer's return, and/or via a
// periodic poll job for abandoned sessions), not pushed to us the way
// a push webhook. See getPaymentSessionStatus() below — it is
// meant to be called from a /payments/swich/confirm-style endpoint hit on
// successURL return, not from a webhook route.

export interface SwichCheckoutParams {
    amount: number;
    currency?: string;
    marketCountryCode?: string;
    reference: string; // maps to billReferenceNo — our own order/basket reference
    metadata?: Record<string, unknown>;
}

export interface SwichSessionStatus {
    status: string; // "SUCCESS" | "failed" (top-level API call status, not the payment outcome)
    paymentSessionGuid: string;
    amount: number;
    currency: string;
    billReferenceNo: string;
    sessionStatus: "Pending" | "Success" | "Failed" | "Expired" | "Cancelled";
    remainingAttempts: number;
    remainingSeconds: number;
    createdAt: string;
    expiryAt: string;
}

const SANDBOX_AUTH_BASE_URL = "https://sandbox-auth.swichnow.com";
const SANDBOX_API_BASE_URL = "https://sandbox-api.swichnow.com";
const DEFAULT_CATEGORIES = ["ewallet", "visamastercardpayment", "bankaccount", "rtpnowpayment"];

function isProduction(): boolean {
    return process.env.NODE_ENV === "production";
}

function configuredBaseUrl(name: "SWICH_AUTH_BASE_URL" | "SWICH_API_BASE_URL", sandboxFallback: string): string {
    const configured = process.env[name]?.trim();
    if (!configured) {
        if (isProduction()) {
            const error = new Error(`${name} must be configured in production; sandbox payment hosts are not allowed`) as Error & { statusCode?: number; code?: string };
            error.statusCode = 503;
            error.code = "SWICH_PRODUCTION_URL_MISSING";
            throw error;
        }
        return sandboxFallback;
    }

    let url: URL;
    try {
        url = new URL(configured);
    } catch {
        const error = new Error(`${name} must be a valid HTTPS URL`) as Error & { statusCode?: number; code?: string };
        error.statusCode = 503;
        error.code = "SWICH_BASE_URL_INVALID";
        throw error;
    }
    if (url.protocol !== "https:" || (isProduction() && /sandbox/i.test(url.hostname))) {
        const error = new Error(`${name} must be a non-sandbox HTTPS endpoint in production`) as Error & { statusCode?: number; code?: string };
        error.statusCode = 503;
        error.code = "SWICH_PRODUCTION_URL_INVALID";
        throw error;
    }
    return url.origin;
}

/** Fails closed before any production checkout can reach a sandbox host. */
export function assertSwichRuntimeConfiguration(): void {
    if (isProduction()) {
        const swichMode = (process.env.SWICH_MODE || process.env.SWICH_ENV || "live").trim().toLowerCase();
        if (swichMode === "sandbox") {
            const error = new Error("SWICH_MODE cannot be set to sandbox in production environment") as Error & { statusCode?: number; code?: string };
            error.statusCode = 503;
            error.code = "SWICH_SANDBOX_MODE_DISALLOWED";
            throw error;
        }
    }
    configuredBaseUrl("SWICH_AUTH_BASE_URL", SANDBOX_AUTH_BASE_URL);
    configuredBaseUrl("SWICH_API_BASE_URL", SANDBOX_API_BASE_URL);
    if (isProduction()) {
        requireEnv("SWICH_CLIENT_ID");
        requireEnv("SWICH_CLIENT_SECRET");
    }
}

/**
 * Non-money production smoke test to verify Switch OAuth credentials and connectivity
 * without initiating any payment session or financial transaction.
 */
export async function verifySwichConnectivity(): Promise<{ connected: boolean; mode: string; authUrl: string; apiUrl: string }> {
    assertSwichRuntimeConfiguration();
    const token = await getAccessToken();
    return {
        connected: Boolean(token),
        mode: isProduction() ? "live" : (process.env.SWICH_MODE || process.env.SWICH_ENV || "sandbox").toLowerCase(),
        authUrl: swichAuthBaseUrl(),
        apiUrl: swichApiBaseUrl(),
    };
}

function swichAuthBaseUrl(): string {
    return configuredBaseUrl("SWICH_AUTH_BASE_URL", SANDBOX_AUTH_BASE_URL);
}

function swichApiBaseUrl(): string {
    return configuredBaseUrl("SWICH_API_BASE_URL", SANDBOX_API_BASE_URL);
}

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

function configuredValues(name: string, fallback: string[]): Set<string> {
    const value = process.env[name];
    return new Set((value ? value.split(",") : fallback).map((item) => item.trim().toUpperCase()).filter(Boolean));
}

export function getSwichCapabilities() {
    return {
        markets: configuredValues("SWICH_SUPPORTED_MARKETS", ["PK"]),
        // LAUNCH_MARKETS (market.service.ts) settles every market - including
        // PK - in USD since the global-USD-settlement migration. This default
        // must match that, or ensureLaunchMarkets() silently treats every
        // market as Switch-unapproved (paymentProvider "none", payments
        // disabled) whenever SWICH_SUPPORTED_CURRENCIES isn't set in the
        // environment, which is the case in this repo's own .env today.
        currencies: configuredValues("SWICH_SUPPORTED_CURRENCIES", ["USD"]),
    };
}

export function assertSwichCheckoutCapability(countryCode: string | undefined, currency: string): void {
    const capabilities = getSwichCapabilities();
    if (!capabilities.markets.has((countryCode || "PK").toUpperCase()) || !capabilities.currencies.has(currency.toUpperCase())) {
        const error = new Error("Switch checkout is not yet approved for this market and currency.") as Error & { statusCode?: number; code?: string };
        error.statusCode = 409;
        error.code = "SWICH_MARKET_OR_CURRENCY_UNSUPPORTED";
        throw error;
    }
}

/**
 * OAuth2 client_credentials token fetch, cached until near expiry.
 * Confirmed real contract: POST {AUTH_BASE_URL}/connect/token with a JSON
 * JSON (not form-urlencoded) body of client_id,
 * client_secret, grant_type. Response: { access_token, token_type,
 * expires_in }.
 */
async function getAccessToken(): Promise<string> {
    const now = Date.now();
    if (cachedToken && cachedToken.expiresAt > now) {
        return cachedToken.accessToken;
    }

    const clientId = requireEnv("SWICH_CLIENT_ID");
    const clientSecret = requireEnv("SWICH_CLIENT_SECRET");

    try {
        const response = await axios.post(
        `${swichAuthBaseUrl()}/connect/token`,
        {
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "client_credentials",
        },
        {
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            timeout: 15_000,
        }
        );

        const accessToken = response.data?.access_token;
        const expiresIn = Number(response.data?.expires_in) || 3600 - 60;
        if (!accessToken || typeof accessToken !== "string") {
        throw new Error("Swich token response missing access_token");
        }

        cachedToken = { accessToken, expiresAt: now + (expiresIn - 30) * 1000 };
        return accessToken;
    } catch (error: any) {
        const status = error?.response?.status;
        const wrapped = new Error(
        status === 401
            ? "Swich rejected the client credentials — check SWICH_CLIENT_ID/SWICH_CLIENT_SECRET"
            : `Swich token request failed${error?.message ? `: ${error.message}` : ""}`
        ) as Error & { statusCode?: number; code?: string };
        wrapped.statusCode = 502;
        wrapped.code = "SWICH_TOKEN_FAILED";
        throw wrapped;
    }
}

export const swichProvider = {
    /**
     * Creates a Payment Session and returns its hosted checkout URL.
     *
     * recurringDetails is required by Swich's API even for a one-off payment
     * — sent here with all-null fields and recurringPaymentType: 0 ("None"),
     * matching the docs' own guidance: "For one-off payments, still provide
     * this object with null/empty values."
     */
    async createCheckout(params: SwichCheckoutParams): Promise<{ checkoutUrl: string; paymentSessionGuid: string }> {
        // Settlement currency is owned by the market configuration. A caller
        // that omitted it is a server-side defect, not a reason to resurrect
        // the retired Pakistan-only PKR fallback.
        const currency = (params.currency || "USD").toUpperCase();
        assertSwichCheckoutCapability(params.marketCountryCode, currency);
        const accessToken = await getAccessToken();

        if (!Number.isFinite(params.amount) || params.amount <= 0) {
        const error = new Error("Payment amount must be a positive number") as Error & { statusCode?: number; code?: string };
        error.statusCode = 400;
        error.code = "INVALID_PAYMENT_AMOUNT";
        throw error;
        }

        const metadata = params.metadata || {};
        const customerName = String(metadata.customerName || "TUTORERA Student").trim();
        const customerEmail = String(metadata.studentEmail || "").trim();
        const customerMobile = String(metadata.studentMobileNo || "").trim();
        const successURL = String(metadata.successUrl || "").trim();
        const failedURL = String(metadata.failureUrl || successURL).trim();
        const item = String(metadata.description || "TUTORERA tutoring session").slice(0, 999);

        if (!successURL) {
        const error = new Error("Swich success URL is missing") as Error & { statusCode?: number; code?: string };
        error.statusCode = 500;
        error.code = "PAYMENT_RETURN_URL_MISSING";
        throw error;
        }

        const body = {
        amount: params.amount,
        currency,
        item,
        billReferenceNo: params.reference,
        customerSessionId: params.reference, // reuse our own basketId as the session correlation id too — always unique per checkout attempt
        attempts: 10,
        expiry: 30, // minutes — matches the existing 30-minute PAYMENT_HOLD_MINUTES pattern already used elsewhere in this codebase
        successURL,
        failedURL,
        categoryList: DEFAULT_CATEGORIES,
        customerDetails: {
            name: customerName,
            email: customerEmail,
            msisdn: customerMobile,
        },
        // Required-but-empty for one-off payments, per Swich's own docs.
        recurringDetails: {
            recurringPaymentType: 0, // 0 = None
            RecurringStartDateTime: null,
            RecurringEndDateTime: null,
            RecurringSchedulerTime: null,
        },
        DoCapture: true,
        };

        try {
        const response = await axios.post(`${swichApiBaseUrl()}/gateway/paymentsession/initiate`, body, {
            headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            },
            timeout: 15_000,
        });

        const checkoutUrl = response.data?.url;
        if (!checkoutUrl || typeof checkoutUrl !== "string") {
            throw new Error("Swich returned no checkout url");
        }

        // The session GUID isn't a separate top-level field in the initiate
        // response — it's embedded as the `Id` query parameter on the
        // returned url (confirmed from a real captured response:
        // ".../PaymentSession?Id=YOUR-ID"). Extract it so it can be stored
        // and used later for status polling via paymentSessionGuid.
        const parsedUrl = new URL(checkoutUrl);
        const paymentSessionGuid = parsedUrl.searchParams.get("Id") || "";
        if (!paymentSessionGuid) {
            // Not fatal — the checkout itself still works — but confirmation
            // polling won't be possible without this, so surface it loudly
            // rather than silently losing the ability to confirm payment later.
            console.error("Swich checkout succeeded but no Id query param found on returned url:", checkoutUrl);
        }

        return { checkoutUrl, paymentSessionGuid };
        } catch (error: any) {
        if (error?.statusCode) throw error;

        const status = error?.response?.status;
        const gatewayMessage = error?.response?.data?.message;
        const wrapped = new Error(
            gatewayMessage ? `Swich checkout failed: ${gatewayMessage}` : `Swich checkout failed${error?.message ? `: ${error.message}` : ""}`
        ) as Error & { statusCode?: number; code?: string };
        wrapped.statusCode = status && status >= 400 && status < 500 ? status : 502;
        wrapped.code = "SWICH_CHECKOUT_FAILED";
        throw wrapped;
        }
    },

    /**
     * Confirms the real outcome of a payment session server-side. This is
     * the function that replaces webhook-driven confirmation — call it from
     * whatever endpoint the frontend hits on successURL/failedURL return
     * (and, eventually, from a periodic poll job for sessions the customer
     * never returned to at all).
     */
    async getPaymentSessionStatus(paymentSessionGuid: string): Promise<SwichSessionStatus> {
        const accessToken = await getAccessToken();

        try {
        const response = await axios.get(`${swichApiBaseUrl()}/gateway/paymentsession/get`, {
            params: { paymentSessionGuid },
            headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
            timeout: 15_000,
        });

        return response.data as SwichSessionStatus;
        } catch (error: any) {
        const status = error?.response?.status;
        const wrapped = new Error(`Swich session status check failed${error?.message ? `: ${error.message}` : ""}`) as Error & { statusCode?: number; code?: string };
        wrapped.statusCode = status && status >= 400 && status < 500 ? status : 502;
        wrapped.code = "SWICH_STATUS_CHECK_FAILED";
        throw wrapped;
        }
    },
};
