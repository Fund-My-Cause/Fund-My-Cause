/**
 * Database configuration for all TypeScript/Node services.
 *
 * Canonical defaults are kept in sync with
 * `backend/shared/db_config.py`; the parity test at
 * `scripts/check-db-config-parity.py` fails CI if the two files drift.
 *
 * Environment variables take precedence over the defaults shown below.
 *
 * Default values (match Python peer exactly):
 *   host                 = "localhost"
 *   port                 = 5432
 *   database             = "fund_my_cause"
 *   user                 = "postgres"
 *   password             = ""
 *   poolMin              = 2
 *   poolMax              = 10
 *   connectTimeoutMs     = 5000
 *   idleTimeoutMs        = 30000
 *   statementTimeoutMs   = 30000
 *   ssl                  = false
 */

/** All database settings in one object. */
export interface DbConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  poolMin: number;
  poolMax: number;
  connectTimeoutMs: number;
  idleTimeoutMs: number;
  statementTimeoutMs: number;
  ssl: boolean;
}

/**
 * Canonical defaults shared with the Python layer.
 * These values are read by the parity test — do not change them here without
 * updating `backend/shared/db_config.py` and `backend/shared/db_config.py::DEFAULTS`.
 */
export const DB_DEFAULTS: Readonly<DbConfig> = {
  host: "localhost",
  port: 5432,
  database: "fund_my_cause",
  user: "postgres",
  password: "",
  poolMin: 2,
  poolMax: 10,
  connectTimeoutMs: 5000,
  idleTimeoutMs: 30000,
  statementTimeoutMs: 30000,
  ssl: false,
} as const;

/** Environment variable names that map to each config key. */
export const DB_ENV_VARS: Readonly<Record<keyof DbConfig, string>> = {
  host: "DB_HOST",
  port: "DB_PORT",
  database: "DB_NAME",
  user: "DB_USER",
  password: "DB_PASSWORD",
  poolMin: "DB_POOL_MIN",
  poolMax: "DB_POOL_MAX",
  connectTimeoutMs: "DB_CONNECT_TIMEOUT_MS",
  idleTimeoutMs: "DB_IDLE_TIMEOUT_MS",
  statementTimeoutMs: "DB_STATEMENT_TIMEOUT_MS",
  ssl: "DB_SSL",
} as const;

/** Parse an environment string as an integer, returning `fallback` when absent or unparseable. */
function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Parse an environment string as a boolean (truthy: "true", "1", "yes"). */
function envBool(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  return ["true", "1", "yes"].includes(raw.trim().toLowerCase());
}

/** Parse an environment string, returning `fallback` when absent. */
function envStr(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

/**
 * Build a `DbConfig` from environment variables, falling back to `DB_DEFAULTS`.
 *
 * @example
 * ```ts
 * import { getDbConfig } from "@fund-my-cause/shared-utils";
 * const cfg = getDbConfig();
 * const pool = new Pool({ host: cfg.host, port: cfg.port, ... });
 * ```
 */
export function getDbConfig(): DbConfig {
  return {
    host: envStr(DB_ENV_VARS.host, DB_DEFAULTS.host),
    port: envInt(DB_ENV_VARS.port, DB_DEFAULTS.port),
    database: envStr(DB_ENV_VARS.database, DB_DEFAULTS.database),
    user: envStr(DB_ENV_VARS.user, DB_DEFAULTS.user),
    password: envStr(DB_ENV_VARS.password, DB_DEFAULTS.password),
    poolMin: envInt(DB_ENV_VARS.poolMin, DB_DEFAULTS.poolMin),
    poolMax: envInt(DB_ENV_VARS.poolMax, DB_DEFAULTS.poolMax),
    connectTimeoutMs: envInt(
      DB_ENV_VARS.connectTimeoutMs,
      DB_DEFAULTS.connectTimeoutMs,
    ),
    idleTimeoutMs: envInt(DB_ENV_VARS.idleTimeoutMs, DB_DEFAULTS.idleTimeoutMs),
    statementTimeoutMs: envInt(
      DB_ENV_VARS.statementTimeoutMs,
      DB_DEFAULTS.statementTimeoutMs,
    ),
    ssl: envBool(DB_ENV_VARS.ssl, DB_DEFAULTS.ssl),
  };
}
