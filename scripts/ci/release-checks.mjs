export function requireSettings(env, keys) {
  const missing = keys.filter((key) => !env[key]?.trim());
  if (missing.length) throw new Error(`Missing release settings: ${missing.join(", ")}`);
}

export async function checkHttp(url, { fetchFn = fetch, attempts = 12, sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)), ready = false, expectedText } = {}) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const response = await fetchFn(url, { redirect: "manual", signal: AbortSignal.timeout(15000), headers: { "Cache-Control": "no-cache" } });
      const healthy = response.status === 200 && (!ready || (await response.json()).status === "ready")
        && (expectedText === undefined || (await response.text()).trim() === expectedText);
      await response.body?.cancel().catch(() => {});
      if (healthy) return;
    } catch { /* Bounded retry; never log arbitrary response bodies or credentials. */ }
    if (attempt + 1 < attempts) await sleep(5000);
  }
  throw new Error("Release smoke check failed; deployment must not be reported healthy.");
}

export async function deployRender(env, { fetchFn = fetch, sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)), polls = 60 } = {}) {
  requireSettings(env, ["RENDER_API_KEY", "RENDER_SERVICE_ID", "GITHUB_SHA"]);
  if (!/^srv-[a-z0-9]+$/.test(env.RENDER_SERVICE_ID) || !/^[a-f0-9]{40}$/.test(env.GITHUB_SHA)) throw new Error("Invalid release service or commit identifier.");
  const endpoint = `https://api.render.com/v1/services/${env.RENDER_SERVICE_ID}/deploys`;
  async function api(url, options = {}) {
    const response = await fetchFn(url, { ...options, headers: { Authorization: `Bearer ${env.RENDER_API_KEY}`, "Content-Type": "application/json" }, signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`Render release API failed (${response.status}).`);
    return response.json();
  }
  // Never automatically retry POST: a lost response could already have deployed.
  const deployment = await api(endpoint, { method: "POST", body: JSON.stringify({ commitId: env.GITHUB_SHA }) });
  if (!/^dep-[a-z0-9]+$/.test(deployment.id || "")) throw new Error("Render returned no valid deployment ID.");
  for (let poll = 0; poll < polls; poll++) {
    const state = await api(`${endpoint}/${deployment.id}`);
    if (state.commit?.id !== env.GITHUB_SHA) throw new Error("Render deployment does not match the requested commit.");
    if (state.status === "live") return deployment.id;
    if (["created", "build_in_progress", "pre_deploy_in_progress", "update_in_progress", "queued"].includes(state.status)) {
      if (poll + 1 < polls) await sleep(10000);
    } else throw new Error("Render deployment failed, was cancelled, or has an unexpected status.");
  }
  throw new Error("Render deployment timed out before becoming live.");
}
