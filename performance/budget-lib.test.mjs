import assert from "node:assert/strict";
import test from "node:test";

import {
  BudgetConfigError,
  evaluateBudget,
  formatViolation,
  resolveBudget,
  selectRoutes,
  summarize,
  validateConfig,
} from "./budget-lib.mjs";

const defaults = {
  lcpMs: 2500,
  cls: 0.1,
  ttfbMs: 800,
  fcpMs: 1800,
  maxJavascriptKB: 350,
  maxCssKB: 100,
  maxTotalKB: 450,
};

const config = {
  defaults,
  routes: [
    { path: "/", label: "Landing page" },
    { path: "/campaigns", label: "Campaigns", lcpMs: 3000, maxTotalKB: 500 },
  ],
};

const goodMetrics = {
  lcpMs: 1000,
  cls: 0.01,
  ttfbMs: 100,
  fcpMs: 700,
  javascriptKB: 200,
  cssKB: 40,
  totalKB: 300,
};

test("validateConfig accepts a well-formed config", () => {
  assert.equal(validateConfig(config), config);
});

test("validateConfig rejects non-objects", () => {
  assert.throws(() => validateConfig(null), BudgetConfigError);
  assert.throws(() => validateConfig([]), BudgetConfigError);
});

test("validateConfig requires defaults with every metric", () => {
  assert.throws(() => validateConfig({ routes: config.routes }), BudgetConfigError);
  assert.throws(
    () => validateConfig({ defaults: { ...defaults, lcpMs: 0 }, routes: [] }),
    BudgetConfigError,
  );
  assert.throws(
    () => validateConfig({ defaults: { ...defaults, cls: "fast" }, routes: [] }),
    BudgetConfigError,
  );
});

test("validateConfig requires at least one route", () => {
  assert.throws(
    () => validateConfig({ defaults, routes: [] }),
    BudgetConfigError,
  );
});

test("validateConfig rejects invalid, duplicate, and malformed routes", () => {
  assert.throws(
    () => validateConfig({ defaults, routes: [{ path: "campaigns" }] }),
    /starting with/,
  );
  assert.throws(
    () => validateConfig({ defaults, routes: [{ path: "/" }, { path: "/" }] }),
    /Duplicate/,
  );
  assert.throws(
    () => validateConfig({ defaults, routes: [{ path: "/", lcpMs: -1 }] }),
    /positive number/,
  );
});

test("resolveBudget merges route overrides over defaults", () => {
  const budget = resolveBudget(defaults, config.routes[1]);
  assert.equal(budget.path, "/campaigns");
  assert.equal(budget.label, "Campaigns");
  assert.equal(budget.lcpMs, 3000);
  assert.equal(budget.maxTotalKB, 500);
  assert.equal(budget.cls, defaults.cls);
});

test("resolveBudget falls back to the path as the label", () => {
  assert.equal(resolveBudget(defaults, { path: "/x" }).label, "/x");
});

test("evaluateBudget passes when every metric is within budget", () => {
  const result = evaluateBudget(resolveBudget(defaults, { path: "/" }), goodMetrics);
  assert.equal(result.passed, true);
  assert.deepEqual(result.violations, []);
});

test("evaluateBudget reports each exceeded metric", () => {
  const result = evaluateBudget(resolveBudget(defaults, { path: "/" }), {
    ...goodMetrics,
    lcpMs: 4000,
    totalKB: 900,
  });
  assert.equal(result.passed, false);
  assert.deepEqual(
    result.violations.map((v) => v.metric),
    ["lcpMs", "maxTotalKB"],
  );
});

test("evaluateBudget ignores non-finite or missing metrics", () => {
  const result = evaluateBudget(resolveBudget(defaults, { path: "/" }), {
    ...goodMetrics,
    lcpMs: Number.NaN,
    cls: undefined,
  });
  assert.equal(result.passed, true);
});

test("selectRoutes returns all routes without selectors", () => {
  assert.equal(selectRoutes(config).length, 2);
});

test("selectRoutes filters by path or label, case-insensitively", () => {
  assert.deepEqual(
    selectRoutes(config, ["/campaigns"]).map((r) => r.path),
    ["/campaigns"],
  );
  assert.deepEqual(
    selectRoutes(config, ["landing page"]).map((r) => r.path),
    ["/"],
  );
  assert.deepEqual(selectRoutes(config, ["/missing"]), []);
});

test("formatViolation renders actual and budget values", () => {
  assert.equal(
    formatViolation({ metric: "lcpMs", actual: 3200.4, budget: 2500 }),
    "lcpMs: 3200.4 > 2500.0",
  );
});

test("summarize counts pass and fail results", () => {
  assert.deepEqual(
    summarize([{ passed: true }, { passed: false }, { passed: true }]),
    { total: 3, passed: 2, failed: 1, ok: false },
  );
  assert.deepEqual(summarize([{ passed: true }]), {
    total: 1,
    passed: 1,
    failed: 0,
    ok: true,
  });
});
