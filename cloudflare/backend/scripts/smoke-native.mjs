import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const port = 8792;
const previewToken = "local-fixture-preview-credential-not-for-production";
const cli = fileURLToPath(new URL("../node_modules/wrangler/bin/wrangler.js", import.meta.url));
const child = spawn(process.execPath, [cli, "dev", "--local", "--port", String(port), "--inspector-port", "9292", "--var", `PREVIEW_AUTH_TOKEN:${previewToken}`], {
  cwd: fileURLToPath(new URL("..", import.meta.url)),
  env: { ...process.env, WRANGLER_SEND_METRICS: "false" },
  stdio: ["ignore", "pipe", "pipe"],
});
// Capture for process drainage, but do not print arbitrary dependency logs.
child.stdout.on("data", () => {});
child.stderr.on("data", () => {});

try {
  let healthy = false;
  for (let attempt = 0; attempt < 90; attempt++) {
    if (child.exitCode !== null) throw new Error("Native Worker exited before liveness succeeded.");
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health/live`, { headers: { "X-Tutorera-Preview-Token": previewToken }, signal: AbortSignal.timeout(2000) });
      if (response.ok && (await response.json()).status === "alive") { healthy = true; break; }
    } catch { /* Startup/build in progress. */ }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  assert.ok(healthy, "Native Worker did not become live.");
  const blocked = await fetch(`http://127.0.0.1:${port}/internal/jobs/email-outbox-delivery`, { method: "POST", headers: { "X-Tutorera-Preview-Token": previewToken } });
  assert.equal(blocked.status, 404);
  console.log("Native workerd smoke passed: Express liveness 200; public internal-job route 404. Database/provider workflows are not covered.");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  child.kill("SIGTERM");
}
