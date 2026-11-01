/** @type {import('jest').Config} */
// Lightweight config for pure unit tests that don't need MongoDB.
// Run with: npx jest --config jest.unit.config.js
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["<rootDir>/src/tests/supervisor-agent.test.ts"],
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.jest.json" }],
  },
  testTimeout: 15000,
};
