/**
 * Pure helpers for the performance-budget regression check (issue #1750).
 *
 * Kept free of Playwright/browser imports so they can be unit-tested with
 * `node --test` and reused by the CLI.
 */

/** Metrics measured for a single page load. All sizes are in kilobytes. */
export const METRIC_KEYS = [
  "lcpMs",
  "cls",
  "ttfbMs",
  "fcpMs",
  "maxJavascriptKB",
  "maxCssKB",
  "maxTotalKB",
];

export class BudgetConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = "BudgetConfigError";
  }
}

/**
 * Merge a route's overrides with the config defaults.
 *
 * @param {Record<string, number>} defaults
 * @param {{ path: string, label?: string } & Record<string, number>} route
 */
export function resolveBudget(defaults, route) {
  const budget = { ...defaults };
  for (const key of METRIC_KEYS) {
    if (typeof route[key] === "number") {
      budget[key] = route[key];
    }
  }
  return {
    path: route.path,
    label: route.label ?? route.path,
    ...budget,
  };
}

/**
 * Validate a parsed budget configuration. Throws `BudgetConfigError` with a
 * human-readable message when the file is malformed.
 */
export function validateConfig(config) {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    throw new BudgetConfigError("Budget config must be a JSON object");
  }
  if (!config.defaults || typeof config.defaults !== "object") {
    throw new BudgetConfigError("Budget config is missing `defaults`");
  }
  for (const key of METRIC_KEYS) {
    const value = config.defaults[key];
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
      throw new BudgetConfigError(
        `defaults.${key} must be a positive number (received ${value})`,
      );
    }
  }
  if (!Array.isArray(config.routes) || config.routes.length === 0) {
    throw new BudgetConfigError("Budget config must define at least one route");
  }
  const seen = new Set();
  for (const route of config.routes) {
    if (!route || typeof route.path !== "string" || !route.path.startsWith("/")) {
      throw new BudgetConfigError(
        `Every route needs a path starting with "/" (received ${JSON.stringify(route)})`,
      );
    }
    if (seen.has(route.path)) {
      throw new BudgetConfigError(`Duplicate budget route: ${route.path}`);
    }
    seen.add(route.path);
    for (const key of METRIC_KEYS) {
      if (route[key] === undefined) continue;
      const value = route[key];
      if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
        throw new BudgetConfigError(
          `${route.path}: ${key} must be a positive number (received ${value})`,
        );
      }
    }
  }
  return config;
}

/**
 * Compare measured metrics against a resolved budget.
 *
 * @returns {{ path: string, label: string, passed: boolean, violations: Array<{ metric: string, actual: number, budget: number }> }}
 */
/** Maps budget keys to the measured metric they constrain. */
const METRIC_SOURCES = {
  lcpMs: "lcpMs",
  cls: "cls",
  ttfbMs: "ttfbMs",
  fcpMs: "fcpMs",
  maxJavascriptKB: "javascriptKB",
  maxCssKB: "cssKB",
  maxTotalKB: "totalKB",
};

export function evaluateBudget(budget, metrics) {
  const violations = [];
  for (const key of METRIC_KEYS) {
    const actual = metrics[METRIC_SOURCES[key]];
    if (typeof actual !== "number" || !Number.isFinite(actual)) continue;
    if (actual > budget[key]) {
      violations.push({ metric: key, actual, budget: budget[key] });
    }
  }
  return {
    path: budget.path,
    label: budget.label,
    passed: violations.length === 0,
    violations,
  };
}

/** Filter routes by an exact path or label (case-insensitive). */
export function selectRoutes(config, selectors = []) {
  if (selectors.length === 0) return config.routes;
  const wanted = new Set(selectors.map((value) => value.toLowerCase()));
  return config.routes.filter(
    (route) =>
      wanted.has(route.path.toLowerCase()) ||
      wanted.has((route.label ?? "").toLowerCase()),
  );
}

/** Format a violation for console output. */
export function formatViolation(violation) {
  return `${violation.metric}: ${violation.actual.toFixed(1)} > ${violation.budget.toFixed(1)}`;
}

/** Aggregate pass/fail counts for a run. */
export function summarize(results) {
  const failed = results.filter((result) => !result.passed);
  return {
    total: results.length,
    passed: results.length - failed.length,
    failed: failed.length,
    ok: failed.length === 0,
  };
}
