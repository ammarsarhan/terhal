import { hc } from "hono/client";
import type { AppType } from "./app.js";

// The only thing the web app imports from the backend: types, never runtime code.
// Hono comes from the workspace catalog, so every package resolves the same copy and the routes type check.
export type { AppType };
export type Client = ReturnType<typeof hc<AppType>>;
export type { ErrorCode } from "./shared/utils/error.js";
export type { AuditAction } from "./domains/audit/audit.service.js";
