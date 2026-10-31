#!/usr/bin/env node
// Smoke check the canonical Tutorera API after a deployment.
// Usage: node scripts/smoke-api.mjs https://api.tutorera.ac.pk
const base = process.argv[2];
if (!base) {
  console.error("Usage: node scripts/smoke-api.mjs https://api.tutorera.ac.pk");
  process.exit(2);
}
let url;
try {
  url = new URL(base);
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) throw Error("invalid URL");
} catch {
  console.error("Expected an HTTPS API origin");
  process.exit(2);
}
for (const [path, expected] of [["/health/live", "ok"], ["/health/ready", "ready"]]) {
  try {
    const response = await fetch(new URL(path, url), { signal: AbortSignal.timeout(10000), headers: { Accept: "application/json" } });
    const payload = await response.json();
    if (!response.ok || payload.status !== expected) throw Error(`HTTP ${response.status}, status ${payload.status}`);
    console.log(`PASS ${path}`);
  } catch (error) {
    console.error(`FAIL ${path}: ${error.message}`);
    process.exitCode = 1;
  }
}
