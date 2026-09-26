import dns from "node:dns";
import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
  try {
    try {
      dns.setServers(["8.8.8.8", "1.1.1.1"]);
    } catch {
      // ignore if custom DNS cannot be set
    }
    const conn = await mongoose.connect(process.env.MONGO_URI as string);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ DB Error: ${(error as Error).message}`);
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    } else {
      console.warn("⚠️ Continuing in development mode without database connection. Please update MONGO_URI in tutorera-backend/.env with your valid credentials.");
    }
  }
};

export default connectDB;