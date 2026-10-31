// src/middlewares/agentRequest.middleware.ts
//
// Input validation and sanitisation for Supervisor Agent endpoints.
// Runs after authentication, before the controller.

import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";

const MAX_MESSAGE_LENGTH = 1000;

// Reject strings that look like prompt-injection attempts or code execution.
// These are applied defensively — the planner never passes input to an AI model
// in Phase 1-7, but this guard future-proofs Phase 8+ model integration.
const BLOCKED_PATTERNS = [
  /ignore (all |previous )?instructions/i,
  /system prompt/i,
  /you are (now |an? )?/i,
  /<script[\s>]/i,
  /\$\{.*\}/,         // template literal injection
  /`[^`]*`/,          // backtick execution attempt
];

export function validateAgentMessage(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const { message } = req.body as { message?: unknown };

  if (message === undefined || message === null) {
    // GET endpoints don't have a body — pass through
    next();
    return;
  }

  if (typeof message !== "string") {
    res.status(400).json({ error: "message must be a string" });
    return;
  }

  const trimmed = message.trim();
  if (!trimmed) {
    res.status(400).json({ error: "message must not be empty" });
    return;
  }
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    res.status(400).json({ error: `message too long (max ${MAX_MESSAGE_LENGTH} characters)` });
    return;
  }

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(trimmed)) {
      res.status(400).json({ error: "message contains disallowed content" });
      return;
    }
  }

  // Sanitise: strip null bytes and control characters (keep printable + common whitespace)
  req.body.message = trimmed.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");
  next();
}
