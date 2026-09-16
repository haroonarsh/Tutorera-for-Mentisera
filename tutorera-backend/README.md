# TUTORERA® Backend API

REST API for TUTORERA's student-led tutoring marketplace.

## Tech Stack
- Node.js + Express.js + TypeScript
- MongoDB Atlas + Mongoose
- JWT Authentication
- Cloudinary (file uploads)
- Nodemailer / Resend (emails)
- Rapid Gateway (payments)
- Deployed on Render

## Live API
https://tutorera-backend.onrender.com

## Local Setup

### 1. Clone the repo
```bash
git clone <repo-url>
cd tutorera-backend
```

### 2. Install dependencies
```bash
npm ci
```

### 3. Configure environment variables
Set the required application variables, including the Rapid Gateway server-side credentials:

```bash
RAPID_GATEWAY_SECRET_KEY=<merchant secret key>
RAPID_GATEWAY_WEBHOOK_SECRET=<webhook signing secret>
RAPID_GATEWAY_WEBHOOK_URL=https://your-api.example.com/api/v1/payments/webhook
RAPID_GATEWAY_API_BASE_URL=https://api.rapidgateway.pk
```

`RAPID_GATEWAY_SECRET_KEY` and `RAPID_GATEWAY_WEBHOOK_SECRET` must stay on the backend. They must never be exposed through `NEXT_PUBLIC_*`, browser JavaScript, or the frontend repository.

### 4. Run development server
```bash
npm run dev
```

## Payment Architecture

TUTORERA has one payment authority: the Render backend. Checkout creation is sent directly from the backend to Rapid Gateway over its REST API. The browser receives only the hosted checkout URL. Payment completion is accepted only from the signed Rapid Gateway webhook endpoint and is then checked against the booking/offer amount and currency before marketplace state is finalized.

There is no payment Cloudflare Worker and no direct database write path outside the backend payment services.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/auth/register | Register user |
| POST | /api/v1/auth/login | Login user |
| GET | /api/v1/auth/me | Get current user |
| GET | /api/v1/tutors | Get all tutors |
| GET | /api/v1/tutors/:id | Get tutor by ID |
| POST | /api/v1/tutors/profile | Create/update profile |
| POST | /api/v1/tutors/onboarding/step | Save onboarding step |
| GET | /api/v1/admin/verifications | Get pending tutors |
| PATCH | /api/v1/admin/verify/:id | Approve/reject tutor |
| GET | /api/v1/admin/users | Get all users |
| POST | /api/v1/requests | Create tuition request |
| POST | /api/v1/requests/:id/bids | Place bid |
| GET | /api/v1/bookings | Get my bookings |
| POST | /api/v1/payments/booking/:bookingId/checkout | Create Rapid Gateway checkout |
| POST | /api/v1/payments/webhook | Receive signed Rapid Gateway webhook |
| GET | /api/v1/payments/history | Get payment history |
| POST | /api/v1/reviews/:tutorId | Create review |
| GET | /api/v1/blogs | Get all blogs |
| POST | /api/v1/contact | Submit contact form |
| POST | /api/v1/upload/avatar | Upload avatar |

## Project Structure
```
src/
├── config/          # DB, environment and platform config
├── controllers/     # Business logic
├── middlewares/     # Auth, error, upload
├── models/          # Mongoose schemas
├── routes/          # Express routes
├── services/        # Marketplace/payment services
├── types/           # TypeScript interfaces
├── utils/           # Helper functions
├── validators/      # Zod schemas
└── server.ts        # Entry point
```
