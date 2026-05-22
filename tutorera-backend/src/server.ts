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
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
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