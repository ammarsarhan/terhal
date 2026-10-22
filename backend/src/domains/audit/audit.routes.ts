import { Hono } from "hono";
import { listLogsHandler } from "./audit.handlers.js";

// Mounted at /admin/logs: the audit log, as admins browse it.
const logs = new Hono()
    .get("/", ...listLogsHandler)

export default logs;
