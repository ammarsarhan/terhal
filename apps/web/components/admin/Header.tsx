import type { ReactNode } from "react";

// The title and one-line description at the top of every admin page, with the page's own controls (e.g. search) on the right.
export default function Header({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
    return (
        <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-1">
                <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">{title}</h1>
                <p className="text-sm text-neutral-500">{description}</p>
            </div>
            {children && <div className="flex w-full items-center gap-2 sm:w-auto">{children}</div>}
        </div>
    );
}
