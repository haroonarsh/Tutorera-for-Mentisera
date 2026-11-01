# TUTORERA authoritative backend and deployment contract

**Decision:** `tutorera-backend/` is the single authoritative API application. Do not create a second implementation under `cloudflare/backend/`.

## Existing implementation
- Runtime: Node.js, Express, TypeScript, MongoDB/Mongoose and Socket.IO.
- Application entry: `tutorera-backend/src/app.ts`; process entry: `src/server.ts`.
- Canonical API prefix: `/api/v1`.
- Existing backend CI: `.github/workflows/backend-ci.yml` (build, tests and production dependency audit).
- Public API hostname target: `https://api.tutorera.ac.pk`.

## Production topology and cutover safeguards
The hostname is the desired endpoint, **not proof of the currently deployed origin**. Before changing DNS or deployment:
1. Identify the current Cloudflare DNS record, proxy mode, Worker route/custom domain, origin host, TLS certificate and deployment credentials. Record the currently running version and rollback method.
2. Confirm whether `cloudflare/backend/` exists in another branch, directory or external deployment and inventory its routes, data stores, cron jobs, queues and secrets.
3. Compare existing public API contracts and persisted data; migrate unique behavior into `tutorera-backend/` with tests.
4. Provision a Node-compatible runtime and MongoDB connectivity. Do **not** assume an Express/Mongoose/Socket.IO process can be deployed unchanged as a Cloudflare Worker. Cloudflare can proxy `api.tutorera.ac.pk` to a compatible origin.
5. Configure the required secrets in the deployment platform, never in Git. Verify CORS, JWT/cookie authentication, HTTPS, Socket.IO upgrades, webhook signature validation, rate limits and health checks.
6. Deploy to staging, run tests and smoke checks, perform a controlled hostname cutover, and monitor errors. Keep the previous origin available for rollback.
7. Only remove duplicate code and pipelines after route parity, data integrity and rollback are verified.

## Single source of truth
- Business logic, route contracts, database models, auth, booking/payment state machines and meeting policies belong in `tutorera-backend/`.
- Frontend calls the configured canonical API base URL; it must not call a second backend.
- No duplicate production deployments or conflicting database writers.

## Tutor-hosted meeting workflow
Tutor-owned Google Meet or Microsoft Teams links are accepted **only after an authorized, paid/confirmed booking**. Meeting URLs must be restricted to the booking participants and authorized administrators, not returned in public search or tutor profiles. Validate HTTPS and exact provider hostnames, prevent lookalike domains and redirects, rate-limit updates, audit changes, and expire access on cancellation. Never treat a submitted link as verified attendance.

For minors, enforce verified guardian consent and a documented safeguarding policy; tutor-owned meetings cannot guarantee hidden email identities or continuous admin observation. Admin reports must distinguish self-reported completion from provider-verified attendance. Existing admin-only booking completion and payment-sensitive transitions must remain intact.

## Deployment pipeline target
One pipeline should: install locked dependencies; run production dependency audit; compile TypeScript; execute unit, integration and marketplace tests; deploy staging; run smoke tests; require production approval; deploy the Node service; verify `https://api.tutorera.ac.pk`; and support rollback to a recorded release. Production deployment requires verified hosting credentials and infrastructure access; CI passing alone is not deployment evidence.
