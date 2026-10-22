import type { Metadata } from "next";
import Header from "@/components/admin/Header";

export const metadata: Metadata = {
    title: "Customers",
};

// Served at admin.terhal.co/customers. Blank until the customers tools are built.
export default function AdminCustomers() {
    return <Header title="Customers" description="Search for customers by name, email or phone, and see the trips they've taken." />;
}
