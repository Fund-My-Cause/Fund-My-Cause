import { test } from "node:test";
import assert from "node:assert/strict";
import { findAliasViolations } from "../check-import-aliases.mjs";

const file = "/repo/apps/interface/src/lib/example.ts";
const packageRoot = "/repo/apps/interface";

test("allows relative imports inside the same package", () => {
  const source = `import { a } from "./a";\nimport { b } from "../../types/index";\n`;
  assert.deepEqual(findAliasViolations(source, file, packageRoot), []);
});

test("flags a relative import that escapes the package root", () => {
  const source = `import { fixture } from "../../../../fixtures/campaign";\n`;
  assert.deepEqual(findAliasViolations(source, file, packageRoot), [
    { line: 1, specifier: "../../../../fixtures/campaign" },
  ]);
});

test("allows the documented services/shared-env escape", () => {
  const source = `import { loadEnv } from "../shared-env";\n`;
  assert.deepEqual(
    findAliasViolations(
      source,
      "/repo/services/graphql-api/env.ts",
      "/repo/services/graphql-api",
      "/repo",
    ),
    [],
  );
});

test("ignores aliased and bare specifiers", () => {
  const source = [
    `import type { Campaign } from "@fund-my-cause/types";`,
    `import { fixture } from "@fixtures/campaign";`,
    `import { z } from "zod";`,
  ].join("\n");
  assert.deepEqual(findAliasViolations(source, file, packageRoot), []);
});
