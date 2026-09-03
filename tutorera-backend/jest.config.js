// jest.config.js
/** @type {import('jest').Config} */
module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    testMatch: ["<rootDir>/src/tests/**/*.test.ts"],
    setupFilesAfterEnv: ["<rootDir>/src/tests/setup.ts"],
    transform: {
        "^.+\\.tsx?$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.jest.json" }],
    },
    // Booking-acceptance tests use real MongoDB transactions (session.withTransaction),
    // which take longer against the in-memory replica set than a plain query would.
    testTimeout: 120000,
};
