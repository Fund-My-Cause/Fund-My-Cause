import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  DB_DEFAULTS,
  DB_ENV_VARS,
  DbConfig,
  getDbConfig,
} from "../db-config";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Save/restore process.env around each test. */
function withEnv(vars: Partial<Record<string, string>>, fn: () => void) {
  const saved: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(vars)) {
    saved[k] = process.env[k];
    if (v === undefined) {
      delete process.env[k];
    } else {
      process.env[k] = v;
    }
  }
  try {
    fn();
  } finally {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) {
        delete process.env[k];
      } else {
        process.env[k] = v;
      }
    }
  }
}

/** All DB_* env vars cleared. */
function clearDbEnv() {
  for (const v of Object.values(DB_ENV_VARS)) {
    delete process.env[v];
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("DB_DEFAULTS", () => {
  it("contains the expected canonical keys", () => {
    const keys: Array<keyof DbConfig> = [
      "host", "port", "database", "user", "password",
      "poolMin", "poolMax",
      "connectTimeoutMs", "idleTimeoutMs", "statementTimeoutMs",
      "ssl",
    ];
    for (const key of keys) {
      expect(DB_DEFAULTS).toHaveProperty(key);
    }
  });

  it("has matching entry in DB_ENV_VARS for every key", () => {
    const defaultKeys = Object.keys(DB_DEFAULTS) as Array<keyof DbConfig>;
    for (const key of defaultKeys) {
      expect(DB_ENV_VARS).toHaveProperty(key);
    }
  });
});

describe("getDbConfig — defaults (no env vars set)", () => {
  beforeEach(clearDbEnv);
  afterEach(clearDbEnv);

  it("returns host = localhost", () => {
    expect(getDbConfig().host).toBe("localhost");
  });

  it("returns port = 5432", () => {
    expect(getDbConfig().port).toBe(5432);
  });

  it("returns database = fund_my_cause", () => {
    expect(getDbConfig().database).toBe("fund_my_cause");
  });

  it("returns user = postgres", () => {
    expect(getDbConfig().user).toBe("postgres");
  });

  it("returns password = empty string", () => {
    expect(getDbConfig().password).toBe("");
  });

  it("returns poolMin = 2", () => {
    expect(getDbConfig().poolMin).toBe(2);
  });

  it("returns poolMax = 10", () => {
    expect(getDbConfig().poolMax).toBe(10);
  });

  it("returns connectTimeoutMs = 5000", () => {
    expect(getDbConfig().connectTimeoutMs).toBe(5000);
  });

  it("returns idleTimeoutMs = 30000", () => {
    expect(getDbConfig().idleTimeoutMs).toBe(30000);
  });

  it("returns statementTimeoutMs = 30000", () => {
    expect(getDbConfig().statementTimeoutMs).toBe(30000);
  });

  it("returns ssl = false", () => {
    expect(getDbConfig().ssl).toBe(false);
  });

  it("returns all defaults matching DB_DEFAULTS exactly", () => {
    expect(getDbConfig()).toEqual(DB_DEFAULTS);
  });
});

describe("getDbConfig — env var overrides", () => {
  beforeEach(clearDbEnv);
  afterEach(clearDbEnv);

  it("overrides host from DB_HOST", () => {
    withEnv({ DB_HOST: "db.prod.example.com" }, () => {
      expect(getDbConfig().host).toBe("db.prod.example.com");
    });
  });

  it("overrides port from DB_PORT", () => {
    withEnv({ DB_PORT: "5433" }, () => {
      expect(getDbConfig().port).toBe(5433);
    });
  });

  it("overrides database from DB_NAME", () => {
    withEnv({ DB_NAME: "my_db" }, () => {
      expect(getDbConfig().database).toBe("my_db");
    });
  });

  it("overrides user from DB_USER", () => {
    withEnv({ DB_USER: "admin" }, () => {
      expect(getDbConfig().user).toBe("admin");
    });
  });

  it("overrides password from DB_PASSWORD", () => {
    withEnv({ DB_PASSWORD: "s3cr3t" }, () => {
      expect(getDbConfig().password).toBe("s3cr3t");
    });
  });

  it("overrides poolMin from DB_POOL_MIN", () => {
    withEnv({ DB_POOL_MIN: "5" }, () => {
      expect(getDbConfig().poolMin).toBe(5);
    });
  });

  it("overrides poolMax from DB_POOL_MAX", () => {
    withEnv({ DB_POOL_MAX: "20" }, () => {
      expect(getDbConfig().poolMax).toBe(20);
    });
  });

  it("overrides connectTimeoutMs from DB_CONNECT_TIMEOUT_MS", () => {
    withEnv({ DB_CONNECT_TIMEOUT_MS: "10000" }, () => {
      expect(getDbConfig().connectTimeoutMs).toBe(10000);
    });
  });

  it("overrides idleTimeoutMs from DB_IDLE_TIMEOUT_MS", () => {
    withEnv({ DB_IDLE_TIMEOUT_MS: "60000" }, () => {
      expect(getDbConfig().idleTimeoutMs).toBe(60000);
    });
  });

  it("overrides statementTimeoutMs from DB_STATEMENT_TIMEOUT_MS", () => {
    withEnv({ DB_STATEMENT_TIMEOUT_MS: "15000" }, () => {
      expect(getDbConfig().statementTimeoutMs).toBe(15000);
    });
  });

  it.each(["true", "1", "yes", "TRUE", "YES"])(
    "treats DB_SSL=%s as ssl=true",
    (truthy) => {
      withEnv({ DB_SSL: truthy }, () => {
        expect(getDbConfig().ssl).toBe(true);
      });
    },
  );

  it.each(["false", "0", "no", "FALSE"])(
    "treats DB_SSL=%s as ssl=false",
    (falsy) => {
      withEnv({ DB_SSL: falsy }, () => {
        expect(getDbConfig().ssl).toBe(false);
      });
    },
  );

  it("falls back to default port when DB_PORT is not a number", () => {
    withEnv({ DB_PORT: "not-a-number" }, () => {
      expect(getDbConfig().port).toBe(5432);
    });
  });
});

describe("DB_DEFAULTS parity — numeric types", () => {
  it("port is a number", () => {
    expect(typeof DB_DEFAULTS.port).toBe("number");
  });

  it("poolMin is a number", () => {
    expect(typeof DB_DEFAULTS.poolMin).toBe("number");
  });

  it("poolMax is a number", () => {
    expect(typeof DB_DEFAULTS.poolMax).toBe("number");
  });

  it("connectTimeoutMs is a number", () => {
    expect(typeof DB_DEFAULTS.connectTimeoutMs).toBe("number");
  });

  it("idleTimeoutMs is a number", () => {
    expect(typeof DB_DEFAULTS.idleTimeoutMs).toBe("number");
  });

  it("statementTimeoutMs is a number", () => {
    expect(typeof DB_DEFAULTS.statementTimeoutMs).toBe("number");
  });

  it("ssl is a boolean", () => {
    expect(typeof DB_DEFAULTS.ssl).toBe("boolean");
  });
});
