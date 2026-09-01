// src/utils/rapidGateway.ts
import axios from "axios";

const BASE_URL = "https://secure.rapid-gateway.com";

const MERCHANT_ID = process.env.RAPID_GATEWAY_MERCHANT_ID as string;
const MERCHANT_NAME = process.env.RAPID_GATEWAY_MERCHANT_NAME || "TUTORERA";
const CLIENT_SECRET = process.env.RAPID_GATEWAY_CLIENT_SECRET as string;

// Simple in-memory token cache — avoids requesting a new OAuth2 token on
// every single checkout creation. Refreshed a little before actual expiry.
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
    if (cachedToken && cachedToken.expiresAt > Date.now() + 5000) {
        return cachedToken.token;
    }

    const basicAuth = Buffer.from(`${MERCHANT_ID}:${CLIENT_SECRET}`).toString("base64");

    const response = await axios.post(
        `${BASE_URL}/oauth2/token`,
        new URLSearchParams({ grant_type: "client_credentials" }).toString(),
        {
        headers: {
            Authorization: `Basic ${basicAuth}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        }
    );

    const { access_token, expires_in } = response.data;
    cachedToken = {
        token: access_token,
        // expires_in is in seconds; default to 5 minutes if the field is missing.
        expiresAt: Date.now() + (expires_in ? expires_in * 1000 : 5 * 60 * 1000),
    };

    return access_token;
}

interface CreateTransactionParams {
    amount: number;
    customerMobileNo: string;
    customerEmail: string;
    basketId: string; // our own unique reference — MUST equal what we reconcile webhooks against
    description: string;
    successUrl: string;
    failureUrl: string;
    checkoutUrl: string;
}

// Creates a transaction and returns the hosted checkout URL to redirect the
// customer to. Rapid Gateway's API responds with an HTTP redirect (not a
// JSON body) — we must NOT follow it automatically, only capture the
// Location header, exactly like their documented PHP example
// (CURLOPT_FOLLOWLOCATION => false + CURLINFO_REDIRECT_URL).
export async function createTransaction(params: CreateTransactionParams): Promise<string> {
    const token = await getAccessToken();

    const body = new URLSearchParams({
        MERCHANT_ID,
        MERCHANT_NAME,
        TXNAMT: params.amount.toString(),
        CURRENCY_CODE: "PKR",
        CUSTOMER_MOBILE_NO: params.customerMobileNo,
        CUSTOMER_EMAIL_ADDRESS: params.customerEmail,
        BASKET_ID: params.basketId,
        TXNDESC: params.description,
        ORDER_DATE: new Date().toISOString().slice(0, 10),
        SUCCESS_URL: params.successUrl,
        FAILURE_URL: params.failureUrl,
        CHECKOUT_URL: params.checkoutUrl,
        VERSION: "MY_VER_1.0",
        PROCCODE: "0",
    });

    const response = await axios.post(`${BASE_URL}/rapid/process-transaction`, body.toString(), {
        headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
        },
        maxRedirects: 0, // capture the redirect, don't follow it
        validateStatus: (status) => status >= 200 && status < 400, // 3xx is expected here
    });

    const redirectUrl = response.headers.location;
    if (!redirectUrl) {
        throw { statusCode: 502, message: "Rapid Gateway did not return a checkout redirect URL." };
    }

    return redirectUrl;
}

// Verifies a webhook's signature exactly per Rapid Gateway's documented
// recipe: HMAC_SHA256(secret, timestamp + "." + raw_request_body), hex,
// uppercase, compared in constant time, with a 5-minute freshness window
// to reject replayed/stale deliveries.
export function verifyWebhookSignature(
    rawBody: Buffer,
    signatureHeader: string | undefined,
    timestampHeader: string | undefined
    ): boolean {
    const secret = process.env.RAPID_GATEWAY_WEBHOOK_SECRET as string;
    if (!signatureHeader || !timestampHeader || !secret) return false;

    const timestamp = parseInt(timestampHeader, 10);
    if (Number.isNaN(timestamp)) return false;

    const nowSeconds = Math.floor(Date.now() / 1000);
    if (Math.abs(nowSeconds - timestamp) > 300) return false; // 5-minute window

    const crypto = require("crypto");
    const expected = crypto
        .createHmac("sha256", secret)
        .update(`${timestamp}.${rawBody.toString()}`)
        .digest("hex")
        .toUpperCase();

    const expectedBuf = Buffer.from(expected, "utf8");
    const receivedBuf = Buffer.from(signatureHeader, "utf8");

    if (expectedBuf.length !== receivedBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}