import dns from "node:dns";
import mongoose from "mongoose";
import logger from "./logger";

// Pool size is tunable via environment so capacity can be adjusted without a
// code change. Render Free allows 1 instance; a pool larger than the number of
// concurrent requests it can handle just wastes Atlas connection quota.
// Default: 5 connections — enough for a lightly-loaded single instance.
// Raise MONGO_MAX_POOL_SIZE (e.g. 10) only after load-testing confirms Atlas
// and the instance can absorb the extra connections without degrading.
const maxPoolSize = Math.max(1, parseInt(process.env.MONGO_MAX_POOL_SIZE || "5", 10));

const connectDB = async (): Promise<void> => {
  try {
    try {
      dns.setServers(["8.8.8.8", "1.1.1.1"]);
    } catch {
      // ignore if custom DNS cannot be set
    }
    const conn = await mongoose.connect(process.env.MONGO_URI as string, {
      maxPoolSize,
      minPoolSize: 1,
      // Fail fast on Atlas connection problems rather than blocking requests
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    logger.info({ host: conn.connection.host, maxPoolSize }, "MongoDB connected");
  } catch (error) {
    logger.error({ err: error }, "MongoDB connection failed");
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    } else {
      console.warn("⚠️ Continuing in development mode without database connection. Please update MONGO_URI in tutorera-backend/.env with your valid credentials.");
    }
  }
};

export default connectDB;