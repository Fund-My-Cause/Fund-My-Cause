import "dotenv/config";
import express, { Express } from "express";
import pino from "pino";
import { SorobanRPCClient } from "./rpc-client.js";
import { HealthChecker } from "./health-checker.js";
import { EventStore } from "./event-store.js";
import {
  buildPage,
  resolvePaginationArgs,
  CursorDecodeError,
} from "@fund-my-cause/shared-utils";

// Environment variables
const PORT = parseInt(process.env.PORT ?? "3001", 10);
const RPC_URL = process.env.SOROBAN_RPC_URL ?? "https://soroban-testnet.stellar.org:443";
const CONTRACT_ID = process.env.CROWDFUND_CONTRACT_ID ?? "";
const LOG_LEVEL = process.env.LOG_LEVEL ?? "info";

// Logger
const logger = pino({ level: LOG_LEVEL });

// Express app
const app: Express = express();

// Global state
const rpcClient = new SorobanRPCClient(
  { url: RPC_URL, contractId: CONTRACT_ID },
  logger
);
const healthChecker = new HealthChecker(logger);
const eventStore = new EventStore(logger);

let isRunning = false;

/**
 * Start the indexer service
 */
async function startIndexer(): Promise<void> {
  logger.info({ rpc: RPC_URL, contract: CONTRACT_ID }, "Starting indexer service");

  // Connect to RPC
  const connected = await rpcClient.connect();
  if (!connected) {
    logger.error("Failed to connect to Soroban RPC. Retrying in 10 seconds...");
    setTimeout(startIndexer, 10000);
    return;
  }

  isRunning = true;

  // Stream events
  logger.info("Streaming events from Soroban RPC");
  for await (const events of rpcClient.streamEvents()) {
    try {
      // Store events
      eventStore.addEvents(events);

      // Update health
      for (const event of events) {
        healthChecker.recordEvent(parseInt(event.id.split("-")[0] ?? "0", 10));
      }

      // Log batch
      logger.debug({ eventCount: events.length }, "Ingested events");
    } catch (error) {
      logger.error(
        { error: error instanceof Error ? error.message : String(error) },
        "Error processing events"
      );
    }
  }
}

/**
 * Routes
 */

// Health endpoint
app.get("/health", (req, res) => {
  const status = healthChecker.getStatus();
  const statusCode = status.status === "healthy" ? 200 : status.status === "degraded" ? 202 : 503;
  res.status(statusCode).json(status);
});

// Readiness endpoint
app.get("/ready", (req, res) => {
  if (isRunning) {
    res.status(200).json({ ready: true });
  } else {
    res.status(503).json({ ready: false });
  }
});

// Events query endpoint — supports cursor-based and offset-based pagination
// via the shared pagination utilities.
//
// Query params:
//   contractId  filter by contract ID
//   type        filter by event type
//   limit       max items per page (default 100, max 200)
//   offset      zero-based offset (default 0)
//   after       opaque cursor from a previous response (overrides offset)
app.get("/events", (req, res) => {
  const { contractId, type, limit: rawLimit, offset: rawOffset, after } = req.query;

  let pagination: { limit: number; offset: number };
  try {
    pagination = resolvePaginationArgs({
      limit: rawLimit !== undefined ? parseInt(rawLimit as string, 10) : 100,
      offset: rawOffset !== undefined ? parseInt(rawOffset as string, 10) : 0,
      after: after as string | undefined,
    });
  } catch (err) {
    if (err instanceof CursorDecodeError) {
      res.status(400).json({ error: err.message });
      return;
    }
    throw err;
  }

  const { limit, offset } = pagination;

  // Fetch all matching events, then apply pagination.
  let allEvents: ReturnType<typeof eventStore.getAllEvents>;
  if (contractId) {
    allEvents = eventStore.queryByContract(contractId as string, Infinity as unknown as number);
  } else if (type) {
    allEvents = eventStore.queryByType(type as string, Infinity as unknown as number);
  } else {
    allEvents = eventStore.getAllEvents(Infinity as unknown as number);
  }

  const totalCount = allEvents.length;
  const pageItems = allEvents.slice(offset, offset + limit);
  const page = buildPage(pageItems, offset, limit, totalCount);

  res.json(page);
});

// Stats endpoint
app.get("/stats", (req, res) => {
  const health = healthChecker.getStatus();
  res.json({
    eventCount: eventStore.getCount(),
    health: health.status,
    uptime: health.uptime,
    lastLedger: health.lastLedger,
    eventsProcessed: health.eventsProcessed,
  });
});

/**
 * Start server
 */
app.listen(PORT, async () => {
  logger.info({ port: PORT }, "Indexer service listening");

  // Start indexing in background
  startIndexer().catch((error) => {
    logger.error(
      { error: error instanceof Error ? error.message : String(error) },
      "Indexer crashed"
    );
    process.exit(1);
  });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("Received SIGINT, shutting down gracefully");
  process.exit(0);
});
