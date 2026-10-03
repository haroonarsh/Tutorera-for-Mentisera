import fs from "fs";
import path from "path";
import {
  CANONICAL_STATUSES,
  CANONICAL_STATUS_LABELS,
  TUTOR_ACTION_STATUSES,
  TERMINAL_STATUSES,
  MARKETPLACE_ACTIVE_STATUSES,
  HOME_TUITION_PENDING_STATUSES,
} from "../contracts/tracking.contract";

/**
 * Renders the backend status contract as a frontend TypeScript module. The
 * frontend copy is a generated artifact: edit
 * `src/contracts/tracking.contract.ts` and re-run this script.
 *
 *   npm run contracts:generate          # write the frontend file
 *   npm run contracts:generate -- --check  # fail if it is stale (used by tests/CI)
 */

export const FRONTEND_CONTRACT_PATH = path.resolve(
  __dirname,
  "../../../tutorera-frontend/src/contracts/tracking.contract.ts"
);

const list = (values: readonly string[]) =>
  values.map(value => `  "${value}",`).join("\n");

export function renderFrontendContract(): string {
  return `// AUTO-GENERATED — do not edit by hand.
// Source: tutorera-backend/src/contracts/tracking.contract.ts
// Regenerate: npm run contracts:generate --prefix tutorera-backend

export const CANONICAL_STATUSES = [
${list(CANONICAL_STATUSES)}
] as const;

export type CanonicalStatus = (typeof CANONICAL_STATUSES)[number];

export const CANONICAL_STATUS_LABELS: Record<CanonicalStatus, string> = {
${CANONICAL_STATUSES.map(status => `  ${status}: ${JSON.stringify(CANONICAL_STATUS_LABELS[status])},`).join("\n")}
};

export const TUTOR_ACTION_STATUSES = [
${list(TUTOR_ACTION_STATUSES)}
] as const satisfies readonly CanonicalStatus[];

export const TERMINAL_STATUSES = [
${list(TERMINAL_STATUSES)}
] as const satisfies readonly CanonicalStatus[];

export const MARKETPLACE_ACTIVE_STATUSES = [
${list(MARKETPLACE_ACTIVE_STATUSES)}
] as const satisfies readonly CanonicalStatus[];

export const HOME_TUITION_PENDING_STATUSES = [
${list(HOME_TUITION_PENDING_STATUSES)}
] as const satisfies readonly CanonicalStatus[];

export function getCanonicalStatusLabel(status: CanonicalStatus): string {
  return CANONICAL_STATUS_LABELS[status] || status;
}
`;
}

function main() {
  const check = process.argv.includes("--check");
  const expected = renderFrontendContract();
  const current = fs.existsSync(FRONTEND_CONTRACT_PATH) ? fs.readFileSync(FRONTEND_CONTRACT_PATH, "utf8") : null;

  if (check) {
    if (current !== expected) {
      console.error("Frontend tracking contract is stale. Run: npm run contracts:generate");
      process.exitCode = 1;
    }
    return;
  }

  fs.mkdirSync(path.dirname(FRONTEND_CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(FRONTEND_CONTRACT_PATH, expected, "utf8");
  console.log(`Wrote ${FRONTEND_CONTRACT_PATH}`);
}

if (require.main === module) main();