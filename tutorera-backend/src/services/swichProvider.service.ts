import axios from "axios";

// Swich Payment Session integration. Confirmed against Swich's own API docs
// (api-docs.swichnow.com) on 2026-09-26, plus real request/response pairs
// captured directly from those docs — not guessed, unlike the Rapid Gateway
// integration this replaces, which was built against an API shape that
// never existed and was never tested.
//
// IMPORTANT ARCHITECTURAL DIFFERENCE FROM RAPID GATEWAY: Swich's Payment
// Session product has no documented push webhook. Its own docs say to
// confirm outcome by calling GET /gateway/paymentsession/get "rather than
// relying only on the customer redirect." That means payment confirmation
// must be PULLED by our backend (on the customer's return, and/or via a
// periodic poll job for abandoned sessions), not pushed to us the way
// Rapid Gateway's webhook was. See getPaymentSessionStatus() below — it is
// meant to be called from a /payments/swich/confirm-style endpoint hit on
// successURL return, not from a webhook route.

export interface SwichCheckoutParams {
    amount: number;
    currency?: string;
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

const AUTH_BASE_URL = "https://sandbox-auth.swichnow.com"; // TODO: swap to the live auth host when going to production — confirm exact live hostname with Swich first, same caution as Rapid Gateway's sandbox-vs-live mixup
const API_BASE_URL = "https://sandbox-api.swichnow.com"; // TODO: same caution for the live API host
const DEFAULT_CATEGORIES = ["ewallet", "visamastercardpayment", "bankaccount", "rtpnowpayment"];

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

/**
 * OAuth2 client_credentials token fetch, cached until near expiry.
 * Confirmed real contract: POST {AUTH_BASE_URL}/connect/token with a JSON
 * (not form-urlencoded — different from Rapid Gateway) body of client_id,
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
        `${AUTH_BASE_URL}/connect/token`,
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
        const accessToken = await getAccessToken();
        const currency = (params.currency || "PKR").toUpperCase();

        if (currency !== "PKR") {
        const error = new Error(`Swich checkout is currently enabled only for PKR transactions; received ${currency}.`) as Error & { statusCode?: number; code?: string };
        error.statusCode = 409;
        error.code = "SWICH_CURRENCY_UNSUPPORTED";
        throw error;
        }
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
        const response = await axios.post(`${API_BASE_URL}/gateway/paymentsession/initiate`, body, {
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
        const response = await axios.get(`${API_BASE_URL}/gateway/paymentsession/get`, {
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