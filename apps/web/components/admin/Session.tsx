"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { IconCloudOff } from "@tabler/icons-react";
import { api } from "@/lib/api";
import Button from "@/components/ui/Button";

type SessionBody = Awaited<ReturnType<Awaited<ReturnType<typeof api.admin.auth.session.$get>>["json"]>>;

// Whatever the backend's session route returns, so this stays in sync with it.
export type Admin = Extract<SessionBody, { success: true }>["data"]["admin"];

type SessionValue = {
    admin: Admin;
    signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionValue | null>(null);

type State = { status: "loading" } | { status: "ready"; admin: Admin } | { status: "unreachable" };

export function Session({ children }: { children: ReactNode }) {
    const router = useRouter();
    const [state, setState] = useState<State>({ status: "loading" });

    // Resolves to the next state, or null once a redirect to sign in has started.
    const check = useCallback(async (): Promise<State | null> => {
        try {
            const res = await api.admin.auth.session.$get();
            const body = await res.json();

            if (!body.success) {
                router.replace("/sign-in");
                return null;
            }

            return { status: "ready", admin: body.data.admin };
        } catch {
            // A network blip isn't the same as being signed out, so offer a retry instead of sending them away.
            return { status: "unreachable" };
        }
    }, [router]);

    const apply = useCallback((next: State | null) => {
        if (next) setState(next);
    }, []);

    useEffect(() => {
        check().then(apply);
    }, [check, apply]);

    const retry = () => {
        setState({ status: "loading" });
        check().then(apply);
    };

    const signOut = useCallback(async () => {
        // Leave even if the request failed, since signing out is what they asked for.
        await api.admin.auth["sign-out"].$post().catch(() => null);
        router.replace("/sign-in");
    }, [router]);

    if (state.status === "loading") return null;

    if (state.status === "unreachable") {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
                <IconCloudOff className="size-10 text-neutral-400" stroke={1.5} aria-hidden />
                <div className="flex flex-col gap-1">
                    <h1 className="text-lg font-semibold text-neutral-900">Couldn&apos;t reach the server</h1>
                    <p className="text-sm text-neutral-500">Check your connection and try again.</p>
                </div>
                <Button variant="secondary" onClick={retry}>Retry</Button>
            </div>
        );
    }

    return <SessionContext.Provider value={{ admin: state.admin, signOut }}>{children}</SessionContext.Provider>;
}

export function useSession() {
    const context = useContext(SessionContext);
    if (!context) throw new Error("useSession must be used inside Session.");

    return context;
}
