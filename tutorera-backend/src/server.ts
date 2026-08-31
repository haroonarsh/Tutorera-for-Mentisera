import dotenv from "dotenv";
import http from "http";
import mongoose from "mongoose";
import connectDB from "./config/db";
import { validateEnv } from "./config/env";
import { initSocket } from "./utils/socket";
<<<<<<< HEAD
import app from "./app";
=======
import { generalLimiter } from "./middlewares/rateLimiters";

import authRoutes from "./routes/auth.routes";
import tutorRoutes from "./routes/tutor.routes";
import studentRoutes from "./routes/student.routes";
import requestRoutes from "./routes/request.routes";
import offerRoutes from "./routes/offer.routes";
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
>>>>>>> 98a85f4d85e6630ab68f0eb8bcb4c2b94a49650c

dotenv.config();

// Validate required environment variables before anything else boots.
// If this fails, the process exits immediately (see config/env.ts) instead
// of starting in a broken state and failing confusingly later.
validateEnv();

const httpServer = http.createServer(app);

// Initialize Socket.io
const io = initSocket(httpServer);

// Make io available in routes
app.set("io", io);

// Connect DB
connectDB();

<<<<<<< HEAD
=======
// Attach a unique ID to every request first, before any other middleware —
// so even errors thrown by later middleware (CORS rejection, rate limiting)
// can still be traced back to a specific request.
app.use(requestId);

// Structured HTTP request/response logging — one line per request, tagged
// with the same requestId set above, replacing the need for ad-hoc
// console.log calls scattered across controllers just to see traffic.
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => (req as any).id,
    customLogLevel: (req, res, err) => {
      if (err || res.statusCode >= 500) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
  })
);

// Security headers
app.use(helmet());

// Trust proxy — required for correct client IPs behind Render's proxy (needed for rate limiting to work correctly)
app.set("trust proxy", 1);

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
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "100kb" })); // explicit — this app sends small JSON payloads; file uploads go through Multer, not JSON bodies
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(cookieParser());

// Prevent HTTP Parameter Pollution — e.g. ?role=student&role=admin resolving
// to an array where code expects a single string, which can bypass filters
// or validation that only checks the "expected" shape.
app.use(hpp());

// General rate limit across all API routes
app.use("/api/v1", generalLimiter);

// API versioning: all routes are mounted under /api/v1. The frontend has
// been fully migrated and confirmed working in production as of this
// change — the legacy bare /api alias has been removed.
const apiRouter = express.Router();
apiRouter.use("/auth", authRoutes);
apiRouter.use("/tutors", tutorRoutes);
apiRouter.use("/students", studentRoutes);
apiRouter.use("/requests", requestRoutes);
apiRouter.use("/offers", offerRoutes);
apiRouter.use("/bookings", bookingRoutes);
apiRouter.use("/reviews", reviewRoutes);
apiRouter.use("/blogs", blogRoutes);
apiRouter.use("/contact", contactRoutes);
apiRouter.use("/upload", uploadRoutes);
apiRouter.use("/admin", adminRoutes);
apiRouter.use("/notifications", notificationRoutes);
apiRouter.use("/chat", chatRoutes);
apiRouter.use("/guarantee", guaranteeRoutes);
apiRouter.use("/referral", referralRoutes);
apiRouter.use("/ai", aiRoutes);
apiRouter.use("/earnings", earningsRoutes);

app.use("/api/v1", apiRouter);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Tutorera API is running 🚀" });
});

// Error Handler
app.use(errorHandler);

>>>>>>> 98a85f4d85e6630ab68f0eb8bcb4c2b94a49650c
const PORT = process.env.PORT || 5000;
const server = httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------
// On SIGTERM (sent by Render/most hosts when redeploying or scaling down) or
// SIGINT (Ctrl+C locally), stop accepting new connections, let in-flight
// requests finish, close the Socket.io server and the MongoDB connection,
// then exit. Without this, a deploy can kill the process mid-request,
// dropping active bookings/chat messages, and leave the DB connection in an
// unclean state.
let isShuttingDown = false;

async function gracefulShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n${signal} received. Starting graceful shutdown...`);

  server.close(async (err) => {
    if (err) {
      console.error("Error while closing HTTP server:", err);
    } else {
      console.log("✅ HTTP server closed");
    }

    io.close(() => {
      console.log("✅ Socket.io server closed");
    });

    try {
      await mongoose.connection.close();
      console.log("✅ MongoDB connection closed");
    } catch (dbErr) {
      console.error("Error while closing MongoDB connection:", dbErr);
    }

    process.exit(err ? 1 : 0);
  });

  setTimeout(() => {
    console.error("⚠️ Graceful shutdown timed out, forcing exit");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
