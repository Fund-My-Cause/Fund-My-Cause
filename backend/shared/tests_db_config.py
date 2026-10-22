"""
Unit tests for backend/shared/db_config.py

Run with:
    python -m pytest backend/shared/tests_db_config.py -v
"""

import importlib
import os
import sys
import unittest

# Ensure the repo root is on the path so ``backend.shared.db_config`` resolves
# regardless of where pytest is invoked from.
_REPO_ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

import backend.shared.db_config as db_config  # noqa: E402


def _reload():
    """Re-import the module so env-var changes take effect."""
    importlib.reload(db_config)


class TestDefaults(unittest.TestCase):
    """Each getter must return the canonical default when no env var is set."""

    def setUp(self):
        # Remove all DB_* vars before every test case.
        for key in list(os.environ):
            if key.startswith("DB_"):
                del os.environ[key]
        _reload()

    def test_host_default(self):
        self.assertEqual(db_config.get_host(), "localhost")

    def test_port_default(self):
        self.assertEqual(db_config.get_port(), 5432)

    def test_database_default(self):
        self.assertEqual(db_config.get_database(), "fund_my_cause")

    def test_user_default(self):
        self.assertEqual(db_config.get_user(), "postgres")

    def test_password_default(self):
        self.assertEqual(db_config.get_password(), "")

    def test_pool_min_default(self):
        self.assertEqual(db_config.get_pool_min(), 2)

    def test_pool_max_default(self):
        self.assertEqual(db_config.get_pool_max(), 10)

    def test_connect_timeout_ms_default(self):
        self.assertEqual(db_config.get_connect_timeout_ms(), 5000)

    def test_idle_timeout_ms_default(self):
        self.assertEqual(db_config.get_idle_timeout_ms(), 30000)

    def test_statement_timeout_ms_default(self):
        self.assertEqual(db_config.get_statement_timeout_ms(), 30000)

    def test_ssl_default(self):
        self.assertFalse(db_config.get_ssl())

    def test_get_db_config_defaults(self):
        cfg = db_config.get_db_config()
        self.assertEqual(cfg["host"], "localhost")
        self.assertEqual(cfg["port"], 5432)
        self.assertEqual(cfg["database"], "fund_my_cause")
        self.assertEqual(cfg["user"], "postgres")
        self.assertEqual(cfg["password"], "")
        self.assertEqual(cfg["pool_min"], 2)
        self.assertEqual(cfg["pool_max"], 10)
        self.assertEqual(cfg["connect_timeout_ms"], 5000)
        self.assertEqual(cfg["idle_timeout_ms"], 30000)
        self.assertEqual(cfg["statement_timeout_ms"], 30000)
        self.assertFalse(cfg["ssl"])


class TestEnvOverrides(unittest.TestCase):
    """Env vars must override defaults."""

    def setUp(self):
        for key in list(os.environ):
            if key.startswith("DB_"):
                del os.environ[key]

    def tearDown(self):
        for key in list(os.environ):
            if key.startswith("DB_"):
                del os.environ[key]

    def test_host_override(self):
        os.environ["DB_HOST"] = "db.prod.example.com"
        self.assertEqual(db_config.get_host(), "db.prod.example.com")

    def test_port_override(self):
        os.environ["DB_PORT"] = "5433"
        self.assertEqual(db_config.get_port(), 5433)

    def test_database_override(self):
        os.environ["DB_NAME"] = "my_db"
        self.assertEqual(db_config.get_database(), "my_db")

    def test_user_override(self):
        os.environ["DB_USER"] = "admin"
        self.assertEqual(db_config.get_user(), "admin")

    def test_password_override(self):
        os.environ["DB_PASSWORD"] = "secret"
        self.assertEqual(db_config.get_password(), "secret")

    def test_pool_min_override(self):
        os.environ["DB_POOL_MIN"] = "5"
        self.assertEqual(db_config.get_pool_min(), 5)

    def test_pool_max_override(self):
        os.environ["DB_POOL_MAX"] = "20"
        self.assertEqual(db_config.get_pool_max(), 20)

    def test_connect_timeout_ms_override(self):
        os.environ["DB_CONNECT_TIMEOUT_MS"] = "10000"
        self.assertEqual(db_config.get_connect_timeout_ms(), 10000)

    def test_idle_timeout_ms_override(self):
        os.environ["DB_IDLE_TIMEOUT_MS"] = "60000"
        self.assertEqual(db_config.get_idle_timeout_ms(), 60000)

    def test_statement_timeout_ms_override(self):
        os.environ["DB_STATEMENT_TIMEOUT_MS"] = "15000"
        self.assertEqual(db_config.get_statement_timeout_ms(), 15000)

    def test_ssl_truthy_values(self):
        for truthy in ("true", "1", "yes", "TRUE", "YES"):
            os.environ["DB_SSL"] = truthy
            self.assertTrue(db_config.get_ssl(), msg=f"DB_SSL={truthy!r}")

    def test_ssl_falsy_values(self):
        for falsy in ("false", "0", "no", "FALSE"):
            os.environ["DB_SSL"] = falsy
            self.assertFalse(db_config.get_ssl(), msg=f"DB_SSL={falsy!r}")


class TestDefaultsConstant(unittest.TestCase):
    """DEFAULTS dict must mirror all getter defaults exactly — used by the parity script."""

    def test_defaults_dict_matches_getters(self):
        for key in list(os.environ):
            if key.startswith("DB_"):
                del os.environ[key]

        getters = {
            "host": db_config.get_host(),
            "port": db_config.get_port(),
            "database": db_config.get_database(),
            "user": db_config.get_user(),
            "password": db_config.get_password(),
            "pool_min": db_config.get_pool_min(),
            "pool_max": db_config.get_pool_max(),
            "connect_timeout_ms": db_config.get_connect_timeout_ms(),
            "idle_timeout_ms": db_config.get_idle_timeout_ms(),
            "statement_timeout_ms": db_config.get_statement_timeout_ms(),
            "ssl": db_config.get_ssl(),
        }
        self.assertEqual(db_config.DEFAULTS, getters)

    def test_defaults_keys_are_complete(self):
        expected_keys = {
            "host", "port", "database", "user", "password",
            "pool_min", "pool_max",
            "connect_timeout_ms", "idle_timeout_ms", "statement_timeout_ms",
            "ssl",
        }
        self.assertEqual(set(db_config.DEFAULTS.keys()), expected_keys)

    def test_env_vars_keys_match_defaults_keys(self):
        self.assertEqual(set(db_config.ENV_VARS.keys()), set(db_config.DEFAULTS.keys()))


if __name__ == "__main__":
    unittest.main()
