import type { Metadata } from "next";
import Header from "@/components/admin/Header";

export const metadata: Metadata = {
    title: "My profile",
};

// Served at admin.terhal.co/profile. Blank until the profile tools are built.
export default function AdminProfile() {
    return <Header title="My profile" description="Update your name and email, change your password, and manage the authenticator app you use to sign in." />;
}
