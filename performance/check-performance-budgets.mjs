#!/usr/bin/env node
/**
 * Local performance regression check for key pages (issue #1750).
 *
 * Measures Web Vitals (LCP, CLS, TTFB, FCP) and asset weight for each route
 * in `performance/performance-budgets.json`, then fails when any measurement
 * exceeds its budget.
 *
 * Usage:
 *   npm run perf:check
 *   node performance/check-performance-budgets.mjs --base-url http://localhost:3000
 *   node performance/check-performance-budgets.mjs --route /campaigns --route /
 *   node performance/check-performance-budgets.mjs --list
 *   node performance/check-performance-budgets.mjs --self-test
 *
 * The target app must already be running (production build recommended).
 * Results are written to `performance/results/performance-report.json`.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  evaluateBudget,
  formatViolation,
  resolveBudget,
  selectRoutes,
  summarize,
  validateConfig,
} from "./budget-lib.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = resolve(HERE, "performance-budgets.json");
const RESULTS_DIR = resolve(HERE, "results");

function parseArgs(argv) {
  const options = {
    baseUrl: process.env.PERF_BASE_URL ?? "http://localhost:3000",
    routes: [],
    json: false,
    list: false,
    selfTest: false,
    headed: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case "--base-url":
        options.baseUrl = argv[++i];
        break;
      case "--route":
        options.routes.push(argv[++i]);
        break;
      case "--json":
        options.json = true;
        break;
      case "--list":
        options.list = true;
        break;
      case "--self-test":
        options.selfTest = true;
        break;
      case "--headed":
        options.headed = true;
        break;
      case "--help":
      case "-h":
        options.help = true;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return options;
}

function printHelp() {
  console.log(`Performance budget check (#1750)

Options:
  --base-url <url>   App origin to test (default http://localhost:3000)
  --route <path>     Only check this route (repeatable)
  --list             Print configured routes and budgets
  --self-test        Validate the budget file without a browser/server
  --json             Print the report as JSON
  --headed           Run Chromium with a visible window
  --help             Show this help
`);
}

/** Runs inside the page to collect Web Vitals and transfer sizes. */
function collectMetrics() {
  return new Promise((resolveMetrics) => {
    const state = { lcpMs: 0, cls: 0 };
    try {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        if (last) state.lcpMs = last.startTime;
      }).observe({ type: "largest-contentful-paint", buffered: true });
    } catch {
      // LCP not supported in this engine.
    }
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) state.cls += entry.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
    } catch {
      // CLS not supported in this engine.
    }

    const finish = () => {
      const nav = performance.getEntriesByType("navigation")[0];
      let javascriptKB = 0;
      let cssKB = 0;
      let totalKB = 0;
      for (const entry of performance.getEntriesByType("resource")) {
        const kb = (entry.transferSize || 0) / 1024;
        totalKB += kb;
        if (entry.initiatorType === "script") javascriptKB += kb;
        if (entry.initiatorType === "link" || entry.initiatorType === "css") {
          cssKB += kb;
        }
      }
      resolveMetrics({
        lcpMs: state.lcpMs,
        cls: state.cls,
        ttfbMs: nav ? nav.responseStart - nav.requestStart : 0,
        fcpMs:
          performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? 0,
        javascriptKB,
        cssKB,
        totalKB,
      });
    };

    // Give late LCP/CLS entries a moment to arrive after load.
    setTimeout(finish, 1000);
  });
}

async function runBrowserChecks(config, routes, options) {
  let chromium;
  try {
    ({ chromium } = await import("@playwright/test"));
  } catch {
    throw new Error(
      "Playwright is required for perf:check (npm install). Use --self-test to validate budgets without a browser.",
    );
  }

  let browser;
  try {
    browser = await chromium.launch({ headless: !options.headed });
  } catch (error) {
    throw new Error(
      `Could not launch Chromium: ${error.message}. Install browsers with \`npx playwright install chromium\` and ensure the app is running.`,
    );
  }

  const results = [];
  try {
    for (const route of routes) {
      const budget = resolveBudget(config.defaults, route);
      const page = await browser.newPage();
      const url = new URL(route.path, options.baseUrl).toString();
      await page.goto(url, { waitUntil: "networkidle", timeout: 45_000 });
      const metrics = await page.evaluate(collectMetrics);
      results.push({
        ...evaluateBudget(budget, metrics),
        url,
        budget,
        metrics,
      });
      await page.close();
    }
  } finally {
    await browser.close();
  }
  return results;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return 0;
  }

  const config = validateConfig(JSON.parse(await readFile(CONFIG_PATH, "utf8")));
  const routes = selectRoutes(config, options.routes);

  if (options.list) {
    for (const route of routes) {
      const budget = resolveBudget(config.defaults, route);
      console.log(
        `${budget.path} (${budget.label}): LCP ${budget.lcpMs}ms, CLS ${budget.cls}, TTFB ${budget.ttfbMs}ms, FCP ${budget.fcpMs}ms, JS ${budget.maxJavascriptKB}KB, CSS ${budget.maxCssKB}KB, total ${budget.maxTotalKB}KB`,
      );
    }
    return 0;
  }

  if (options.selfTest) {
    const fixture = {
      lcpMs: 1200,
      cls: 0.02,
      ttfbMs: 200,
      fcpMs: 900,
      javascriptKB: 100,
      cssKB: 20,
      totalKB: 150,
    };
    const results = routes.map((route) =>
      evaluateBudget(resolveBudget(config.defaults, route), fixture),
    );
    const summary = summarize(results);
    console.log(
      `Budget config valid: ${summary.total} routes, ${summary.failed} violations with fixture metrics.`,
    );
    return summary.ok ? 0 : 1;
  }

  if (routes.length === 0) {
    throw new Error("No routes matched the requested --route filters");
  }

  const results = await runBrowserChecks(config, routes, options);
  const summary = summarize(results);

  await mkdir(RESULTS_DIR, { recursive: true });
  const reportPath = resolve(RESULTS_DIR, "performance-report.json");
  await writeFile(
    reportPath,
    `${JSON.stringify({ baseUrl: options.baseUrl, summary, results }, null, 2)}\n`,
  );

  if (options.json) {
    console.log(JSON.stringify({ summary, results }, null, 2));
  } else {
    for (const result of results) {
      if (result.passed) {
        console.log(`PASS ${result.path} (${result.label})`);
      } else {
        console.log(`FAIL ${result.path} (${result.label})`);
        for (const violation of result.violations) {
          console.log(`  ${formatViolation(violation)}`);
        }
      }
    }
    console.log(
      `\n${summary.passed}/${summary.total} routes within budget. Report: ${reportPath}`,
    );
  }

  return summary.ok ? 0 : 1;
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error(`perf:check failed: ${error.message}`);
    process.exit(2);
  });
