import { test } from "node:test";
import assert from "node:assert/strict";
import { requireSettings, checkHttp, deployRender } from "./release-checks.mjs";
const env = { RENDER_API_KEY: "fixture-only", RENDER_SERVICE_ID: "srv-fixture", GITHUB_SHA: "a".repeat(40) };
const sleep = async () => {};
const json = (body, status = 200) => Response.json(body, { status });

test("missing credentials fail instead of skipping deployment", () => {
  assert.throws(() => requireSettings({}, ["CLOUDFLARE_API_TOKEN"]), /Missing release settings/);
});
test("smoke check fails on redirects and exhausted unhealthy responses", async () => {
  for (const status of [301, 403, 500]) await assert.rejects(checkHttp("https://fixture.test", { fetchFn: async () => new Response(null, { status }), attempts: 2, sleep }), /smoke check failed/);
});
test("readiness requires expected JSON, not just HTTP 200", async () => {
  await assert.rejects(checkHttp("https://fixture.test", { fetchFn: async () => json({ status: "degraded" }), attempts: 1, ready: true }), /smoke check failed/);
  await checkHttp("https://fixture.test", { fetchFn: async () => json({ status: "ready" }), attempts: 1, ready: true });
});
test("a healthy previous frontend version cannot satisfy release verification", async () => {
  await assert.rejects(checkHttp("https://fixture.test/BUILD_ID", { fetchFn: async () => new Response("old-build"), attempts: 1, expectedText: "new-build" }), /smoke check failed/);
  await checkHttp("https://fixture.test/BUILD_ID", { fetchFn: async () => new Response("new-build"), attempts: 1, expectedText: "new-build" });
});
test("Render HTTP failures fail without repeating POST", async () => {
  let calls = 0;
  await assert.rejects(deployRender(env, { fetchFn: async () => { calls++; return json({}, 401); }, sleep }), /API failed \(401\)/);
  assert.equal(calls, 1);
});
test("Render pins commitId and waits for that deployment to be live", async () => {
  let calls = 0;
  const id = await deployRender(env, { sleep, fetchFn: async (url, options) => {
    calls++;
    if (calls === 1) { assert.deepEqual(JSON.parse(options.body), { commitId: env.GITHUB_SHA }); return json({ id: "dep-fixture" }); }
    assert.ok(url.endsWith("/dep-fixture"));
    return json({ commit: { id: env.GITHUB_SHA }, status: calls === 2 ? "build_in_progress" : "live" });
  } });
  assert.equal(id, "dep-fixture"); assert.equal(calls, 3);
});
test("Render rejects failed, mismatched and timed-out deployments", async () => {
  for (const state of [{ status: "build_failed", commit: { id: env.GITHUB_SHA } }, { status: "live", commit: { id: "b".repeat(40) } }, { status: "build_in_progress", commit: { id: env.GITHUB_SHA } }]) {
    let calls = 0;
    await assert.rejects(deployRender(env, { polls: 1, sleep, fetchFn: async () => json(++calls === 1 ? { id: "dep-fixture" } : state) }));
  }
});
