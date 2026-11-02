// The Hono app itself, with no side effects (no listening, no port binding). src/server.ts runs it.

import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";

import { notFound, onError } from "./http/errors.js";
import { accessLog, bodyLimit, requestContext, requestId, timeout } from "./http/middleware.js";
import { requireOrigin } from "./platform/http/origin.js";
import { origins, type Audience } from "./platform/config/env.js";

import health from "./domains/health/health.routes.js";
import admin from "./domains/admin/admin.routes.js";
import { auditRoutes } from "./modules/audit/index.js";

// The customer site, the staff dashboard and the admin panel are separate origins, and each may only call its own routes.
// Every auth cookie reaches the API from all three (they're the same site), so without this a bug on the customer site
// could read or act through an admin's session. Read at startup, so a misconfigured environment fails to boot.
const audience = (name: Audience) =>
  [cors({ origin: origins[name], credentials: true }), requireOrigin([origins[name]])] as const;

const app = new Hono()
  .use(requestId)
  .use(requestContext)
  .use(accessLog)
  .use(timeout)
  .use(bodyLimit)
  .use("*", secureHeaders())
  .use("/admin/*", ...audience("admin"))
  .onError(onError)
  .notFound(notFound)
  .route("/health", health)
  .route("/admin", admin)
  .route("/", auditRoutes);

export type AppType = typeof app;
export default app;
