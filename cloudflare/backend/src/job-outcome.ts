/** A busy Mongo lease is deferred work, never a completed queue item. */
export async function runQueuedJob(
  run: () => Promise<{ acquired: boolean }>,
  attempts: number,
  now: number,
): Promise<{ state: "done" } | { state: "retry" | "failed"; attempts: number; nextAttempt: number }> {
  try {
    const result = await run();
    if (!result.acquired) return { state: "retry", attempts, nextAttempt: now + 60_000 };
    return { state: "done" };
  } catch {
    const nextAttempts = attempts + 1;
    return {
      state: nextAttempts >= 3 ? "failed" : "retry",
      attempts: nextAttempts,
      nextAttempt: now + 60_000 * 2 ** nextAttempts,
    };
  }
}
