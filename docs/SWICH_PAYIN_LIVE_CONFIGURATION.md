# Swich PayIN live configuration

TUTORERA uses a backend-only PayIN integration. No Swich secret belongs in the
frontend, Cloudflare Worker, repository, or client-side environment variables.

## Callback URL

Register this public callback URL in the Swich merchant portal:

```text
https://tutorera-backend.onrender.com/api/v1/payments/swich/callback
```

If the Render service is later moved to a custom API host, update both the
merchant portal and `SWICH_CALLBACK_URL` together.

## Required Render environment variables

```text
SWICH_MODE=live
SWICH_CLIENT_ID=<merchant client id>
SWICH_CLIENT_SECRET=<merchant client secret>
SWICH_AUTH_BASE_URL=<Swich-issued live OAuth base URL>
SWICH_API_BASE_URL=<Swich-issued live PayIN API base URL>
SWICH_CALLBACK_URL=https://tutorera-backend.onrender.com/api/v1/payments/swich/callback
SWICH_CALLBACK_SECRET=<Swich-issued callback signing secret>
SWICH_PWA_BASE_URL=https://payin-pwa.swichnow.com
SWICH_SUPPORTED_MARKETS=PK,AE,GB,US,SA,IN
SWICH_SUPPORTED_CURRENCIES=USD
```

Swich's public API reference documents sandbox hosts only; do not guess live
hosts from naming conventions. Obtain the live OAuth/API hosts and callback
signing secret from the merchant portal or Swich integration support.

For the merchant's hosted PWA integration, `SWICH_CALLBACK_SECRET` is the
merchant PWA **Secret Key**. It remains backend-only and is never included in
a redirect URL or exposed to the browser.

## Callback verification

Swich sends a GET callback containing `CustomerTransactionId`, `OrderId`,
`Amount`, `Status`, and `checksum`. TUTORERA verifies:

```text
HMAC-SHA256("SWCallback:CustomerTransactionId:OrderId:Amount:Status", SWICH_CALLBACK_SECRET)
```

Only a valid checksum can trigger reconciliation. The internal checkout ledger
must also exist and the amount must match exactly. Duplicate callbacks are
idempotent through the provider transaction identifier.

## Production activation

1. Add the variables in Render's encrypted environment settings.
2. Allowlist Render's outbound IPs if Swich requires it.
3. Configure the callback URL in the merchant portal.
4. Deploy the backend.
5. Run the non-financial OAuth connectivity check.
6. Use a small controlled live payment before enabling checkout to users.
