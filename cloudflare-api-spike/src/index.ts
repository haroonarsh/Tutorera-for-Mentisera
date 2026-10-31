import { MongoClient } from "mongodb";

interface Env {
  ENVIRONMENT: string;
  MONGO_URI?: string;
  MONGO_TEST_DB?: string;
  SPIKE_TEST_TOKEN?: string;
}

const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
const json = (body: Record<string, string | number | boolean>, status = 200) =>
  Response.json(body, { status, headers });

function authorized(request: Request, env: Env): boolean {
  const expected = env.SPIKE_TEST_TOKEN;
  const provided = request.headers.get("Authorization");
  if (!expected || !provided?.startsWith("Bearer ")) return false;
  const token = provided.slice(7);
  if (token.length !== expected.length) return false;
  let difference = 0;
  for (let i = 0; i < token.length; i++) difference |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  return difference === 0;
}

async function withMongo<T>(env: Env, task: (client: MongoClient) => Promise<T>): Promise<T> {
  if (!env.MONGO_URI) throw new Error("not-configured");
  const client = new MongoClient(env.MONGO_URI, {
    serverSelectionTimeoutMS: 4000,
    connectTimeoutMS: 4000,
    maxPoolSize: 2,
  });
  try {
    await client.connect();
    return await task(client);
  } finally {
    await client.close().catch(() => undefined);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const path = new URL(request.url).pathname;
    if (path === "/health/live" && request.method === "GET") return json({ status: "ok" });
    if (path !== "/health/ready" && path !== "/test/mongodb") return json({ error: "Not found" }, 404);
    if (request.method !== (path === "/health/ready" ? "GET" : "POST"))
      return json({ error: "Method not allowed" }, 405);
    // Both DB operations are private to prevent unauthenticated scans and credential abuse.
    if (!authorized(request, env)) return json({ error: "Unauthorized" }, 401);
    if (env.ENVIRONMENT !== "staging" || !env.MONGO_URI)
      return json({ status: "unavailable" }, 503);
    try {
      if (path === "/health/ready") {
        await withMongo(env, (client) => client.db("admin").command({ ping: 1 }));
        return json({ status: "ready" });
      }
      // Never allow writes to an arbitrary or production database.
      if (!env.MONGO_TEST_DB || !/^tutorera_spike_[a-z0-9_]+$/.test(env.MONGO_TEST_DB))
        return json({ error: "Dedicated test database not configured" }, 503);
      const result = await withMongo(env, async (client) => {
        const collection = client.db(env.MONGO_TEST_DB!).collection<{ _id: string; createdAt: Date; purpose: string }>("compatibility_checks");
        const id = crypto.randomUUID();
        const document = { _id: id, createdAt: new Date(), purpose: "worker-compatibility" };
        try {
          await collection.insertOne(document);
          const found = await collection.findOne({ _id: id });
          return found?.purpose === document.purpose;
        } finally {
          await collection.deleteOne({ _id: id });
        }
      });
      return json({ status: result ? "passed" : "failed", readWrite: result }, result ? 200 : 503);
    } catch {
      // No connection strings, database names, or driver traces in public responses.
      return json({ status: "unavailable" }, 503);
    }
  },
};
