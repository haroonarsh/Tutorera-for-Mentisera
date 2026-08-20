import { Request, Response, NextFunction } from "express";

const errorHandler = (
  err: Error & { statusCode?: number },
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;

  // Always log the full error server-side, including stack trace, for debugging.
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} — ${err.message}`);
  console.error(err.stack);

  // Only trust err.message when the error was deliberately thrown with a known
  // statusCode (i.e. our own code intentionally raised it, like a 400/403/404
  // with a safe, user-facing message). Genuine unexpected errors (statusCode
  // missing, meaning a bug or infrastructure failure) get a generic message
  // instead, so we never leak DB connection strings, file paths, or other
  // internal details to the client.
  const isKnownOperationalError = !!err.statusCode;

  res.status(statusCode).json({
    success: false,
    message: isKnownOperationalError
      ? err.message
      : "Something went wrong. Please try again later.",
  });
};

export default errorHandler;