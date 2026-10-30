type QueueJob = { name: string; attempts: number; nextAttempt: number };

/** Bounded, read-only inspection. Never returns job payloads or credentials. */
export async function inspectJobQueue(storage: DurableObjectStorage) {
  const limit = 100;
  const [pending, failed] = await Promise.all([
    storage.list<QueueJob>({ prefix: "pending:", limit: limit + 1 }),
    storage.list<QueueJob>({ prefix: "failed:", limit: limit + 1 }),
  ]);
  const project = (rows: Map<string, QueueJob>) => [...rows].slice(0, limit).map(([key, job]) => ({
    id: key.slice(key.indexOf(":") + 1), name: job.name, attempts: job.attempts,
    nextAttempt: job.nextAttempt,
  }));
  return {
    observedAt: new Date().toISOString(), limit,
    pending: project(pending), failed: project(failed),
    pendingTruncated: pending.size > limit, failedTruncated: failed.size > limit,
  };
}
