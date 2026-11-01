# TUTORERA hybrid deployment — approved direction

**Selected architecture:** Cloudflare frontend, Cloudflare DNS/TLS/WAF, separate Node.js-compatible backend, MongoDB Atlas. No Cloudflare Worker backend rewrite is planned.

## Container contract

- Build from `tutorera-backend/Dockerfile`, with the Docker build context set to `tutorera-backend`.
- Node.js 22, `npm ci` with the committed lockfile, TypeScript build, non-root runtime.
- Expose port 5000 and set `PORT=5000` in the hosting provider.
- Configure health checks: `/health/live` (process) and `/health/ready` (MongoDB).
- Persistent Socket.IO connections and scheduled jobs require an always-on runtime. Do not use a scale-to-zero HTTP-only service without validating these features.
- Initial deployment should use **one application instance** because the existing Socket.IO adapter and in-process schedulers need a scaling review. Do not assume multiple replicas are safe.

## Secrets and environment

Configure all variables required by `src/config/env.ts` in the provider's secret manager: `MONGO_URI`, `JWT_SECRET`, `PORT`, `JWT_EXPIRES_IN`, `CLIENT_URL`, `RESEND_API_KEY`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `EMAIL_USER`, `EMAIL_PASS`, `RESEND`, `GROQ_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `RAPID_GATEWAY_MERCHANT_ID`, `RAPID_GATEWAY_WEBHOOK_SECRET`.

Never copy secret values into GitHub, Docker layers, or logs. Verify Atlas network rules and least-privilege credentials.

## Safe cutover

1. Select a hosting provider and provision a private staging instance. No provider is selected in this repository.
2. Run the container, confirm MongoDB readiness, exercise tutor search and authorized admin/tutor/student workflows, Socket.IO and payment webhook signature tests.
3. Configure `api.tutorera.ac.pk` through Cloudflare DNS to the new origin only after the origin is verified; use Full (strict) TLS and review WebSocket and caching behavior.
4. Set frontend `NEXT_PUBLIC_API_URL=https://api.tutorera.ac.pk/api/v1` and rebuild/redeploy frontend after DNS/API validation.
5. Monitor errors, MongoDB query results, Socket.IO connections and scheduled jobs. Keep Render available for rollback until the acceptance window closes.
6. Disable the old Render deployment only after the new backend is proven and all traffic has moved.

**Important:** The old `render.yaml` is a legacy artifact, not a current deployment manifest. Its environment variable names differ from `src/config/env.ts`; do not use it as a source of truth.

## Rollback

Preserve the previous origin configuration, frontend release and database backup/snapshot. Revert Cloudflare DNS and frontend API configuration if critical auth, booking, payment, chat or data-integrity checks fail. Do not run competing scheduled jobs from both origins.
