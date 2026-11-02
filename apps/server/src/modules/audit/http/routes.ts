import { createRoute } from "@hono/zod-openapi";
import { AuditLog, ListAuditLogs, page } from "@terhal/contracts";
import { ADMIN_COOKIE_AUTH, requireAdmin } from "../../../platform/http/authenticate.js";
import { createRouter, json, problemResponse } from "../../../platform/http/router.js";
import { createRateLimitKey, rateLimit } from "../../../platform/rate-limit/rate-limit.js";
import { listLogs } from "../application/list-logs.js";

// Any active admin can read the log. Reading it isn't recorded, or the log would fill up with its own reads. Limited per
// admin, generously enough for typing in the search box.
const list = createRoute({
  method: "get",
  path: "/admin/logs",
  tags: ["Audit log"],
  summary: "Search the audit log",
  description: "Newest first by default. Pass `nextCursor` back as `cursor` for the next page.",
  middleware: [
    requireAdmin,
    rateLimit({
      limit: 120,
      windowMs: 60 * 1000,
      key: (c) => createRateLimitKey("admin:logs", "user", c.var.admin.adminId),
    }),
  ] as const,
  security: [{ [ADMIN_COOKIE_AUTH]: [] }],
  request: { query: ListAuditLogs },
  responses: {
    200: { description: "One page of logs", ...json(page(AuditLog)) },
    400: problemResponse("VALIDATION_FAILED"),
    401: problemResponse("UNAUTHENTICATED or ACCESS_TOKEN_EXPIRED: refresh, or sign in."),
    403: problemResponse("ACCOUNT_NOT_ACTIVE"),
    429: problemResponse("RATE_LIMITED"),
  },
});

export const auditRoutes = createRouter().openapi(list, async (c) => {
  return c.json(await listLogs(c.req.valid("query")), 200);
});
