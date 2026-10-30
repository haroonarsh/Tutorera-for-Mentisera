import { checkHttp } from "./release-checks.mjs";
import { readFileSync } from "node:fs";
try {
  const buildId = readFileSync(new URL("../../tutorera-frontend/.open-next/assets/BUILD_ID", import.meta.url), "utf8").trim();
  if (!buildId) throw new Error("Frontend build identifier is missing.");
  await checkHttp("https://tutorera.ac.pk/BUILD_ID", { expectedText: buildId });
  for (const path of ["/", "/login", "/favicon.ico"]) await checkHttp(`https://tutorera.ac.pk${path}`);
  console.log("Frontend deployed build identifier, homepage, login and favicon smoke checks passed.");
} catch (error) { console.error(error.message); process.exitCode = 1; }
