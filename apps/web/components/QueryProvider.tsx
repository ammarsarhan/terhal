"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// One query cache per browser tab. Created in state, so it survives re-renders but is never shared between users on the server.
export default function QueryProvider({ children }: { children: ReactNode }) {
    const [client] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                // Coming back to a page within 30 seconds shows what was loaded instead of fetching it again.
                staleTime: 30 * 1000,
                retry: 1,
            },
        },
    }));

    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
