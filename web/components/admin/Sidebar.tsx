"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconLogout } from "@tabler/icons-react";
import { cn } from "@/lib/cn";
import Logo from "@/components/ui/Logo";
import { useSession } from "./Session";
import { groups, isActive } from "./Navigation";

// The admin sidebar: the logo, every page grouped by area, and who's signed in at the bottom. onNavigate lets the mobile
// drawer close itself once a page is picked.
export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
    const pathname = usePathname();
    const { admin, signOut } = useSession();
    const [signingOut, setSigningOut] = useState(false);

    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center gap-2.5 px-5 pt-6 pb-2">
                <Logo />
                <span className="rounded-full bg-neutral-900 px-2.5 py-0.5 text-xs font-medium text-white">Admin</span>
            </div>

            <nav aria-label="Admin" className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-6">
                {groups.map((group) => (
                    <div key={group.label} className="flex flex-col gap-1">
                        <h2 className="px-3 pb-1 text-xs font-medium text-neutral-500">{group.label}</h2>
                        {group.items.map((item) => {
                            const active = isActive(pathname, item.href);

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={onNavigate}
                                    aria-current={active ? "page" : undefined}
                                    className={cn(
                                        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                                        active ? "bg-neutral-200/70 font-medium text-neutral-900" : "text-neutral-700 hover:bg-neutral-200/40 hover:text-neutral-900",
                                    )}
                                >
                                    <item.icon className={cn("size-4.5 shrink-0", active ? "text-neutral-900" : "text-neutral-500")} stroke={1.75} aria-hidden />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </nav>

            <div className="flex items-center gap-3 border-t border-neutral-200 px-5 py-4">
                <div className="flex min-w-0 flex-1 flex-col text-sm">
                    <span className="truncate font-medium text-neutral-900">{admin.firstName} {admin.lastName}</span>
                    <span className="truncate text-xs text-neutral-500">{admin.email}</span>
                </div>
                <button
                    type="button"
                    disabled={signingOut}
                    onClick={() => { setSigningOut(true); signOut(); }}
                    aria-label="Sign out"
                    title="Sign out"
                    className="grid rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-200/60 hover:text-neutral-900 disabled:opacity-50"
                >
                    {signingOut
                        ? <span className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
                        : <IconLogout className="size-5" stroke={1.75} aria-hidden />}
                </button>
            </div>
        </div>
    );
}
