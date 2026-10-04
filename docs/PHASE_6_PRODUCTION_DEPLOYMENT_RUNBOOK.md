# Tutorera Phase 6: Production Staging & Pre-Deployment Runbook

**Date:** 2026-10-04  
**Audit Context:** Forensic Audit 2026-10-02 (§27 Phase 6, §30 Acceptance Plan)

---

## 1. Executive Pre-Flight Checklist

Before opening traffic to public users and search engines, the following infrastructure boundaries must be validated against real staging/production environments.

### 1.1 Environment Variable Verification Matrix

| Service | Environment Variable | Required In Production | Expected Value / Behavior |
|---|---|---|---|
| **Backend** | `NODE_ENV` | **YES** | `"production"` |
| **Backend** | `SWICH_MODE` | **YES** | `"live"` (Fails boot if points to sandbox in production) |
| **Backend** | `SWICH_AUTH_BASE_URL` | **YES** | `https://auth.swichnow.com` (Live HTTPS only, NO sandbox) |
| **Backend** | `SWICH_API_BASE_URL` | **YES** | `https://api.swichnow.com` (Live HTTPS only, NO sandbox) |
| **Backend** | `SWICH_USERNAME` | **YES** | Live production merchant username |
| **Backend** | `SWICH_PASSWORD` | **YES** | Live production merchant password |
| **Backend** | `SWICH_ACCOUNT_NO` | **YES** | Production Switch account number |
| **Backend** | `RESEND_API_KEY` | **YES** | Production Resend API key (`re_...`) |
| **Backend** | `RESEND_WEBHOOK_SECRET` | **YES** | Production Svix webhook secret (`whsec_...`) |
| **Backend** | `RESEND_WEBHOOK_ENABLED` | Optional | `"true"` (Default) |
| **Backend** | `ENABLE_DIRECT_BOOKING` | Optional | `"true"` or `"false"` (Feature flag governed) |
| **Backend** | `MONGO_URI` | **YES** | MongoDB Atlas connection string with replica set & TLS |
| **Frontend** | `NEXT_PUBLIC_API_URL` | **YES** | Production backend API endpoint (`https://api.tutorera.com/api/v1`) |
| **Frontend** | `NEXT_PUBLIC_ENABLE_DIRECT_BOOKING`| Optional | `"true"` (Default) or `"false"` to hide direct booking |

---

## 2. Automated & Operational Smoke Tests

### 2.1 Smoke Test 1: Production Fail-Closed Safety (P0-01 & P0-02)
Verify that the backend web process safely refuses to boot or serve checkouts if credentials or endpoints point to sandbox in production:
```bash
# Verify unit/integration tests pass
npm test -- src/tests/swich-runtime-config.test.ts src/tests/email-webhook-security.test.ts
```
Expected output:
- `assertSwichRuntimeConfiguration()` throws error code `SWICH_PRODUCTION_URL_INVALID` if hostname contains `sandbox`.
- `handleResendWebhook()` responds with HTTP `503 Service Unavailable` if `RESEND_WEBHOOK_SECRET` is unset.

### 2.2 Smoke Test 2: Live Payment Reconciliation Check (P0-03)
Verify scheduled job leasing and reconciliation polling:
1. Ensure `server.ts` registers `swich-checkout-reconciliation` with distributed lease lock.
2. In MongoDB, inspect `scheduledjobleases` collection:
   ```javascript
   db.scheduledjobleases.find({ jobName: "swich-checkout-reconciliation" })
   ```
3. Ensure single execution even if multiple Render instances are deployed.

---

## 3. Database Index & Query Profiling (§23)

### 3.1 MongoDB Atlas Index Inventory
Execute against production database to verify compound index existence:
```javascript
// Check indexes on high-throughput collections
db.requests.getIndexes();
db.bids.getIndexes();
db.bookings.getIndexes();
db.tutorprofiles.getIndexes();
db.paymentledgers.getIndexes();
```

### 3.2 High-Volume Query Plans (`explain("executionStats")`)
Verify that execution strategy uses `IXSCAN` and zero `COLLSCAN`:

```javascript
// 1. Tutor Matching Query
db.requests.find({
  status: "open",
  teachingMode: "online",
  expiresAt: { $gt: new Date() }
}).explain("executionStats");

// 2. Offer Comparison Query
db.bids.find({
  request: ObjectId("..."),
  status: { $nin: ["withdrawn", "rejected"] }
}).explain("executionStats");

// 3. Stale Payment Reconciliation Query
db.paymentledgers.find({
  provider: "swich",
  eventType: "checkout.created",
  status: { $ne: "succeeded" }
}).sort({ createdAt: -1 }).explain("executionStats");
```

---

## 4. SEO, Canonical Domains & Edge Routing (§22)

### 4.1 Canonical Host Enforcement
Verify with `curl -I`:
```bash
# 1. Non-canonical Vercel host redirect check:
curl -I https://tutorera.vercel.app/

# Expected Response Headers:
# HTTP/1.1 301 Moved Permanently
# Location: https://tutorera.com/
# X-Robots-Tag: noindex, nofollow, noarchive

# 2. Private Path Robots Tag check:
curl -I https://tutorera.com/dashboard

# Expected Response Headers:
# X-Robots-Tag: noindex, nofollow, noarchive
```

### 4.2 Production Sitemap & Robots.txt
- Verify `/sitemap.xml` generates clean canonical XML with `https://tutorera.com`.
- Verify `/robots.txt` disallows `/admin/`, `/dashboard/`, `/checkout/`, `/api/`.

---

## 5. Phase 5 & 6 Sign-Off Matrix

| Phase | Description | Status | Sign-off Criteria |
|---|---|---|---|
| **Phase 0** | Switch Live, Resend Signature, Payment Reconciler | **READY** | Unit tests passing, live keys provisioned |
| **Phase 1** | Authoritative USD & Single Eligibility Authority | **READY** | Data migration validated via ledger |
| **Phase 2** | Distributed Job Lease Locking & Logs | **READY** | Leases confirmed in MongoDB |
| **Phase 3** | Single-Source Contracts & Type Safety | **READY** | Zero TypeScript compilation errors |
| **Phase 4** | Full Marketplace E2E Lifecycle Proof | **READY** | 59/59 Test suites passing |
| **Phase 5** | Direct Booking Governance Feature Flag | **READY** | `ENABLE_DIRECT_BOOKING` flag implemented & tested |
| **Phase 6** | Pre-Deployment Runbook & Infrastructure Check | **READY** | Runbook published in `docs/` |
