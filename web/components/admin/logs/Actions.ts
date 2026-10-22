import type { AuditAction } from "@terhal/backend/client";

// The groups the action filter lists, in order.
export const groups = ["Sign in", "Sessions", "Invitations", "Two-factor"] as const;

type Group = (typeof groups)[number];

// Whether an event went well, went wrong, or is just a record. Colors the action's pill in the table.
export type Tone = "success" | "failure" | "neutral";

// Keyed by every action the backend can record, so a new one fails typecheck until it's given a label, group and tone here.
export const actions: Record<AuditAction, { label: string; group: Group; tone: Tone }> = {
    "admin.sign_in.succeeded": { label: "Signed in", group: "Sign in", tone: "success" },
    "admin.sign_in.password_passed": { label: "Password accepted", group: "Sign in", tone: "neutral" },
    "admin.sign_in.password_failed": { label: "Wrong password", group: "Sign in", tone: "failure" },
    "admin.sign_in.totp_failed": { label: "Wrong two-factor code", group: "Sign in", tone: "failure" },
    "admin.sign_in.blocked": { label: "Sign in blocked", group: "Sign in", tone: "failure" },
    "admin.sign_out": { label: "Signed out", group: "Sessions", tone: "neutral" },
    "admin.session.revoked": { label: "Session revoked", group: "Sessions", tone: "neutral" },
    "admin.invitation.sent": { label: "Invitation sent", group: "Invitations", tone: "neutral" },
    "admin.invitation.revoked": { label: "Invitation revoked", group: "Invitations", tone: "neutral" },
    "admin.invitation.totp_issued": { label: "Invitation authenticator issued", group: "Invitations", tone: "neutral" },
    "admin.invitation.accepted": { label: "Invitation accepted", group: "Invitations", tone: "success" },
    "admin.invitation.accept_failed": { label: "Invitation acceptance failed", group: "Invitations", tone: "failure" },
    "admin.totp.enabled": { label: "Two-factor enabled", group: "Two-factor", tone: "success" },
};

export const actionKeys = Object.keys(actions) as AuditAction[];
