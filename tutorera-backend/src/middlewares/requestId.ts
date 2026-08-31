// src/middlewares/requestId.ts
import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

// Extend Express's Request type so req.id is recognized everywhere in TS.
declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

// Attaches a unique ID to every incoming request. This lets you trace a
// single request's full story across log lines (route entry, DB calls,
// errors) by grepping one ID — instead of guessing which console.log lines
// belong to which of many concurrent requests.
//
// Uses Node's built-in crypto.randomUUID() rather than the "uuid" npm
// package — it's ESM-only as of v14, which breaks under Jest's default
// CommonJS transform, and Node has had this built in natively since v14.17.
//
// If the request already carries an X-Request-Id header (e.g. from a
// frontend proxy, a load balancer, or a client that wants to correlate its
// own logs with ours), that value is reused instead of generating a new one.
export default function requestId(req: Request, res: Response, next: NextFunction) {
    const incomingId = req.header("X-Request-Id");
    req.id = incomingId && incomingId.trim() !== "" ? incomingId : randomUUID();
    res.setHeader("X-Request-Id", req.id);
    next();
}