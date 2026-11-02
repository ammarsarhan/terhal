import { readFileSync } from "node:fs";
import { createServer } from "node:https";
import { serve } from "@hono/node-server";
import { router } from "./http/router";
import { env } from "./platform/config/env";
import { handleShutdown } from "./platform/lifecycle/shutdown";
import { logger } from "./platform/logger/logger";

// Locally the API runs on https://api.local.terhal.co with an mkcert certificate, so its cookies behave exactly as in
// production (same site as the frontends, Secure). On the VPS these are never set: the edge Caddy terminates TLS.
const tls =
  env.TLS_CERT && env.TLS_KEY
    ? { cert: readFileSync(env.TLS_CERT), key: readFileSync(env.TLS_KEY) }
    : null;

// The HTTP entry point, the server container in deploy/compose.yml.
const server = serve(
  {
    fetch: router.fetch,
    port: env.PORT,
    hostname: "::",
    ...(tls ? { createServer, serverOptions: tls } : {}),
  },
  (info) => {
    logger.info({ port: info.port, tls: Boolean(tls) }, "http listening");
  },
);

// Stop accepting connections and wait for in-flight requests. close() also drops idle keep-alive connections, so it
// resolves as soon as the last request finishes. 25 seconds, inside the container's 30-second stop_grace_period.
handleShutdown(
  () =>
    new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    }),
  25_000,
);
