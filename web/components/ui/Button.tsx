import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type ButtonProps = ComponentProps<"button"> & {
    variant?: "primary" | "secondary" | "link";
    // Only applies to primary and secondary: a link is sized by its text.
    size?: "md" | "sm";
    loading?: boolean;
};

const variants = {
    primary: "rounded-full bg-neutral-900 text-sm font-medium text-white hover:bg-neutral-700 disabled:bg-neutral-400",
    secondary: "rounded-full border border-neutral-300 bg-white text-sm font-medium text-neutral-900 hover:bg-neutral-50 disabled:text-neutral-400",
    link: "text-sm font-medium text-neutral-900 underline underline-offset-2 hover:text-neutral-600",
};

const sizes = {
    md: "h-11 px-5",
    sm: "h-9 px-4",
};

export default function Button({ variant = "primary", size = "md", loading = false, disabled, className, children, ...props }: ButtonProps) {
    return (
        <button
            disabled={disabled || loading}
            aria-busy={loading}
            className={cn(
                "inline-flex items-center justify-center gap-2 transition-[color,background-color,transform] active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100",
                variants[variant],
                variant !== "link" && sizes[size],
                className,
            )}
            {...props}
        >
            {loading && <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />}
            {children}
        </button>
    );
}
