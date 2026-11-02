import type { Metadata } from "next";
import { Session } from "@/components/admin/Session";
import Shell from "@/components/admin/Shell";

// Every signed in admin page lives in this group, so each one is guarded by Session without having to remember to.
export const metadata: Metadata = {
    title: {
        default: "Admin",
        template: "%s · Terhal admin",
    },
    // Nothing behind the admin area belongs in search results.
    robots: {
        index: false,
        follow: false,
    },
};

export default function AdminPanelLayout({ children }: LayoutProps<"/admin">) {
    return (
        <Session>
            <Shell>{children}</Shell>
        </Session>
    );
}
