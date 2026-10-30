import { readFileSync } from "node:fs";
import { checkPaymentRelease } from "../../cloudflare/backend/scripts/payment-release-policy.mjs";
import { checkHttp, deployRender } from "./release-checks.mjs";

try {
  const config = JSON.parse(readFileSync(new URL("../../cloudflare/backend/wrangler.jsonc", import.meta.url), "utf8"));
  checkPaymentRelease(config.env.production.vars);
  const id = await deployRender(process.env);
  await checkHttp("https://tutorera-backend.onrender.com/health/ready", { ready: true });
  console.log(`Render deployment ${id} is live and database-ready.`);
} catch (error) { console.error(error.message); process.exitCode = 1; }
