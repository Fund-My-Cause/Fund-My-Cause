#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

const root = resolve(import.meta.dirname, "..");
const roots = ["apps", "packages", "services", "sdks"];
const extensions = [".ts", ".tsx", ".mts", ".cts"];
const importPattern = /^[ \t]*import\s+(?:type\s+)?(?:[\s\S]*?\sfrom\s+)?["']([^"']+)["']/gm;
const allowedEscapeTargets = new Set(["services/shared-env"]);

export function findAliasViolations(source, file, packageRoot, repoRoot = root) {
  const violations = [];
  for (const match of source.matchAll(importPattern)) {
    const specifier = match[1];
    if (!specifier.startsWith(".")) continue;

    const target = resolve(dirname(file), specifier);
    const rel = relative(packageRoot, target);
    if (
      (rel.startsWith(`..${sep}`) || rel === "..") &&
      !allowedEscapeTargets.has(relative(repoRoot, target).replace(/\.ts$/, ""))
    ) {
      const line = source.slice(0, match.index).split("\n").length;
      violations.push({ line, specifier });
    }
  }
  return violations;
}

export function packageRootOf(file, repoRoot = root) {
  let dir = dirname(file);
  while (dir.startsWith(repoRoot) && dir !== repoRoot) {
    try {
      statSync(join(dir, "package.json"));
      return dir;
    } catch {
      dir = dirname(dir);
    }
  }
  return repoRoot;
}

function walk(dir, visit) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "dist" || name === ".next") continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, visit);
    else if (extensions.some((ext) => name.endsWith(ext))) visit(full);
  }
}

function main() {
  const errors = [];
  let filesScanned = 0;

  for (const base of roots) {
    const baseDir = join(root, base);
    try {
      statSync(baseDir);
    } catch {
      continue;
    }
    walk(baseDir, (file) => {
      filesScanned += 1;
      const violations = findAliasViolations(
        readFileSync(file, "utf8"),
        file,
        packageRootOf(file),
      );
      for (const { line, specifier } of violations) {
        errors.push(
          `${relative(root, file)}:${line} relative import "${specifier}" escapes package root; use a shared alias`,
        );
      }
    });
  }

  if (errors.length) {
    console.error(`check-import-aliases: ${errors.length} violation(s) in ${filesScanned} files`);
    for (const error of errors) console.error(`  ${error}`);
    process.exit(1);
  }

  console.log(`check-import-aliases: clean (${filesScanned} files scanned)`);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  main();
}
