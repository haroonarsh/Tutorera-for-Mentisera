/** Resolve backend dependencies from one installation/connection instance. */
export { default as mongoose } from "mongoose";
export { default as app } from "../app";
export { initSocket } from "../utils/socket";
export { validateEnv } from "../config/env";
export { assertSwichRuntimeConfiguration } from "../services/swichProvider.service";
export { runScheduledJob } from "../services/schedulerRuntime.service";
