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
import { seedDefaultLegalAgreements } from "./services/legalAgreement.service";
import { sendAgreementReminders } from "./services/legalAgreementReminder.service";
import { sendMissingDocumentsReminders } from "./services/missingDocumentsReminder.service";
import { ensureLaunchMarkets } from "./services/market.service";
import { assertSwichRuntimeConfiguration } from "./services/swichProvider.service";

dotenv.config();

// Validate required environment variables before anything else boots.
// If this fails, the process exits immediately (see config/env.ts) instead
// of starting in a broken state and failing confusingly later.
validateEnv();
assertSwichRuntimeConfiguration();

const httpServer = http.createServer(app);

// Initialize Socket.io
const io = initSocket(httpServer);

// Make io available in routes
app.set("io", io);

// Connect DB & seed legal agreements
connectDB().then(() => {
  seedDefaultLegalAgreements().catch(err => logger.error({ err }, "Initial legal agreement seed failed"));
  ensureLaunchMarkets().catch(err => logger.error({ err }, "Initial Switch market configuration failed"));
});

const PORT = process.env.PORT || 5000;
const server = httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
const offerExpiryTimer = setInterval(() => processOfferExpirations(io).catch(err => logger.error({ err }, "Offer expiry processing failed")), 15 * 60 * 1000);
offerExpiryTimer.unref();
const abandonedJourneyTimer = setInterval(() => processAbandonedJourneyRecovery().catch(err => logger.error({ err }, "Abandoned journey recovery failed")), 60 * 60 * 1000);
abandonedJourneyTimer.unref();
const requestLifecycleTimer = setInterval(() => processRequestLifecycle(io).catch(err => logger.error({ err }, "Request lifecycle processing failed")), 15 * 60 * 1000);
requestLifecycleTimer.unref();
const payoutTimer = setInterval(() => processPendingPayouts().catch(err => logger.error({ err }, "Payout processing failed")), 60 * 60 * 1000);
payoutTimer.unref();
setTimeout(() => processOfferExpirations(io).catch(err => logger.error({ err }, "Initial offer expiry processing failed")), 10_000).unref();
setTimeout(() => processAbandonedJourneyRecovery().catch(err => logger.error({ err }, "Initial abandoned journey recovery failed")), 20_000).unref();
setTimeout(() => processRequestLifecycle(io).catch(err => logger.error({ err }, "Initial request lifecycle processing failed")), 15_000).unref();
setTimeout(() => processPendingPayouts().catch(err => logger.error({ err }, "Initial payout processing failed")), 30_000).unref();

// Exchange rate refresh — runs hourly, warm cache on boot after 5 s
const exchangeRateTimer = setInterval(() => refreshRates().catch(err => logger.error({ err }, "Exchange rate refresh failed")), 60 * 60 * 1000);
exchangeRateTimer.unref();
setTimeout(() => refreshRates().catch(err => logger.error({ err }, "Initial exchange rate refresh failed")), 5_000).unref();

// Legal agreement reminders — already-activated tutors who still haven't
// accepted the current Tutor Agreement get emailed once daily (throttled
// inside the service itself) until they sign; publishAdminAgreement also
// fires an immediate one when a new version is published, so this daily
// run is the "keep nudging" half, not the only trigger.
const agreementReminderTimer = setInterval(() => sendAgreementReminders(io).catch(err => logger.error({ err }, "Legal agreement reminder run failed")), 24 * 60 * 60 * 1000);
agreementReminderTimer.unref();
setTimeout(() => sendAgreementReminders(io).catch(err => logger.error({ err }, "Initial legal agreement reminder run failed")), 40_000).unref();

const missingDocumentsReminderTimer = setInterval(() => sendMissingDocumentsReminders(io).catch(err => logger.error({ err }, "Missing documents reminder run failed")), 24 * 60 * 60 * 1000);
missingDocumentsReminderTimer.unref();
setTimeout(() => sendMissingDocumentsReminders(io).catch(err => logger.error({ err }, "Initial missing documents reminder run failed")), 50_000).unref();

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
