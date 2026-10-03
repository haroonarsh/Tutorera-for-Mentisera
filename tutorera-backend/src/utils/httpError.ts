/**
 * Typed boundary for errors that carry an HTTP status and a machine-readable
 * code. Services in the payment path throw these instead of untyped `Error`
 * objects with bolted-on properties, so controllers can translate them without
 * casting the caught value to `any`.
 */
export interface HttpError extends Error {
  statusCode?: number;
  code?: string;
  details?: Record<string, unknown>;
}

export function isHttpError(error: unknown): error is HttpError {
  return error instanceof Error && (typeof (error as HttpError).statusCode === "number" || typeof (error as HttpError).code === "string");
}

export function httpError(message: string, statusCode: number, code?: string, details?: Record<string, unknown>): HttpError {
  const error = new Error(message) as HttpError;
  error.statusCode = statusCode;
  if (code) error.code = code;
  if (details) error.details = details;
  return error;
}

export function statusCodeOf(error: unknown, fallback = 500): number {
  return isHttpError(error) && typeof error.statusCode === "number" ? error.statusCode : fallback;
}

export function codeOf(error: unknown, fallback?: string): string | undefined {
  return isHttpError(error) ? error.code : fallback;
}

export function messageOf(error: unknown, fallback = "Unexpected error"): string {
  return error instanceof Error && error.message ? error.message : fallback;
}