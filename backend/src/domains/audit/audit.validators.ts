import z from "zod";
import { auditActions, type AuditAction } from "./audit.service.js";

const actions = Object.values(auditActions) as [AuditAction, ...AuditAction[]];

// A query parameter sent once arrives as a string and sent several times as an array, so accept both.
const many = <T extends z.ZodType>(schema: T, error: string) => z.union([schema, z.array(schema)], { error }).transform((value) => (Array.isArray(value) ? value : [value]) as z.output<T>[]);

const idSchema = (label: string) => z.string().trim().min(1, `${label} is required.`).max(100, `${label} must contain 100 characters at most.`);

export const listLogsSchema = z
    .object({
        limit: z.coerce.number({ error: "Limit must be a number." }).int("Limit must be a whole number.").min(1, "Limit must be at least 1.").max(100, "Limit must be 100 at most.").default(50),
        // Only columns that are never empty, so paging a sort never skips or repeats a log.
        sort: z.enum(["createdAt", "action", "entityType"], { error: "Sort must be createdAt, action or entityType." }).default("createdAt"),
        order: z.enum(["asc", "desc"], { error: "Order must be asc or desc." }).default("desc"),
        // The id of the last log on the current page. The next page starts right after it.
        cursor: idSchema("Cursor").optional(),
        action: many(z.enum(actions), "Unknown action.").optional(),
        adminId: idSchema("Admin").optional(),
        // Only the events with no admin behind them: the seed, or a failed sign in for an email that isn't an admin.
        system: z.enum(["true", "false"], { error: "System must be true or false." }).transform((value) => value === "true").optional(),
        entityType: idSchema("Entity type").optional(),
        entityId: idSchema("Entity").optional(),
        from: z.iso.datetime({ offset: true, error: "From must be a date and time." }).transform((value) => new Date(value)).optional(),
        to: z.iso.datetime({ offset: true, error: "To must be a date and time." }).transform((value) => new Date(value)).optional(),
        q: z.string().trim().max(100, "Search must contain 100 characters at most.").optional(),
    })
    .refine((query) => !(query.adminId && query.system), { message: "Filter by an admin or by system events, not both.", path: ["system"] })
    .refine((query) => !(query.from && query.to) || query.from <= query.to, { message: "From must be before to.", path: ["from"] });

export type ListLogsQuery = z.infer<typeof listLogsSchema>;
