# TUTORERA blog SEO / AEO / GEO / LLMO release checklist

Status: **pending validation and editorial approval**. This document does not certify production readiness.

## Content and indexability
- [ ] Fact-check all 20 Markdown drafts; verify curriculum terminology, fees, policies, claims and citations against primary sources.
- [ ] Obtain editorial approval and import drafts as **unpublished** CMS records first.
- [ ] Verify public `GET /blogs` and `GET /blogs/:slug` never expose unpublished drafts.
- [ ] Verify blog sitemap includes only publicly accessible, indexable articles; test deleted/unpublished slugs return 404/noindex.
- [ ] Confirm canonical URLs and unique metadata on the blog hub, topic hub and individual guides.
- [ ] Verify dates and authorship are accurate; do not claim human review without evidence.

## Internal linking and conversion
- [ ] Check each article has relevant, non-duplicative related-guide links.
- [ ] Check topic hub lists only published articles and links are not broken.
- [ ] Check tutor cards are populated only with approved, publicly visible tutor profiles.
- [ ] Test city, country, subject and curriculum matching using Pakistan, UAE, Saudi Arabia, UK and US examples.
- [ ] Verify booking CTA goes to a functional tutor profile; test authenticated and unauthenticated flows.
- [ ] Show a meaningful empty state when no exact matches are available; do not invent tutors or availability.

## Structured data
- [ ] Validate Article and BreadcrumbList JSON-LD using Schema.org Validator and Google Rich Results Test where applicable.
- [ ] Validate CollectionPage/ItemList against rendered URLs.
- [ ] Ensure Organization @id matches site-wide graph and author/reviewer identity URLs resolve.
- [ ] Confirm no unsupported review/rating, FAQ or availability claims are inserted.

## Engineering
- [ ] Run frontend lint, TypeScript check and production build.
- [ ] Run backend tests and ensure Cloudflare frontend validation passes.
- [ ] Test server rendering, cache freshness, API errors, and mobile/accessibility.
- [ ] Confirm robots.txt and sitemap.xml are accessible in production.
- [ ] Review PR and deploy only after all required checks pass.

## Post-deployment
- [ ] Submit sitemap to Google Search Console and Bing Webmaster Tools.
- [ ] Inspect representative URLs for indexing and canonical selection.
- [ ] Monitor organic landing pages, indexed pages, qualified tutor profile visits, booking requests and completed bookings.
- [ ] Review AI-answer mentions as observational data; no ranking or citation guarantees.
