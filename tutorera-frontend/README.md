# TUTORERA® Frontend

Next.js frontend for TUTORERA's global student-led tutoring marketplace.

## Tech Stack
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS + Inline Styles
- Axios
- OpenNext for Cloudflare
- Deployed on Cloudflare Workers

## Live URL
https://tutorera.ac.pk

## Production hosting

Production traffic must resolve through Cloudflare Workers/OpenNext using the Worker routes in `wrangler.jsonc`.

The legacy Vercel preview host is not the canonical product domain. If a Vercel project is retained for emergency redirects only, it must redirect to `https://tutorera.ac.pk` and emit `X-Robots-Tag: noindex, nofollow, noarchive`.

## Local Setup

### 1. Clone the repo
\```bash
git clone <repo-url>
cd tutorera-frontend
\```

### 2. Install dependencies
\```bash
npm install
\```

### 3. Setup environment variables
\```bash
cp .env.example .env.local
# Fill in your values
\```

### 4. Run development server
\```bash
npm run dev
\```

## Pages

| Route | Description |
|-------|-------------|
| / | Home page |
| /tutors | Browse tutors |
| /tutors/[id] | Tutor profile |
| /login | Login |
| /register | Register |
| /onboarding/tutor | Tutor onboarding (5 steps) |
| /onboarding/student | Student onboarding |
| /dashboard | User dashboard |
| /profile | Edit profile |
| /become-a-tutor | Tutor landing page |
| /blog | Blog listing |
| /blog/[slug] | Blog post |
| /contact | Contact form |
| /admin | Admin dashboard |
| /admin/verifications | Verify tutors |
| /admin/users | Manage users |
