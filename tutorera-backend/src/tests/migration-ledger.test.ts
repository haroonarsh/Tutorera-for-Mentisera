import MigrationLedger from "../models/MigrationLedger.model";
import { recordMigrationRun } from "../services/migrationLedger.service";

describe("migration ledger", () => {
  it("records a dry run as planned without claiming it was applied", async () => {
    await recordMigrationRun({
      name: "test-migration",
      status: "planned",
      matched: 12,
      report: { users: 12 },
    });

    const entries = await MigrationLedger.find({ name: "test-migration" }).lean();
    expect(entries).toHaveLength(1);
    expect(entries[0].status).toBe("planned");
    expect(entries[0].matched).toBe(12);
    expect(entries[0].modified).toBe(0);
    expect(entries[0].appliedAt).toBeFalsy();
    expect(entries[0].report).toEqual({ users: 12 });
  });

  it("records an applied run with its modified count and timestamp", async () => {
    await recordMigrationRun({ name: "test-migration", status: "applied", matched: 10, modified: 7, durationMs: 42 });

    const applied = await MigrationLedger.findOne({ name: "test-migration", status: "applied" }).lean();
    expect(applied?.modified).toBe(7);
    expect(applied?.durationMs).toBe(42);
    expect(applied?.appliedAt).toBeTruthy();
  });

  it("keeps history per run instead of overwriting the previous record", async () => {
    await recordMigrationRun({ name: "history-test", status: "planned", matched: 3 });
    await recordMigrationRun({ name: "history-test", status: "planned", matched: 0 });

    const entries = await MigrationLedger.find({ name: "history-test" }).sort({ createdAt: 1 }).lean();
    expect(entries).toHaveLength(2);
    expect(entries[0].matched).toBe(3);
    expect(entries[1].matched).toBe(0);
  });

  it("records a failure so a half-applied migration is visible", async () => {
    await recordMigrationRun({ name: "failing-migration", status: "failed", error: "duplicate key on users.email" });

    const failure = await MigrationLedger.findOne({ name: "failing-migration" }).lean();
    expect(failure?.status).toBe("failed");
    expect(failure?.error).toContain("duplicate key");
  });
});