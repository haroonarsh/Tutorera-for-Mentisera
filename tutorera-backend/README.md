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
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login user |
| GET | /api/auth/me | Get current user |
| GET | /api/tutors | Get all tutors |
| GET | /api/tutors/:id | Get tutor by ID |
| POST | /api/tutors/profile | Create/update profile |
| POST | /api/tutors/onboarding/step | Save onboarding step |
| GET | /api/admin/verifications | Get pending tutors |
| PATCH | /api/admin/verify/:id | Approve/reject tutor |
| GET | /api/admin/users | Get all users |
| POST | /api/requests | Create tuition request |
| POST | /api/requests/:id/bids | Place bid |
| GET | /api/bookings | Get my bookings |
| POST | /api/reviews/:tutorId | Create review |
| GET | /api/blogs | Get all blogs |
| POST | /api/contact | Submit contact form |
| POST | /api/upload/avatar | Upload avatar |

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