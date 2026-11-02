"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { adminPath } from "./Navigation";

// Tabs that are pages of their own, so each one has its own URL. The current one is underlined. An href may carry a
// query string (e.g. to keep filters when switching tabs); only its path decides which tab is current.
export default function Tabs({ tabs }: { tabs: { href: string; label: string }[] }) {
    const path = adminPath(usePathname());

    return (
        <nav aria-label="Tabs" className="flex gap-6 border-b border-neutral-200">
            {tabs.map((tab) => {
                const active = path === tab.href.split("?")[0];

                return (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                            "-mb-px border-b-2 pb-2.5 text-sm transition-colors",
                            active ? "border-neutral-900 font-medium text-neutral-900" : "border-transparent text-neutral-500 hover:text-neutral-900",
                        )}
                    >
                        {tab.label}
                    </Link>
                );
            })}
        </nav>
    );
}
