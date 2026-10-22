#!/usr/bin/env python3
"""
DB config parity check — fails with a non-zero exit code if
``backend/shared/db_config.py`` and ``packages/shared-utils/src/db-config.ts``
have drifted from the canonical defaults.

Usage:
    python scripts/check-db-config-parity.py

Run this from the repository root.  It is also executed by
``backend_ci.yml`` and ``shared_packages_ci.yml``.
"""

import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

# ---------------------------------------------------------------------------
# Load Python defaults
# ---------------------------------------------------------------------------

sys.path.insert(0, str(REPO_ROOT))
try:
    from backend.shared.db_config import DEFAULTS as PY_DEFAULTS, ENV_VARS as PY_ENV_VARS
except ImportError as exc:
    print(f"ERROR: Could not import backend.shared.db_config — {exc}", file=sys.stderr)
    sys.exit(1)

# ---------------------------------------------------------------------------
# Parse TypeScript defaults
# ---------------------------------------------------------------------------

TS_FILE = REPO_ROOT / "packages" / "shared-utils" / "src" / "db-config.ts"

if not TS_FILE.exists():
    print(f"ERROR: TypeScript file not found: {TS_FILE}", file=sys.stderr)
    sys.exit(1)

ts_source = TS_FILE.read_text()

# Extract the DB_DEFAULTS object literal from the TypeScript source.
# We look for the block between "DB_DEFAULTS: Readonly<DbConfig> = {" and
# the matching closing "} as const;"
defaults_match = re.search(
    r"DB_DEFAULTS:\s*Readonly<DbConfig>\s*=\s*\{([^}]+)\}\s*as\s*const",
    ts_source,
    re.DOTALL,
)
if not defaults_match:
    print("ERROR: Could not locate DB_DEFAULTS in db-config.ts", file=sys.stderr)
    sys.exit(1)

# Extract the DB_ENV_VARS object literal
env_vars_match = re.search(
    r"DB_ENV_VARS:\s*Readonly<Record<keyof DbConfig,\s*string>>\s*=\s*\{([^}]+)\}\s*as\s*const",
    ts_source,
    re.DOTALL,
)
if not env_vars_match:
    print("ERROR: Could not locate DB_ENV_VARS in db-config.ts", file=sys.stderr)
    sys.exit(1)


def parse_ts_object(block: str) -> dict:
    """
    Parse a simple TypeScript object literal block into a Python dict.
    Handles string, integer, and boolean values only — sufficient for db config.
    """
    result: dict = {}
    # Match lines like:   key: value,   or   key: "value",
    pattern = re.compile(
        r"""^\s*(\w+)\s*:\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\d+|true|false)\s*,?\s*$""",
        re.MULTILINE,
    )
    for m in pattern.finditer(block):
        key, raw = m.group(1), m.group(2)
        if raw in ("true", "false"):
            result[key] = raw == "true"
        elif raw.startswith('"') or raw.startswith("'"):
            result[key] = raw[1:-1]
        else:
            result[key] = int(raw)
    return result


TS_DEFAULTS_CAMEL = parse_ts_object(defaults_match.group(1))
TS_ENV_VARS_CAMEL = parse_ts_object(env_vars_match.group(1))

# ---------------------------------------------------------------------------
# Key name mapping: TypeScript camelCase → Python snake_case
# ---------------------------------------------------------------------------

CAMEL_TO_SNAKE: dict[str, str] = {
    "host": "host",
    "port": "port",
    "database": "database",
    "user": "user",
    "password": "password",
    "poolMin": "pool_min",
    "poolMax": "pool_max",
    "connectTimeoutMs": "connect_timeout_ms",
    "idleTimeoutMs": "idle_timeout_ms",
    "statementTimeoutMs": "statement_timeout_ms",
    "ssl": "ssl",
}

# ---------------------------------------------------------------------------
# Compare
# ---------------------------------------------------------------------------

errors: list[str] = []

# 1. Every Python key must have a TypeScript counterpart
for py_key in PY_DEFAULTS:
    ts_key = next((k for k, v in CAMEL_TO_SNAKE.items() if v == py_key), None)
    if ts_key is None:
        errors.append(f"  Python key '{py_key}' has no mapping in CAMEL_TO_SNAKE")
        continue
    if ts_key not in TS_DEFAULTS_CAMEL:
        errors.append(
            f"  Key '{py_key}' / '{ts_key}': present in Python DEFAULTS but "
            f"missing from TypeScript DB_DEFAULTS"
        )

# 2. Every TypeScript key must have a Python counterpart
for ts_key in TS_DEFAULTS_CAMEL:
    py_key = CAMEL_TO_SNAKE.get(ts_key)
    if py_key is None:
        errors.append(f"  TypeScript key '{ts_key}' has no mapping in CAMEL_TO_SNAKE")
        continue
    if py_key not in PY_DEFAULTS:
        errors.append(
            f"  Key '{ts_key}' / '{py_key}': present in TypeScript DB_DEFAULTS but "
            f"missing from Python DEFAULTS"
        )

# 3. Values must match
for ts_key, ts_val in TS_DEFAULTS_CAMEL.items():
    py_key = CAMEL_TO_SNAKE.get(ts_key)
    if py_key is None:
        continue
    py_val = PY_DEFAULTS.get(py_key)
    if py_val != ts_val:
        errors.append(
            f"  DEFAULT mismatch for '{py_key}' / '{ts_key}':\n"
            f"    Python  = {py_val!r}\n"
            f"    TypeScript = {ts_val!r}"
        )

# 4. Env var names must match
for ts_key, ts_env in TS_ENV_VARS_CAMEL.items():
    py_key = CAMEL_TO_SNAKE.get(ts_key)
    if py_key is None:
        continue
    py_env = PY_ENV_VARS.get(py_key)
    if py_env != ts_env:
        errors.append(
            f"  ENV_VAR mismatch for '{py_key}' / '{ts_key}':\n"
            f"    Python  = {py_env!r}\n"
            f"    TypeScript = {ts_env!r}"
        )

# ---------------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------------

if errors:
    print("FAIL: DB config parity check detected drift!\n", file=sys.stderr)
    for err in errors:
        print(err, file=sys.stderr)
    print(
        "\nTo fix: update both backend/shared/db_config.py (DEFAULTS / ENV_VARS) "
        "and packages/shared-utils/src/db-config.ts (DB_DEFAULTS / DB_ENV_VARS) "
        "so they match.",
        file=sys.stderr,
    )
    sys.exit(1)

# Print a summary of what was checked
print("PASS: DB config parity check passed.")
print(f"  Checked {len(PY_DEFAULTS)} keys:")
for py_key, py_val in PY_DEFAULTS.items():
    ts_key = next(k for k, v in CAMEL_TO_SNAKE.items() if v == py_key)
    ts_val = TS_DEFAULTS_CAMEL.get(ts_key, "<missing>")
    ts_env = TS_ENV_VARS_CAMEL.get(ts_key, "<missing>")
    py_env = PY_ENV_VARS.get(py_key, "<missing>")
    print(f"    {py_key:25s} py={py_val!r:15} ts={ts_val!r:15} env={py_env}")

sys.exit(0)
