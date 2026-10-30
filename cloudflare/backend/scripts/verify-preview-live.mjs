import { randomBytes } from "node:crypto";
const account = "e0f40de5e1f6ab0e29c9b1cb3f9a7102";
const name = "tutorera-backend-preview";
const previewToken = randomBytes(32).toString("hex");

try {
  if (!process.env.CLOUDFLARE_API_TOKEN) throw new Error("Cloudflare verification credentials are missing");
  // Rotate this private preview credential without exposing or persisting it.
  const result = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/${name}/secrets`, {
    method: "PUT", headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: "PREVIEW_AUTH_TOKEN", text: previewToken, type: "secret_text" }), signal: AbortSignal.timeout(15000),
  });
  if (!result.ok) throw new Error(`Preview credential rotation failed (HTTP ${result.status})`);
  let healthy = false;
  for (let attempt = 0; attempt < 15; attempt++) {
    try {
      const response = await fetch("https://api-preview.tutorera.ac.pk/health/ready", {
        headers: { "X-Tutorera-Preview-Token": previewToken }, signal: AbortSignal.timeout(10000),
      });
      const body = await response.json();
      if (response.ok && body.status === "ready") { healthy = true; break; }
    } catch { /* Wait for deployment and certificate propagation. */ }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  if (!healthy) throw new Error("Live private-preview readiness failed");
  for (const [path, authorized, method, expected] of [
    ["/health/live", false, "GET", 401],
    ["/health/live", true, "GET", 200],
    ["/api/v1/auth/me", true, "GET", 401],
    ["/api/v1/auth/login", true, "POST", 403],
  ]) {
    const response = await fetch(`https://api-preview.tutorera.ac.pk${path}`, {
      method, headers: authorized ? { "X-Tutorera-Preview-Token": previewToken } : {}, signal: AbortSignal.timeout(15000),
    });
    await response.body?.cancel();
    console.log(JSON.stringify({ check: "live-protected-preview", path, method, authorized, status: response.status, expected, noindex: /noindex/.test(response.headers.get("X-Robots-Tag") || "") }));
    if (response.status !== expected) throw new Error("Live preview access control check failed");
  }
  console.log("Live preview checks passed: MongoDB readiness, private access, login-required guard and write protection. No production DNS, emails or payments changed.");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
