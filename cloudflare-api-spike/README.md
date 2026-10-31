# TUTORERA Cloudflare MongoDB compatibility spike

This isolated Worker **does not serve application traffic**. Never attach the production API domain.

## Setup

```sh
cd cloudflare-api-spike
npm install
npm run typecheck
npx wrangler deploy --dry-run
```

Review and commit the generated lockfile before enabling CI with `npm ci`.

For authorized staging only, create a dedicated MongoDB Atlas user restricted to a **new, disposable test database**, with read/write permissions only on that database. Name the database `tutorera_spike_<unique_suffix>`. Do not reuse a production database or administrator credential. Configure secure Atlas network access; do not expose production credentials or relax network access without review.

Set secrets without committing values:

```sh
npx wrangler secret put MONGO_URI
npx wrangler secret put SPIKE_TEST_TOKEN
```

Set `MONGO_TEST_DB` as a staging variable in Wrangler or the Cloudflare dashboard. Keep `ENVIRONMENT=staging`. Deploy only to the isolated `tutorera-api-compat-spike` Worker.

## Tests

`GET /health/live` is public and does not touch MongoDB.

`GET /health/ready` requires `Authorization: Bearer <SPIKE_TEST_TOKEN>`; it checks MongoDB connectivity.

`POST /test/mongodb` requires the same bearer token. It inserts, reads and deletes a temporary record **only** in the configured dedicated test database. It returns `readWrite: true` when successful. Do not use production data.

`POST /test/transaction` requires the same bearer token and verifies that a transaction can insert/read a temporary record and roll back without persisting it. This requires an Atlas deployment that supports multi-document transactions.

Run `npm run smoke:staging` with `SPIKE_BASE_URL` pointing only to the isolated Worker and `SPIKE_TEST_TOKEN` supplied securely. The script checks unauthorized access before running the database tests.

Use a secret injected from a secure shell environment rather than pasting it into scripts or logs. Verify missing/incorrect tokens return 401, missing configuration returns 503, and the staging-only guard prevents non-staging operations.

## Limitations and next gates

This is a driver compatibility check, not a production-ready connection pool. It opens and closes a connection per test request intentionally. It does **not** establish transaction support, Mongoose compatibility, concurrent-load behavior, cold-start reliability, Socket.IO, payment processing, file uploads or job execution. Test these separately before production cutover.

Do not configure production DNS, change frontend API URLs, or delete existing infrastructure. Revoke the staging credentials and remove the Worker after the experiment.
