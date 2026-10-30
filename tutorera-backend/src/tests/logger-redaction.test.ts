import { Writable } from "stream";
import express from "express";
import request from "supertest";
import pino from "pino";
import pinoHttp from "pino-http";
import { loggerRedactionPaths } from "../config/logger";

it("redacts session cookies and private dispatch headers without changing HTTP cookies", async () => {
  let output = "";
  const destination = new Writable({ write(chunk, _encoding, done) { output += chunk.toString(); done(); } });
  const logger = pino({ redact: { paths: loggerRedactionPaths, censor: "[REDACTED]" } }, destination);
  const app = express();
  app.use(pinoHttp({ logger }));
  app.get("/", (_req, res) => { res.cookie("token", "private-fixture-session"); res.json({ success: true }); });
  const response = await request(app).get("/").set("X-Tutorera-Preview-Token", "private-fixture-preview").set("X-Tutorera-Job-Token", "private-fixture-job").expect(200);
  expect(response.headers["set-cookie"][0]).toContain("private-fixture-session");
  expect(output).toContain("[REDACTED]");
  for (const secret of ["private-fixture-session", "private-fixture-preview", "private-fixture-job"]) expect(output).not.toContain(secret);
});
