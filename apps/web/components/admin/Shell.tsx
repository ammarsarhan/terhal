"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { IconChevronRight, IconMenu2, IconX } from "@tabler/icons-react";
import Sidebar from "./Sidebar";
import { findNavItem } from "./Navigation";

// The signed in admin layout: the sidebar on the left, and the current page in a framed panel beside it with a breadcrumb
// (group › page) on top. Below lg the sidebar folds into a drawer opened from the breadcrumb bar.
export default function Shell({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const current = findNavItem(pathname);
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className="flex h-dvh bg-neutral-50">
            <aside className="hidden w-64 shrink-0 lg:block">
                <Sidebar />
            </aside>

            <AnimatePresence>
                {menuOpen && (
                    <div className="fixed inset-0 z-40 lg:hidden">
                        <motion.div
                            key="backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            onClick={() => setMenuOpen(false)}
                            className="absolute inset-0 bg-neutral-900/30"
                            aria-hidden
                        />
                        <motion.aside
                            key="drawer"
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-neutral-50 shadow-xl"
                        >
                            <button
                                type="button"
                                onClick={() => setMenuOpen(false)}
                                aria-label="Close menu"
                                className="absolute top-5 right-3 grid rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-200/60 hover:text-neutral-900"
                            >
                                <IconX className="size-5" stroke={1.75} aria-hidden />
                            </button>
                            <Sidebar onNavigate={() => setMenuOpen(false)} />
                        </motion.aside>
                    </div>
                )}
            </AnimatePresence>

            <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white lg:my-2 lg:mr-2 lg:rounded-xl lg:border lg:border-neutral-200">
                <header className="flex h-14 shrink-0 items-center gap-3 border-b border-neutral-200 px-4 sm:px-6">
                    <button
                        type="button"
                        onClick={() => setMenuOpen(true)}
                        aria-label="Open menu"
                        className="-ml-1.5 grid rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 lg:hidden"
                    >
                        <IconMenu2 className="size-5" stroke={1.75} aria-hidden />
                    </button>
                    <nav aria-label="Breadcrumb">
                        {current && (
                            <ol className="flex items-center gap-1.5 text-sm">
                                <li className="text-neutral-500">{current.group.label}</li>
                                <li aria-hidden><IconChevronRight className="size-4 text-neutral-400" stroke={1.75} /></li>
                                <li aria-current="page" className="font-medium text-neutral-900">{current.item.label}</li>
                            </ol>
                        )}
                    </nav>
                </header>

                <main className="flex-1 overflow-y-auto">
                    <div className="flex w-full flex-col px-6 py-8 sm:px-8">{children}</div>
                </main>
            </div>
        </div>
    );
}
