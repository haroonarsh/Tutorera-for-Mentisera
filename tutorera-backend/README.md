# TUTORERA® Backend API

REST API for Pakistan's tutoring marketplace platform.

## Tech Stack
- Node.js + Express.js + TypeScript
- MongoDB Atlas + Mongoose
- JWT Authentication
- Cloudinary (file uploads)
- Nodemailer / Resend (emails)
- Deployed on Render

## Live API
https://tutorera-backend.onrender.com

## Local Setup

### 1. Clone the repo
\```bash
git clone <repo-url>
cd tutorera-backend
\```

### 2. Install dependencies
\```bash
npm install
\```

### 3. Setup environment variables
\```bash
cp .env.example .env
# Fill in your values in .env
\```

### 4. Run development server
\```bash
npm run dev
\```

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
| POST | /api/v1/reviews/:tutorId | Create review |
| GET | /api/v1/blogs | Get all blogs |
| POST | /api/v1/contact | Submit contact form |
| POST | /api/v1/upload/avatar | Upload avatar |

## Project Structure
\```
src/
├── config/          # DB and Cloudinary config
├── controllers/     # Business logic
├── middlewares/     # Auth, error, upload
├── models/          # Mongoose schemas
├── routes/          # Express routes
├── types/           # TypeScript interfaces
├── utils/           # Helper functions
├── validators/      # Zod schemas
└── server.ts        # Entry point
\```