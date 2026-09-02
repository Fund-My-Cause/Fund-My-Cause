/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/*.test.ts"],
  extensionsToTreatAsEsm: [],
  globals: {
    "ts-jest": {
      useESM: false,
      tsconfig: {
        module: "CommonJS",
        strict: false,
      },
    },
  },
  // Exclude vitest-based tests (ingestor.test.ts, etc.) — they import from "vitest"
  testPathIgnorePatterns: [
    "/node_modules/",
    "ingestor.test.ts",
    "event-store.test.ts",
    "rpc-client.test.ts",
    "queryStats.test.ts",
  ],
};
