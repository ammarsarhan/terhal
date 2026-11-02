import type { Metadata } from "next";
import Header from "@/components/admin/Header";

export const metadata: Metadata = {
    title: "Staff",
};

// Served at admin.terhal.co/staff. Blank until the staff tools are built.
export default function AdminStaff() {
    return <Header title="Staff" description="Browse staff accounts, invite new ones, and review the access they've been given." />;
}
