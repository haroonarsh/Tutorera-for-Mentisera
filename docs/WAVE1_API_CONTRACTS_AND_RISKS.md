# Wave 1 API contracts and migration risks

Verified against current `main` source on 2026-10-31. This is a code inspection, not a live endpoint test.

## Express paths and response shapes

| Route | Query / input | Success | Error |
|---|---|---|---|
| `GET /api/v1/public/stats` | none | `200 {success:true,stats:{totalTutors,verifiedTutors,verifiedPercent,policeVerified,totalBookings,completedSessions,totalStudents}}` | `500 {success:false,message}` |
| `GET /api/v1/public/verify/report/:reportId` | report ID | `200 {success:true,data:{reportReference,tutorName,periodStart,periodEnd,grossAmount,netPayout,totalDeduction,sessionsCompleted,paymentDate,complianceStatus,generatedAt,expiresAt,digest,verified}}` | 404 missing; 500 failure |
| `GET /api/v1/tutoring-index` | required `country` ISO alpha-2, `currency` ISO alpha-3; optional `period=3m|6m|12m`, `subject` | `200 {success:true,index:{market,methodologyVersion,minimumSampleSize,publishedAt,period,summary,subjects,trends}}` | 400 invalid filters |
| `GET /api/v1/pricing/insights` | optional `city`, `subject`, `teachingMode` | `200 {success:true,insight:{count,min,max,median,sampleSource}}` | no explicit controller error response |

These routes are mounted under `/api/v1` with a general rate limiter. Do not accidentally migrate to older comments' `/api/public` prefix.

## Risks requiring review before migration

1. **Payout report verification**: the unauthenticated route returns tutor name and financial totals to callers who know a report ID. Verify report ID entropy, report publication policy, consent, expiration enforcement, and which fields may be public before copying this behavior to a Worker.
2. **Pricing insight currency consistency**: booking rates are combined without an explicit currency filter, while tutor profile rates include PKR only. Verify booking currency model and fix aggregation semantics before public parity or SEO claims.
3. **Pricing subject filter**: the request's `subject` string is interpolated into a MongoDB regular expression. Enforce escaping, length limits and safe query handling to avoid costly regex patterns.
4. **Tutoring index sample size**: subject-level results use a minimum sample of five, but aggregate totals and trends may include smaller cohorts. Review privacy thresholds.
5. **Tutoring index query volume**: request, bid and booking data are loaded into memory and grouped in application code. Profile memory, latency and response size before moving to Workers.
6. **Public stats**: `policeVerified` currently counts non-empty `policeCertificate` fields, not a confirmed verification status. Validate labeling before presenting as verified.
7. **Compatibility**: retain status codes, shapes, cache policy and error behavior unless a reviewed security correction explicitly changes them.

## Required tests

- Contract fixtures for successful and missing payout reports, and report authorization/expiration policy.
- Empty and populated public stats, with a validated police verification definition.
- Tutoring index invalid country/currency/period, no-data response, 5-sample threshold, country/currency separation.
- Pricing insight zero-data response, currency consistency, hostile regex patterns, and realistic high-cardinality data.
- Worker staging vs Express comparison using synthetic records only.

**Do not deploy or cut over these routes based on this inventory alone.**
