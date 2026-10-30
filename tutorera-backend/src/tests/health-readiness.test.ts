import express from "express";
import request from "supertest";
import { createHealthRouter } from "../routes/health.routes";

function healthApp(check: () => Promise<boolean>) {
  return express().use("/health", createHealthRouter(check));
}

describe("deployment health endpoints", () => {
  it("keeps liveness independent of database availability", async () => {
    const check = jest.fn().mockResolvedValue(false);
    const result = await request(healthApp(check)).get("/health/live").expect(200);
    expect(result.body).toEqual({ status: "alive" });
    expect(check).not.toHaveBeenCalled();
    expect(result.headers["cache-control"]).toBe("no-store");
  });
  it("reports readiness only when the database is available", async () => {
    await request(healthApp(async () => true)).get("/health/ready").expect(200, { status: "ready" });
    await request(healthApp(async () => false)).get("/health/ready").expect(503, { status: "unavailable" });
  });
  it("makes /health a readiness alias and never exposes database errors", async () => {
    const response = await request(healthApp(async () => { throw new Error("sensitive connection details"); })).get("/health").expect(503);
    expect(response.body).toEqual({ status: "unavailable" });
    expect(response.text).not.toContain("sensitive");
  });
});
