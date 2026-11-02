import { readFileSync } from "node:fs";
import { createServer } from "node:https";
import { serve } from "@hono/node-server";

import app from "./app.js";
import { env } from "./platform/config/env.js";
import { prisma } from "./shared/utils/prisma.js";
import { cache } from "./shared/utils/redis.js";

// Locally the API runs on https://api.local.terhal.co with an mkcert certificate, so its cookies behave exactly as
// in production (same site as the frontends, Secure). On the VPS these are never set: the edge Caddy terminates TLS.
const tls =
  env.TLS_CERT && env.TLS_KEY
    ? { cert: readFileSync(env.TLS_CERT), key: readFileSync(env.TLS_KEY) }
    : null;

// HTTP entry point, the server container in deploy/compose.yml.
const server = serve(
  {
    fetch: app.fetch,
    port: env.PORT,
    hostname: "::",
    ...(tls ? { createServer, serverOptions: tls } : {}),
  },
  (info) => {
    console.log(`Server is running on port ${info.port} (${tls ? "https" : "http"})`);
  },
);

// Docker sends SIGTERM on redeploy. Stop taking new requests, then close connections.
const shutdown = () => {
  server.close(async () => {
    await Promise.all([cache.quit(), prisma.$disconnect()]);
    process.exit(0);
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
