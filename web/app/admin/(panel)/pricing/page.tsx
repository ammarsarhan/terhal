import type { Metadata } from "next";
import Header from "@/components/admin/Header";

export const metadata: Metadata = {
    title: "Pricing",
};

// Served at admin.terhal.co/pricing. Blank until the pricing tools are built.
export default function AdminPricing() {
    return <Header title="Pricing" description="Set how trips are priced, from base fares to the rules that adjust them." />;
}
