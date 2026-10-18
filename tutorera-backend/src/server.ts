import dotenv from "dotenv";
import http from "http";
import mongoose from "mongoose";
import connectDB from "./config/db";
import { validateEnv } from "./config/env";
import { initSocket } from "./utils/socket";
import app from "./app";
import logger from "./config/logger";
import { processOfferExpirations } from "./utils/offerExpiry";
import { processAbandonedJourneyRecovery } from "./utils/abandonedJourneyRecovery";
import { processRequestLifecycle } from "./services/requestLifecycle.service";
import { processPendingPayouts } from "./services/payout.service";
import { refreshRates } from "./services/exchangeRate.service";
import { withDistributedJobLease } from "./services/jobLease.service";

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

const PORT = process.env.PORT || 5000;
const server = httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
// Lease every repeatable task by name so horizontally scaled Render workers
// do not concurrently run expiry/recovery/reconciliation for the same period.
const runLeased = (name: string, work: () => Promise<unknown>) => () =>
  withDistributedJobLease(name, work).catch(err => logger.error({ err, name }, "Leased background job failed"));
const runOffers = runLeased("offer-expiration", () => processOfferExpirations(io));
const runJourney = runLeased("abandoned-journey", () => processAbandonedJourneyRecovery());
const runRequestLifecycle = runLeased("request-lifecycle", () => processRequestLifecycle(io));
const runPayoutScan = runLeased("payout-reconciliation-scan", () => processPendingPayouts());
const runForex = runLeased("exchange-rate-refresh", () => refreshRates());
const offerExpiryTimer = setInterval(runOffers, 15 * 60 * 1000);
const abandonedJourneyTimer = setInterval(runJourney, 60 * 60 * 1000);
const requestLifecycleTimer = setInterval(runRequestLifecycle, 15 * 60 * 1000);
const payoutTimer = setInterval(runPayoutScan, 60 * 60 * 1000);
const exchangeRateTimer = setInterval(runForex, 60 * 60 * 1000);
for (const timer of [offerExpiryTimer, abandonedJourneyTimer, requestLifecycleTimer, payoutTimer, exchangeRateTimer]) timer.unref();
setTimeout(runOffers, 10_000).unref();
setTimeout(runJourney, 20_000).unref();
setTimeout(runRequestLifecycle, 15_000).unref();
setTimeout(runPayoutScan, 30_000).unref();
setTimeout(runForex, 5_000).unref();

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
  clearInterval(offerExpiryTimer);
  clearInterval(abandonedJourneyTimer);
  clearInterval(requestLifecycleTimer);
  clearInterval(payoutTimer);
  clearInterval(exchangeRateTimer);

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
