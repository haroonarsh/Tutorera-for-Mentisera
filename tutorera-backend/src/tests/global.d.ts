// src/tests/global.d.ts
// Ensures Jest's global functions (beforeAll, afterEach, describe, it, expect,
// jest.mock, etc.) are recognized by TypeScript in this project, even if the
// main tsconfig.json has an explicit "types" array that doesn't list "jest".
/// <reference types="jest" />