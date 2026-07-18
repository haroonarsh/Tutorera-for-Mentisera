import "express-async-errors";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import http from "http";
import connectDB from "./config/db";
import errorHandler from "./middlewares/errorHandler";
import { initSocket } from "./utils/socket";

import authRoutes from "./routes/auth.routes";
import tutorRoutes from "./routes/tutor.routes";
import studentRoutes from "./routes/student.routes";
import requestRoutes from "./routes/request.routes";
import bookingRoutes from "./routes/booking.routes";
import reviewRoutes from "./routes/review.routes";
import blogRoutes from "./routes/blog.routes";
import contactRoutes from "./routes/contact.routes";
import uploadRoutes from "./routes/upload.routes";
import adminRoutes from "./routes/admin.routes";
import notificationRoutes from "./routes/notification.routes";
import chatRoutes from "./routes/chat.routes";
import guaranteeRoutes from "./routes/guarantee.routes";
import referralRoutes from "./routes/referral.routes";
import aiRoutes from "./routes/ai.routes";
import earningsRoutes from "./routes/earnings.routes";

dotenv.config();

const app = express();
const httpServer = http.createServer(app);

// Initialize Socket.io
const io = initSocket(httpServer);

// Make io available in routes
app.set("io", io);

// Connect DB
connectDB();

// Middlewares
const allowedOrigins = [
  process.env.CLIENT_URL,
  "https://tutorera-frontend.vercel.app",
  "https://tutorera.ac.pk",
  "http://localhost:3000",
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, curl, mobile apps)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/tutors", tutorRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/guarantee", guaranteeRoutes);
app.use("/api/referral", referralRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/earnings", earningsRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Tutorera API is running 🚀" });
});

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});