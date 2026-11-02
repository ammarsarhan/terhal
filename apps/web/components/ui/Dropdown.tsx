"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/cn";

type DropdownProps = {
    // What sits inside the trigger button.
    trigger: ReactNode;
    triggerClassName?: string;
    // The panel's contents. Receives close, for options that should shut the panel once picked.
    children: (close: () => void) => ReactNode;
    align?: "start" | "end";
    panelClassName?: string;
};

// The gap kept between an open panel and the edge of the screen.
const gutter = 16;

// A button that opens a floating panel below it. Clicking outside or pressing Escape closes it. The panel is never wider
// than the screen and slides sideways to stay on it, so a button near the edge still opens a usable panel.
export default function Dropdown({ trigger, triggerClassName, children, align = "start", panelClassName }: DropdownProps) {
    const [open, setOpen] = useState(false);
    const root = useRef<HTMLDivElement>(null);
    const panel = useRef<HTMLDivElement>(null);
    const close = () => setOpen(false);

    // Measured before the panel is painted, so it never flashes off screen first. Kept up to date on resize.
    useLayoutEffect(() => {
        const element = panel.current;
        if (!open || !element) return;

        const place = () => {
            element.style.translate = "0";
            const { left, right } = element.getBoundingClientRect();

            const overflowRight = right - (window.innerWidth - gutter);
            const overflowLeft = gutter - left;
            const shift = overflowRight > 0 ? -Math.min(overflowRight, left - gutter) : overflowLeft > 0 ? overflowLeft : 0;

            element.style.translate = `${shift}px 0`;
        };

        place();
        window.addEventListener("resize", place);
        return () => window.removeEventListener("resize", place);
    }, [open]);

    useEffect(() => {
        if (!open) return;

        const onPointerDown = (e: PointerEvent) => {
            if (!root.current?.contains(e.target as Node)) setOpen(false);
        };
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };

        document.addEventListener("pointerdown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("pointerdown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [open]);

    return (
        <div ref={root} className="relative">
            <button type="button" aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen((o) => !o)} className={triggerClassName}>
                {trigger}
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        ref={panel}
                        role="dialog"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className={cn(
                            "absolute top-full z-30 mt-2 max-w-[calc(100vw-2rem)] min-w-56 rounded-lg border border-neutral-200 bg-white p-1.5 shadow-lg shadow-neutral-900/5",
                            align === "end" ? "right-0" : "left-0",
                            panelClassName,
                        )}
                    >
                        {children(close)}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
