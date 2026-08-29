import pino from "pino";

// Structured logger with automatic redaction of sensitive fields. Anything
// matching these paths is replaced with "[REDACTED]" in the log output —
// so passwords, tokens, and auth headers never end up in log files or a
// log aggregation service, even if a developer accidentally logs a full
// request/user object during debugging.
const logger = pino({
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug"),
    redact: {
        paths: [
        "password",
        "*.password",
        "token",
        "*.token",
        "req.headers.authorization",
        "req.headers.cookie",
        "*.otp",
        "otp",
        "*.jwt",
        "req.body.password",
        "req.body.token",
        ],
        censor: "[REDACTED]",
    },
  // In development, pretty-print for readability. In production, emit plain
  // JSON lines — this is what lets a log aggregator (or a simple grep on
  // Render's log stream) filter/search by field, including requestId.
    transport:
        process.env.NODE_ENV !== "production"
        ? { target: "pino-pretty", options: { colorize: true, translateTime: "SYS:standard" } }
        : undefined,
});

export default logger;