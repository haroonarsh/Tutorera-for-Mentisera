import { MongoClient } from "mongodb";

interface Env {
  ENVIRONMENT: string;
  MONGO_URI?: string;
}

const json = (body: Record<string, string>, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method !== "GET") return json({ error: "Method not allowed" }, 405);
    if (url.pathname === "/health/live") {
      return json({ status: "ok", environment: env.ENVIRONMENT });
    }
    if (url.pathname === "/health/ready") {
      // This is an isolated MongoDB driver compatibility test, NOT proof that
      // the full Express/Mongoose/Socket.IO application works in Workers.
      if (!env.MONGO_URI) return json({ status: "unavailable", reason: "MongoDB not configured" }, 503);
      const client = new MongoClient(env.MONGO_URI, {
        serverSelectionTimeoutMS: 4000,
        connectTimeoutMS: 4000,
        maxPoolSize: 1,
      });
      try {
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        return json({ status: "ready" });
      } catch {
        // Do not expose URI, hostnames, driver stack traces or credentials.
        return json({ status: "unavailable", reason: "MongoDB connectivity check failed" }, 503);
      } finally {
        await client.close().catch(() => undefined);
      }
    }
    return json({ message: "Compatibility spike only; application routes not deployed" }, 404);
  },
};
