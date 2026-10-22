import { createFactory } from "hono/factory";
import AuditService from "./audit.service.js";
import { listLogsSchema } from "./audit.validators.js";
import { authorizeAdmin } from "../admin/admin.middleware.js";
import validate from "../../shared/middleware/validate.js";
import { createRateLimitKey, rateLimit } from "../../shared/middleware/rateLimit.js";

const factory = createFactory();

// Any active admin can read the log. Reading it isn't recorded, or the log would fill up with its own reads.
// Limited per admin, generously enough for typing in the search box.
export const listLogsHandler = factory.createHandlers(
    authorizeAdmin(),
    rateLimit({ limit: 120, windowMs: 60 * 1000, key: (c) => createRateLimitKey("admin:logs", "user", c.get("admin").id) }),
    validate("query", listLogsSchema),
    async (c) => {
        const { logs, cursor } = await AuditService.list(c.req.valid("query"));
        return c.json({ success: true, data: { logs, cursor } }, 200);
    }
)
