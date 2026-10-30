import { JOB_SCHEDULES } from "../config/scheduledJobs";
import { runScheduledJob, startProcessScheduler } from "../services/schedulerRuntime.service";
import { runWithJobLease } from "../services/scheduledJobLease.service";

jest.mock("../services/scheduledJobLease.service", () => ({ runWithJobLease: jest.fn().mockResolvedValue({ acquired: true }) }));

describe("scheduler deployment modes", () => {
  const originalMode = process.env.SCHEDULER_MODE;
  beforeEach(() => { jest.useFakeTimers(); jest.clearAllMocks(); });
  afterEach(() => {
    jest.useRealTimers();
    if (originalMode === undefined) delete process.env.SCHEDULER_MODE; else process.env.SCHEDULER_MODE = originalMode;
  });
  it.each(["external", "disabled"])("creates no process timers in %s mode", (mode) => {
    process.env.SCHEDULER_MODE = mode;
    startProcessScheduler()();
    expect(jest.getTimerCount()).toBe(0);
  });
  it("retains Render schedules by default and clears every timer on shutdown", async () => {
    delete process.env.SCHEDULER_MODE;
    const stop = startProcessScheduler();
    expect(jest.getTimerCount()).toBe(JOB_SCHEDULES.length * 2);
    await jest.advanceTimersByTimeAsync(5000);
    expect(runWithJobLease).toHaveBeenCalledWith("exchange-rate-refresh", 59 * 60_000, expect.any(Function));
    stop();
    expect(jest.getTimerCount()).toBe(0);
  });
  it("rejects a misspelled mode rather than silently disabling jobs", () => {
    process.env.SCHEDULER_MODE = "externla";
    expect(() => startProcessScheduler()).toThrow("Invalid SCHEDULER_MODE");
  });
  it("preserves lease-based dispatch for every allowlisted task", async () => {
    for (const job of JOB_SCHEDULES) {
      await runScheduledJob(job.name);
      expect(runWithJobLease).toHaveBeenCalledWith(job.name, job.leaseMs, expect.any(Function));
    }
  });
});
