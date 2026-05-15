import "./env";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { githubResponse, loginGithub } from "./handlers/auth";
import { pullSettings, pushSettings } from "./handlers/settings";
import { getCurrentUser } from "./handlers/user";
import { logger } from "./logger";
import { authenticated } from "./middleware/authenticated";
import { requireEnv } from "./utils";

const SHUTDOWN_TIMEOUT_MS = 3000;

function createServer() {
  logger.info("Creating server...");

  const hostname = requireEnv("LISTEN_HOST");
  const port = Number.parseInt(requireEnv("LISTEN_PORT"), 10);

  if (Number.isNaN(port)) {
    throw new Error("LISTEN_PORT must be a number");
  }

  const app = new Hono();

  app.use("*", async (c, next) => {
    logger.info(`${c.req.method} ${new URL(c.req.url).pathname}`);
    await next();
  });

  app.use(
    "*",
    cors({
      origin: (origin) => origin || "*",
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }),
  );

  app.get("/api/auth/github", (c) => loginGithub(c.req.raw));
  app.get("/api/auth/github/callback", (c) => githubResponse(c.req.raw));
  app.get("/api/user/v1.0/current", (c) => authenticated(getCurrentUser)(c.req.raw));
  app.get("/api/settings/v1.0", (c) => authenticated(pullSettings)(c.req.raw));
  app.put("/api/settings/v1.0", (c) => authenticated(pushSettings)(c.req.raw));

  app.notFound(() => new Response("Not Found", { status: 404 }));

  app.onError((error) => {
    logger.error("Request error:", error);
    return new Response("Internal Server Error", { status: 500 });
  });

  const server = serve(
    {
      fetch: app.fetch,
      hostname,
      port,
    },
    () => {
      logger.info(`Server created, listening on ${hostname}:${port}`);
    },
  );

  return server;
}

const server = createServer();
let shuttingDown = false;

async function shutdown() {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  logger.info("Shutting down...");
  const forceClose = setTimeout(() => {
    logger.warn("Graceful shutdown timed out; closing active connections");
    if ("closeAllConnections" in server) {
      server.closeAllConnections();
    }
  }, SHUTDOWN_TIMEOUT_MS);
  forceClose.unref();

  let exitCode = 0;
  try {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  } catch (error) {
    logger.error("Failed to shut down cleanly:", error);
    exitCode = 1;
  } finally {
    clearTimeout(forceClose);
  }

  process.exit(exitCode);
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
