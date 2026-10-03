import MigrationLedger from "../models/MigrationLedger.model";

/**
 * Records a migration run in the MigrationLedger collection.
 *
 * Dry runs (`planned`) are recorded too: an operator who inspected the counts
 * and then applied needs the plan and the execution linked to the same name,
 * and a second dry run appends rather than overwrites so the history is real.
 * Ledger writes never fail the migration itself — losing an audit row must not
 * block a data fix.
 */
export async function recordMigrationRun(params: {
  name: string;
  status: "planned" | "applied" | "failed";
  matched?: number;
  modified?: number;
  durationMs?: number;
  report?: Record<string, unknown>;
  error?: string;
}): Promise<void> {
  try {
    const entry = new MigrationLedger({
      name: params.name,
      status: params.status,
      plannedAt: new Date(),
      matched: params.matched ?? 0,
      modified: params.modified ?? 0,
      ...(params.durationMs !== undefined ? { durationMs: params.durationMs } : {}),
      ...(params.status === "applied" ? { appliedAt: new Date() } : {}),
      ...(params.report ? { report: params.report } : {}),
      ...(params.error ? { error: params.error.slice(0, 2000) } : {}),
    });
    await entry.save();
  } catch (error) {
    console.error(`[MigrationLedger] Failed to record "${params.name}":`, error);
  }
}