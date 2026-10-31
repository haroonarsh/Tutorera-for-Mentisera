#!/usr/bin/env node
// Safe staging smoke test: no secrets are logged and no production hostname is accepted.
const base = process.env.SPIKE_BASE_URL;
const token = process.env.SPIKE_TEST_TOKEN;
if (!base || !token) {
  console.error("Set SPIKE_BASE_URL and SPIKE_TEST_TOKEN in your secure environment.");
  process.exit(2);
}
let url;
try { url = new URL(base); } catch { console.error("Invalid SPIKE_BASE_URL"); process.exit(2); }
if (url.protocol !== "https:" || !/^tutorera-api-compat-spike\.[a-z0-9-]+\.workers\.dev$/.test(url.hostname) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
  console.error("Only the isolated Cloudflare compatibility Worker HTTPS hostname is allowed.");
  process.exit(2);
}
async function check(path, method, authenticated, expected) {
  const headers = authenticated ? { Authorization: `Bearer ${token}` } : {};
  const response = await fetch(new URL(path, url), { method, headers, signal: AbortSignal.timeout(15000) });
  if (response.status !== expected) throw new Error(`${path}: expected HTTP ${expected}, received ${response.status}`);
  console.log(`${method} ${path}: HTTP ${response.status}`);
  return response;
}
try {
  await check("/health/live", "GET", false, 200);
  await check("/health/ready", "GET", false, 401);
  await check("/test/mongodb", "POST", false, 401);
  await check("/health/ready", "GET", true, 200);
  const result = await check("/test/mongodb", "POST", true, 200);
  const body = await result.json();
  if (body.readWrite !== true) throw new Error("Read/write verification failed");
  const transaction = await check("/test/transaction", "POST", true, 200);
  if ((await transaction.json()).rollback !== true) throw new Error("Transaction rollback verification failed");
  console.log("Isolated MongoDB read/write and rollback smoke tests passed.");
} catch (error) {
  console.error("Staging smoke test failed:", error instanceof Error ? error.message : "unknown error");
  process.exitCode = 1;
}
