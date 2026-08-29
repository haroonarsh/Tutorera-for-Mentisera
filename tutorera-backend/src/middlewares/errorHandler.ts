import { Request, Response, NextFunction } from "express";
import logger from "../config/logger";

const errorHandler = (
  err: Error & { statusCode?: number },
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;

  // Always log the full error server-side, including stack trace, for debugging.
  // requestId ties this line to every other log line from the same request
  // (see middlewares/requestId.ts) so a single grep shows the full story.
  logger.error(
    {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      statusCode,
      err,
    },
    err.message
  );

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