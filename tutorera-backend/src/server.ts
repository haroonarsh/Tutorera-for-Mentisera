import "express-async-errors";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import connectDB from "./config/db";
import errorHandler from "./middlewares/errorHandler";

import authRoutes from "./routes/auth.routes";
import tutorRoutes from "./routes/tutor.routes";
import uploadRoutes from "./routes/upload.routes";

dotenv.config();

const app = express();

// Connect DB
connectDB();

// Middlewares
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/tutors", tutorRoutes);
app.use("/api/upload", uploadRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Tutorera API is running 🚀" });
});

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});