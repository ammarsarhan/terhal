import type { Metadata } from "next";
import Header from "@/components/admin/Header";

export const metadata: Metadata = {
    title: "Locations",
};

// Served at admin.terhal.co/locations. Blank until the locations tools are built.
export default function AdminLocations() {
    return <Header title="Locations" description="Manage the cities, stations and pickup points that trips run between." />;
}
