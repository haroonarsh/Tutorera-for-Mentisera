# Render-to-Cloudflare migration: executable gates

**Status:** audit and planning only. No Cloudflare production Worker, DNS change, or database migration is represented by this document.

## Current architecture (verified in repository)

- `src/server.ts` starts a persistent Node.js HTTP server, attaches Socket.IO, opens a Mongoose connection, and schedules five recurring jobs with `setInterval`.
- `src/app.ts` is an Express 4 application with many mounted API routers and a MongoDB-backed readiness endpoint.
- `src/config/db.ts` connects to MongoDB with `mongoose.connect(MONGO_URI)`.
- `src/utils/socket.ts` provides Socket.IO; the frontend uses `socket.io-client`.
- Routes and dependencies include multipart uploads (Multer), PDFs (PDFKit), ExcelJS, Nodemailer, authentication, payment webhooks and MongoDB transactions.

**Consequences:** A Worker deployment is not a lift-and-shift. Do not deploy `dist/server.js` to Workers or repoint production DNS before each gate below passes. Cloudflare Pages/Workers frontend hosting does not imply the backend has migrated.

## Gate 1 — Audit and target design

1. Inventory routes, direct Node APIs, streaming/upload paths, MongoDB connection patterns, socket events, scheduled tasks and outbound integrations.
2. Decide MongoDB connectivity supported by the selected Cloudflare runtime (including TLS, connection pooling, regional latency, transaction semantics and Atlas network access); prove it with a minimal isolated deployment.
3. Decide on real-time transport. Socket.IO requires an explicitly tested compatible adapter or a new WebSocket protocol with client migration. Durable Objects may be suitable but require implementation and tests.
4. Decide how to handle scheduled jobs using Cron Triggers/Queues and distributed job leases, with idempotent payment processing.
5. Define rollback, security, secrets, CORS, observability and data-retention requirements.

## Gate 2 — Compatibility proof (staging only)

- Create a separate Cloudflare Worker project with `nodejs_compat` and a pinned compatibility date.
- Implement isolated `/health/live` and `/health/ready` handlers, not a claim of full API compatibility.
- Verify MongoDB reads/writes, auth cookies/JWT, file upload, payment webhook raw-body verification and network egress in Cloudflare staging.
- Record reproducible evidence for every test; do not expose credentials in logs.

## Gate 3 — Port features and test

- Port all API routers and middlewares or provide explicitly documented alternatives.
- Replace server-local timers with scheduled handlers and reliable queue semantics.
- Port Socket.IO events, reconnect behavior, room authorization and message delivery; test multi-instance behavior.
- Validate admin, tutor, student, payments, chat, notifications, search and meeting endpoints.
- Run security, load, accessibility, contract and end-to-end tests.

## Gate 4 — Controlled cutover

1. Prepare `api.tutorera.ac.pk` and secrets in staging, without altering production DNS.
2. Run a full smoke and transaction test suite against staging.
3. Verify frontend `NEXT_PUBLIC_API_URL` build-time value. Remove the legacy Render fallback **only after** the Cloudflare API is proven.
4. Roll out canary traffic with error-rate, latency and data-integrity thresholds.
5. Confirm the old Render service is no longer receiving traffic, then decommission it after the rollback window.

## Stop conditions

Do not cut over if MongoDB connectivity, payment webhooks, WebSocket authorization, cron jobs, or frontend API origin are unverified. The migration is not complete merely because a GitHub PR builds successfully.
