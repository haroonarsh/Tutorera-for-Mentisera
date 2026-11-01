# TUTORERA controlled Cloudflare + MongoDB refactor

Status: planning and validation; **no production traffic cutover authorized**.

## Verified baseline
- Frontend: Next.js + OpenNext Cloudflare Worker (`tutorera-frontend/`).
- Existing backend: Express + Mongoose + Socket.IO (`tutorera-backend/`).
- Isolated MongoDB driver experiment: `cloudflare-api-spike/`; not serving production traffic.
- Existing recurring jobs: offer expiration, abandoned journey recovery, request lifecycle, payout reconciliation, FX refresh.
- Preserve MongoDB Atlas as the primary database; do not change schema or delete infrastructure before backups and rollback validation.

## Gates (in order)
1. **Inventory and safety:** capture production routing, environment-variable *names* (not values), MongoDB backup/restore test, collections, indexes, jobs, authentication and webhook endpoints. Document owner and rollback route.
2. **Compatibility:** isolated staging Worker with least-privilege Atlas credentials. Test connection reuse, cold starts, concurrency, regional latency, reconnects, driver compatibility, and failure responses. Do not expose secrets or open Atlas globally without reviewed controls.
3. **Database operations:** verify read/write and MongoDB transaction behavior in staging. If unsupported or unreliable, keep existing Node backend as a private MongoDB gateway; do not pretend direct Worker access is proven.
4. **API contracts:** inventory /api/v1 routes and capture request/response, authorization, idempotency and error semantics before migration.
5. **Extract services:** separate domain logic from Express req/res, Mongoose connection lifecycle, Socket.IO, and process timers; retain existing tests.
6. **Move scheduled work:** Cloudflare Cron/Queues with durable idempotency, retries, dead-letter handling and distributed exclusion for payout/booking mutations.
7. **Real-time:** replace or bridge Socket.IO only after authenticated message ordering, delivery, and persistence tests; evaluate Durable Objects.
8. **Files:** migrate uploads to R2 only with private buckets, signed access, validation, malware policy and rollback.
9. **Dashboard E2E:** student request -> tutor offer -> negotiation -> acceptance -> payment -> session -> review -> payout, plus tutor activation and admin controls.
10. **Cutover:** shadow/staging validation, monitoring, reversible routing, and written signoff before retiring old services.

## Initial non-negotiable acceptance tests
- Anonymous users cannot access protected resources or private R2 objects.
- Student/tutor/admin cross-role access is denied.
- Duplicate payment webhooks, offer acceptance, and payout jobs cannot double-charge or double-pay.
- MongoDB outages fail safely and do not report ready.
- All three dashboards use the same authoritative API and persistent data.
- Staging tests never modify production records.

## Keep / refactor / replace
| Component | Decision | Rationale |
|---|---|---|
| Next.js frontend | Keep/refactor | Existing OpenNext deployment and CI |
| MongoDB Atlas collections | Keep | Avoid destructive data migration |
| Express routes | Refactor incrementally | Preserve contracts and business logic |
| Mongoose models | Keep until compatibility proven | Avoid simultaneous schema and runtime migrations |
| Socket.IO | Evaluate bridge or replacement | Durable Objects require protocol design |
| Process timers | Replace | Workers are event-driven |
| Cloudflare API spike | Keep isolated | Compatibility experiment, not production API |
| Cloudinary/Multer | Evaluate migration | R2 requires secure upload redesign |

## Next implementation step
Extend the isolated compatibility spike with authenticated staging-only read/write/transaction tests, automated checks, and bounded connection handling. Never point the spike at production DNS or run mutation tests against production Atlas data.
