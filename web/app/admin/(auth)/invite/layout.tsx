import type { Metadata } from "next";

// Here for the metadata, since the page is a client component and can't export it itself.
// The link carries its token in the URL, so no-referrer keeps the browser from passing that URL on to any other site.
export const metadata: Metadata = {
    title: "Set up your admin account",
    referrer: "no-referrer",
};

export default function AdminInviteLayout({ children }: LayoutProps<"/admin/invite">) {
    return children;
}
