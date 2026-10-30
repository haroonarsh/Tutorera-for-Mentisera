const account = process.env.CLOUDFLARE_ACCOUNT_ID;
const zone = process.env.CLOUDFLARE_ZONE_ID || "161f01664efbf705463b1d4460a16675";
const token = process.env.CLOUDFLARE_API_TOKEN;

try {
  if (!account || !token) throw new Error("Missing local or CI Cloudflare credentials.");
  async function read(path) {
    const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
      headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15000),
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(`Cloudflare credential check failed (${response.status}).`);
    return data.result;
  }
  const verification = await read(`/accounts/${account}/tokens/verify`);
  if (verification.status !== "active") throw new Error("Cloudflare token is not active.");
  const found = await read(`/zones/${zone}`);
  if (found.name !== "tutorera.ac.pk" || found.account?.id !== account) {
    throw new Error("Cloudflare zone/account mismatch.");
  }
  console.log("Cloudflare token is active; tutorera.ac.pk belongs to the configured account and zone.");
} catch (error) {
  // Errors contain only our fixed messages, never provider responses or secrets.
  console.error(error instanceof Error && /^(Missing|Cloudflare)/.test(error.message) ? error.message : "Cloudflare verification failed; check network connectivity.");
  process.exitCode = 1;
}
