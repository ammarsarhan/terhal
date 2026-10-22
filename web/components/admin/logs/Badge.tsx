import { IconInfoCircle } from "@tabler/icons-react";
import type { AuditAction } from "@terhal/backend/client";
import { cn } from "@/lib/cn";
import { actions } from "./Actions";

const tones = {
    success: "bg-emerald-50 text-emerald-700",
    failure: "bg-red-50 text-red-700",
    neutral: "bg-neutral-100 text-neutral-700",
};

// An action as a small filled pill: green when it went well, red with an info icon when it went wrong, grey otherwise.
export default function Badge({ action }: { action: AuditAction }) {
    const { label, tone } = actions[action];

    return (
        <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[13px] font-medium whitespace-nowrap", tones[tone])}>
            {label}
            {tone === "failure" && <IconInfoCircle className="size-3.5 shrink-0" stroke={1.75} aria-hidden />}
        </span>
    );
}
