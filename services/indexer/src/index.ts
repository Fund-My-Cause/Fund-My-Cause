import "dotenv/config";
import http from "http";
import express, { Express } from "express";
import pino from "pino";
import { SorobanRPCClient } from "./rpc-client";
import { HealthChecker } from "./health-checker";
import { EventStore } from "./event-store";

// ── Environment variables ─────────────────────────────────────────────────────

const PORT          = parseInt(process.env.PORT          ?? "3001", 10);
const RPC_URL       = process.env.SOROBAN_RPC_URL         ?? "https://soroban-testnet.stellar.org:443";
const CONTRACT_ID   = process.env.CROWDFUND_CONTRACT_ID   ?? "";
const LOG_LEVEL     = process.env.LOG_LEVEL               ?? "info";
/** Maximum milliseconds to wait for in-flight work before forced exit. */
const SHUTDOWN_TIMEOUT_MS = parseInt(process.env.SHUTDOWN_TIMEOUT_MS ?? "10000", 10);

// ── Logger ────────────────────────────────────────────────────────────────────

const logger = pino({ level: LOG_LEVEL });

// ── Application wiring ────────────────────────────────────────────────────────

const app: Express = express();

const rpcClient    = new SorobanRPCClient({ url: RPC_URL, contractId: CONTRACT_ID }, logger);
const healthChecker = new HealthChecker(logger);
const eventStore   = new EventStore(logger);

// ── Shutdown state ────────────────────────────────────────────────────────────

/** Set to true once SIGTERM / SIGINT has been received. */
export let isShuttingDown = false;

/** Counts batches currently being processed (entered but not finished). */
let inFlightBatches = 0;

/**
 * Resolves when all in-flight batches have drained.
 * Produced by gracefulShutdown(); consumed by the test helper.
 */
let drainResolve: (() => void) | null = null;
let drainPromise: Promise<void>       | null = null;

/** Create a fresh drain gate (called once per shutdown). */
function createDrainGate(): Promise<void> {
  drainPromise = new Promise<void>((resolve) => {
    drainResolve = resolve;
  });
  return drainPromise;
}

/** Call after every batch completes to check whether all work has drained. */
function tickDrain(): void {
  if (drainResolve && inFlightBatches === 0) {
    drainResolve();
    drainResolve = null;
  }
}

// ── Indexer loop ──────────────────────────────────────────────────────────────

export let isRunning = false;

/**
 * Start the indexer service.
 * Streams events from Soroban RPC and stores them in the EventStore.
 * Respects the shutdown flag — stops accepting new batches when shutting down.
 */
export async function startIndexer(): Promise<void> {
  logger.info({ rpc: RPC_URL, contract: CONTRACT_ID }, "Starting indexer service");

  const connected = await rpcClient.connect();
  if (!connected) {
    logger.error("Failed to connect to Soroban RPC. Retrying in 10 seconds...");
    setTimeout(startIndexer, 10_000);
    return;
  }

  isRunning = true;

  for await (const events of rpcClient.streamEvents()) {
    // Stop accepting new work once a shutdown signal has arrived.
    if (isShuttingDown) {
      logger.info("Shutdown in progress — discarding incoming event batch");
      break;
    }

    inFlightBatches++;
    try {
      eventStore.addEvents(events);

      for (const event of events) {
        healthChecker.recordEvent(parseInt(event.id.split("-")[0] ?? "0", 10));
      }

      logger.debug({ eventCount: events.length }, "Ingested events");
    } catch (error) {
      logger.error(
        { error: error instanceof Error ? error.message : String(error) },
        "Error processing events",
      );
    } finally {
      inFlightBatches--;
      tickDrain();
    }
  }

  isRunning = false;
}

// ── Routes ────────────────────────────────────────────────────────────────────

app.get("/health", (req, res) => {
  if (isShuttingDown) {
    return res.status(503).json({ status: "shutting_down" });
  }
  const status     = healthChecker.getStatus();
  const statusCode =
    status.status === "healthy" ? 200 : status.status === "degraded" ? 202 : 503;
  res.status(statusCode).json(status);
});

app.get("/ready", (req, res) => {
  if (isShuttingDown || !isRunning) {
    return res.status(503).json({ ready: false });
  }
  res.status(200).json({ ready: true });
});

app.get("/events", (req, res) => {
  const { contractId, type, limit = "100" } = req.query;
  const limitNum = Math.min(parseInt(limit as string, 10) || 100, 1000);

  let events: ReturnType<typeof eventStore.getAllEvents> = [];
  if (contractId) {
    events = eventStore.queryByContract(contractId as string, limitNum);
  } else if (type) {
    events = eventStore.queryByType(type as string, limitNum);
  } else {
    events = eventStore.getAllEvents(limitNum);
  }

  res.json({ count: events.length, events });
});

app.get("/stats", (req, res) => {
  const health = healthChecker.getStatus();
  res.json({
    eventCount:      eventStore.getCount(),
    health:          health.status,
    uptime:          health.uptime,
    lastLedger:      health.lastLedger,
    eventsProcessed: health.eventsProcessed,
  });
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────

/**
 * Perform a graceful shutdown:
 *
 * 1. Mark `isShuttingDown = true` so the indexer loop and health endpoints
 *    know to reject new work.
 * 2. Stop the HTTP server from accepting new connections (existing keep-alive
 *    connections are drained by `server.close()`).
 * 3. Wait up to `SHUTDOWN_TIMEOUT_MS` for in-flight event batches to finish.
 * 4. If the timeout expires before the drain completes, log a warning and
 *    proceed with a forced exit anyway.
 * 5. Exit with code 0 (or the provided code).
 *
 * @param server   - The HTTP server to close.
 * @param exitCode - Exit code to use (default 0).
 */
export async function gracefulShutdown(
  server: http.Server,
  exitCode: number = 0,
): Promise<void> {
  if (isShuttingDown) return; // idempotent

  isShuttingDown = true;
  logger.info("Graceful shutdown initiated — stopping new work");

  // 1. Stop the HTTP server from accepting new connections.
  await new Promise<void>((resolve) => server.close(() => resolve()));
  logger.info("HTTP server closed");

  // 2. Drain in-flight batches (or time out).
  if (inFlightBatches > 0) {
    logger.info({ inFlightBatches }, "Waiting for in-flight batches to drain…");

    const drain = createDrainGate();
    const timeout = new Promise<void>((resolve) =>
      setTimeout(() => {
        logger.warn(
          { inFlightBatches, timeoutMs: SHUTDOWN_TIMEOUT_MS },
          "Drain timeout reached — forcing exit with pending batches",
        );
        resolve();
      }, SHUTDOWN_TIMEOUT_MS),
    );

    await Promise.race([drain, timeout]);
  } else {
    logger.info("No in-flight batches — drain skipped");
  }

  logger.info({ exitCode }, "Shutdown complete — exiting");
  process.exit(exitCode);
}

// ── Process signal handlers ───────────────────────────────────────────────────

let httpServer: http.Server;

export function registerSignalHandlers(server: http.Server): void {
  httpServer = server;

  process.on("SIGTERM", () => {
    logger.info("Received SIGTERM");
    gracefulShutdown(server, 0).catch((err) => {
      logger.error({ err }, "Error during graceful shutdown");
      process.exit(1);
    });
  });

  process.on("SIGINT", () => {
    logger.info("Received SIGINT");
    gracefulShutdown(server, 0).catch((err) => {
      logger.error({ err }, "Error during graceful shutdown");
      process.exit(1);
    });
  });
}

// ── Start server ──────────────────────────────────────────────────────────────

const server = app.listen(PORT, async () => {
  logger.info({ port: PORT }, "Indexer service listening");

  startIndexer().catch((error) => {
    logger.error(
      { error: error instanceof Error ? error.message : String(error) },
      "Indexer crashed",
    );
    process.exit(1);
  });
});

registerSignalHandlers(server);
