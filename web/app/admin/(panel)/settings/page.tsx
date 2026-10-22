import type { Metadata } from "next";
import Header from "@/components/admin/Header";

export const metadata: Metadata = {
    title: "Settings",
};

// Served at admin.terhal.co/settings. Blank until the settings tools are built.
export default function AdminSettings() {
    return <Header title="Settings" description="Configure settings that apply across Terhal and to the API itself." />;
}
