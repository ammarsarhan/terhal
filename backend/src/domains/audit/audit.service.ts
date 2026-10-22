import { prisma } from "../../shared/utils/prisma.js";
import type { Prisma } from "../../../generated/prisma/client.js";
import type { ListLogsQuery } from "./audit.validators.js";

// Every recorded event. Kept in one place so the log stays searchable by a fixed set of names.
// The log is append-only: a database trigger rejects any update or delete, so nothing here can rewrite history.
export const auditActions = {
    INVITATION_SENT: "admin.invitation.sent",
    INVITATION_REVOKED: "admin.invitation.revoked",
    INVITATION_TOTP_ISSUED: "admin.invitation.totp_issued",
    INVITATION_ACCEPT_FAILED: "admin.invitation.accept_failed",
    INVITATION_ACCEPTED: "admin.invitation.accepted",
    TOTP_ENABLED: "admin.totp.enabled",
    SIGN_IN_PASSWORD_FAILED: "admin.sign_in.password_failed",
    SIGN_IN_PASSWORD_PASSED: "admin.sign_in.password_passed",
    SIGN_IN_TOTP_FAILED: "admin.sign_in.totp_failed",
    SIGN_IN_BLOCKED: "admin.sign_in.blocked",
    SIGN_IN_SUCCEEDED: "admin.sign_in.succeeded",
    SESSION_REVOKED: "admin.session.revoked",
    SIGN_OUT: "admin.sign_out",
} as const;

export type AuditAction = (typeof auditActions)[keyof typeof auditActions];

type AuditEntry = {
    // The admin who did it, or null for the system (the seed) and for sign in attempts on emails that aren't admins.
    adminId: string | null;
    action: AuditAction;
    // What the event is about, e.g. an Admin, AdminSession, or AdminInvitation, and its id.
    entityType: string;
    entityId: string;
    before?: Prisma.InputJsonValue;
    after?: Prisma.InputJsonValue;
    ipAddress?: string | null;
};

type Client = typeof prisma | Prisma.TransactionClient;

export default class AuditService {
    // Pass the transaction client when the event is part of a change, so the change and its record are saved together
    // or not at all.
    static record = async ({ ipAddress = null, ...entry }: AuditEntry, client: Client = prisma) => {
        await client.auditLog.create({ data: { ...entry, ipAddress } });
    }

    // One page at a time, newest first unless asked otherwise. Ties are broken by time and then id, so the order is stable
    // and the cursor never skips or repeats a log, even while new ones are being written.
    static list = async ({ limit, sort, order, cursor, action, adminId, system, entityType, entityId, from, to, q }: ListLogsQuery) => {
        const where: Prisma.AuditLogWhereInput = {
            action: action ? { in: action } : undefined,
            adminId: system ? null : adminId,
            entityType,
            entityId,
            createdAt: from || to ? { gte: from, lte: to } : undefined,
            // Every word has to match somewhere, so "ammar sign_in" finds Ammar's sign ins.
            AND: q?.split(/\s+/).filter(Boolean).map((word) => ({
                OR: [
                    { action: { contains: word, mode: "insensitive" } },
                    { entityType: { contains: word, mode: "insensitive" } },
                    { entityId: { contains: word, mode: "insensitive" } },
                    { ipAddress: { contains: word, mode: "insensitive" } },
                    { admin: { firstName: { contains: word, mode: "insensitive" } } },
                    { admin: { lastName: { contains: word, mode: "insensitive" } } },
                    { admin: { email: { contains: word, mode: "insensitive" } } },
                ],
            })),
        };

        // One extra row says whether there's another page, without counting the whole table.
        const rows = await prisma.auditLog.findMany({
            where,
            orderBy: [
                ...(sort === "createdAt" ? [] : [{ [sort]: order }]),
                { createdAt: order },
                { id: order },
            ],
            take: limit + 1,
            ...(cursor && { cursor: { id: cursor }, skip: 1 }),
            select: {
                id: true,
                action: true,
                entityType: true,
                entityId: true,
                ipAddress: true,
                before: true,
                after: true,
                createdAt: true,
                admin: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
        });

        const logs = rows.slice(0, limit).map((log) => ({ ...log, action: log.action as AuditAction }));
        return { logs, cursor: rows.length > limit ? logs[logs.length - 1].id : null };
    }
}
