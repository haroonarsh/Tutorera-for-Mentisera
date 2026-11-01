import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import { ipKeyGenerator } from "express-rate-limit";

// Six injection patterns that cover the most common prompt-injection vectors.
// These are applied to the natural-language query before it reaches the agents.
const INJECTION_PATTERNS = [
  /ignore\s+(previous|prior|all|above)\s+instructions?/i,
  /system\s*:\s*you\s+are/i,
  /```[\s\S]*?(drop|delete|update|insert|exec|execute|eval|system|rm\s+-rf)/i,
  /\bexec(ute)?\s*\(/i,
  /\bnull\s*byte\b|\x00/,
  /\{\{.*?\}\}|\$\{.*?\}/,
];

const MAX_QUERY_LENGTH = 1000;

export function agentRequestMiddleware(req: Request, res: Response, next: NextFunction): void {
  const body = req.body as Record<string, unknown>;
  const query = body?.query;

  if (!query || typeof query !== "string") {
    res.status(400).json({ success: false, message: "query field is required and must be a string." });
    return;
  }

  // Strip null bytes
  const sanitized = query.replace(/\x00/g, "").trim();

  if (sanitized.length > MAX_QUERY_LENGTH) {
    res.status(400).json({
      success: false,
      message: `Query exceeds maximum length of ${MAX_QUERY_LENGTH} characters.`,
    });
    return;
  }

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(sanitized)) {
      res.status(400).json({
        success: false,
        message: "Query contains disallowed patterns and cannot be processed.",
      });
      return;
    }
  }

  // Write sanitized query back so controllers receive the cleaned value
  body.query = sanitized;
  next();
}

// Rate limiter: 20 requests per minute per authenticated user JWT id, fallback to IP
export const adminAgentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many agent requests. Please wait before retrying." },
  keyGenerator: (req) => {
    try {
      const auth = req.headers.authorization;
      if (auth?.startsWith("Bearer ")) {
        const token = auth.slice(7);
        const payload = jwt.verify(token, process.env.JWT_SECRET as string) as { id?: string };
        if (payload.id) return `agent:user:${payload.id}`;
      }
    } catch { /* fall through to IP */ }
    const address = req.ip || req.socket.remoteAddress;
    return address ? `agent:ip:${ipKeyGenerator(address)}` : "agent:ip:unknown";
  },
});
