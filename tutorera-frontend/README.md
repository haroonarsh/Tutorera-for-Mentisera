# TUTORERA® Frontend

Next.js frontend for Pakistan's tutoring marketplace.

## Tech Stack
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS + Inline Styles
- Axios
- Deployed on Vercel

## Live URL
https://tutorera-frontend.vercel.app

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