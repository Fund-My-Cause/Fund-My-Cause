"""
Database configuration for all Python backend services.

Canonical defaults are kept in sync with
``packages/shared-utils/src/db-config.ts``; the parity test at
``scripts/check-db-config-parity.py`` fails CI if the two files drift.

Environment variables take precedence over the defaults shown below.

Default values (match TypeScript peer exactly):
  host          = "localhost"
  port          = 5432
  database      = "fund_my_cause"
  user          = "postgres"
  password      = ""
  pool_min       = 2
  pool_max       = 10
  connect_timeout_ms = 5000
  idle_timeout_ms    = 30000
  statement_timeout_ms = 30000
  ssl            = False
"""

import os


# ---------------------------------------------------------------------------
# Individual setting accessors
# ---------------------------------------------------------------------------

def get_host() -> str:
    """Database host. Env: DB_HOST."""
    return os.environ.get("DB_HOST", "localhost")


def get_port() -> int:
    """Database port. Env: DB_PORT."""
    return int(os.environ.get("DB_PORT", "5432"))


def get_database() -> str:
    """Database name. Env: DB_NAME."""
    return os.environ.get("DB_NAME", "fund_my_cause")


def get_user() -> str:
    """Database user. Env: DB_USER."""
    return os.environ.get("DB_USER", "postgres")


def get_password() -> str:
    """Database password. Env: DB_PASSWORD."""
    return os.environ.get("DB_PASSWORD", "")


def get_pool_min() -> int:
    """Minimum pool size. Env: DB_POOL_MIN."""
    return int(os.environ.get("DB_POOL_MIN", "2"))


def get_pool_max() -> int:
    """Maximum pool size. Env: DB_POOL_MAX."""
    return int(os.environ.get("DB_POOL_MAX", "10"))


def get_connect_timeout_ms() -> int:
    """Connection timeout in milliseconds. Env: DB_CONNECT_TIMEOUT_MS."""
    return int(os.environ.get("DB_CONNECT_TIMEOUT_MS", "5000"))


def get_idle_timeout_ms() -> int:
    """Idle connection timeout in milliseconds. Env: DB_IDLE_TIMEOUT_MS."""
    return int(os.environ.get("DB_IDLE_TIMEOUT_MS", "30000"))


def get_statement_timeout_ms() -> int:
    """Statement timeout in milliseconds. Env: DB_STATEMENT_TIMEOUT_MS."""
    return int(os.environ.get("DB_STATEMENT_TIMEOUT_MS", "30000"))


def get_ssl() -> bool:
    """Whether to require SSL. Env: DB_SSL (truthy: 'true', '1', 'yes')."""
    raw = os.environ.get("DB_SSL", "false").strip().lower()
    return raw in ("true", "1", "yes")


# ---------------------------------------------------------------------------
# Aggregate config dict — convenient for passing to connection libraries
# ---------------------------------------------------------------------------

def get_db_config() -> dict:
    """
    Return all database settings as a plain dict.

    Example::

        import psycopg2
        cfg = get_db_config()
        conn = psycopg2.connect(
            host=cfg["host"],
            port=cfg["port"],
            dbname=cfg["database"],
            user=cfg["user"],
            password=cfg["password"],
            connect_timeout=cfg["connect_timeout_ms"] // 1000,
        )
    """
    return {
        "host": get_host(),
        "port": get_port(),
        "database": get_database(),
        "user": get_user(),
        "password": get_password(),
        "pool_min": get_pool_min(),
        "pool_max": get_pool_max(),
        "connect_timeout_ms": get_connect_timeout_ms(),
        "idle_timeout_ms": get_idle_timeout_ms(),
        "statement_timeout_ms": get_statement_timeout_ms(),
        "ssl": get_ssl(),
    }


# ---------------------------------------------------------------------------
# Canonical defaults — imported by the parity test
# ---------------------------------------------------------------------------

DEFAULTS: dict = {
    "host": "localhost",
    "port": 5432,
    "database": "fund_my_cause",
    "user": "postgres",
    "password": "",
    "pool_min": 2,
    "pool_max": 10,
    "connect_timeout_ms": 5000,
    "idle_timeout_ms": 30000,
    "statement_timeout_ms": 30000,
    "ssl": False,
}

ENV_VARS: dict = {
    "host": "DB_HOST",
    "port": "DB_PORT",
    "database": "DB_NAME",
    "user": "DB_USER",
    "password": "DB_PASSWORD",
    "pool_min": "DB_POOL_MIN",
    "pool_max": "DB_POOL_MAX",
    "connect_timeout_ms": "DB_CONNECT_TIMEOUT_MS",
    "idle_timeout_ms": "DB_IDLE_TIMEOUT_MS",
    "statement_timeout_ms": "DB_STATEMENT_TIMEOUT_MS",
    "ssl": "DB_SSL",
}
