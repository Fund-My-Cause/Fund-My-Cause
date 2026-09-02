/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/*.test.ts"],
  globals: {
    "ts-jest": {
      tsconfig: {
        // Relax strict for test files so we can import without full DI
        strict: false,
      },
    },
  },
};
