import type { Metadata } from "next";
import Logo from "@/components/ui/Logo";

// Auth pages aren't useful search results. The (auth) group doesn't change the URLs: /sign-in, /invite.
export const metadata: Metadata = {
    robots: {
        index: false,
        follow: false,
    },
};

// The admin auth pages, across the full width of the screen, with the badge making it clear this is the admin side.
export default function AdminAuthLayout({ children }: LayoutProps<"/admin">) {
    return (
        <main className="flex min-h-screen w-full flex-col p-6 sm:p-10">
            <div className="flex items-center gap-2.5">
                <Logo />
                <span className="rounded-full bg-neutral-900 px-2.5 py-0.5 text-xs font-medium text-white">Admin</span>
            </div>
            <div className="flex flex-1 items-center justify-center py-12">
                <div className="w-full max-w-md">{children}</div>
            </div>
        </main>
    );
}
