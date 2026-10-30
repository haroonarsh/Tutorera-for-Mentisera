import { test } from "node:test";
import assert from "node:assert/strict";
import { runQueuedJob } from "../src/job-outcome.ts";

test("a busy lease retries without claiming completion or consuming failure attempts", async () => {
  assert.deepEqual(await runQueuedJob(async () => ({ acquired: false }), 2, 1000), {
    state: "retry", attempts: 2, nextAttempt: 61000,
  });
});

test("only acquired and successfully completed jobs are marked done", async () => {
  assert.deepEqual(await runQueuedJob(async () => ({ acquired: true }), 0, 1000), { state: "done" });
});

test("failures back off and become dead letters on the third attempt", async () => {
  const fail = async (): Promise<{ acquired: boolean }> => { throw new Error("fixture failure"); };
  assert.deepEqual(await runQueuedJob(fail, 0, 1000), { state: "retry", attempts: 1, nextAttempt: 121000 });
  assert.deepEqual(await runQueuedJob(fail, 1, 1000), { state: "retry", attempts: 2, nextAttempt: 241000 });
  assert.equal((await runQueuedJob(fail, 2, 1000)).state, "failed");
});
