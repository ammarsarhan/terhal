"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { IconHistory, IconSearch } from "@tabler/icons-react";
import { api, type ApiError } from "@/lib/api";
import Button from "@/components/ui/Button";
import Header from "@/components/admin/Header";
import { adminPath } from "@/components/admin/Navigation";
import Filters, { dates, readFilters, writeFilters, type LogFilters } from "./Filters";
import Table from "./Table";

const pageSize = 50;

// The audit log. The filters live in the URL; the table shows one page of logs at a time, newest first.
export default function Logs() {
    const router = useRouter();
    // The browser shows /logs, but the router may report /admin/logs after the proxy's rewrite.
    const pathname = adminPath(usePathname());
    const params = useSearchParams();

    const filters = useMemo(() => readFilters(params), [params]);
    const qs = writeFilters(filters).toString();

    // Replaces rather than pushes, so changing filters doesn't pile up entries in the back button's history.
    const update = useCallback((changes: Partial<LogFilters>) => {
        const next = writeFilters({ ...filters, ...changes }).toString();
        router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    }, [filters, pathname, router]);

    // The search box runs ahead of the URL while typing. When the URL changes underneath it (e.g. a shared link or the
    // back button), the box catches up.
    const [search, setSearch] = useState(filters.q);
    const [syncedQ, setSyncedQ] = useState(filters.q);

    if (filters.q !== syncedQ) {
        setSyncedQ(filters.q);
        if (search.trim() !== filters.q) setSearch(filters.q);
    }

    // Waits for a pause in typing before searching, so each keystroke isn't its own request.
    useEffect(() => {
        const q = search.trim();
        if (q === filters.q) return;

        const timeout = setTimeout(() => update({ q }), 300);
        return () => clearTimeout(timeout);
    }, [search, filters.q, update]);

    // The cursors of every page visited so far; the last one is the current page, so going back just drops it. Tied to
    // the filters they were collected under, so any change to those starts again from the newest logs.
    const view = qs;
    const [paging, setPaging] = useState<{ view: string; cursors: (string | undefined)[] }>({ view, cursors: [undefined] });
    const cursors = paging.view === view ? paging.cursors : [undefined];
    const page = cursors.length;

    const query = useQuery({
        queryKey: ["admin", "logs", filters, cursors[page - 1]],
        // The rows already shown stay up (faded) while the next page or filter loads.
        placeholderData: keepPreviousData,
        queryFn: async () => {
            const { q, actions, actor, date, sort, order } = filters;
            const hours = dates[date].hours;

            const res = await api.admin.logs.$get({
                query: {
                    limit: String(pageSize),
                    sort,
                    order,
                    cursor: cursors[page - 1],
                    q: q || undefined,
                    action: actions.length ? actions : undefined,
                    system: actor === "system" ? "true" : undefined,
                    // Worked out when the request is sent, so "Last 7 days" always runs up to now.
                    from: hours ? new Date(Date.now() - hours * 60 * 60 * 1000).toISOString() : undefined,
                },
            });

            if (!res.ok) {
                // Not every failure is the API's JSON error (e.g. a proxy's plain text 502), so don't assume it is.
                const body = (await res.json().catch(() => null)) as ApiError | null;
                throw new Error(body?.error?.message ?? `The server responded with ${res.status}.`);
            }

            return (await res.json()).data;
        },
    });

    const logs = query.data?.logs ?? [];
    const next = query.data?.cursor ?? null;
    const go = (cursors: (string | undefined)[]) => setPaging({ view, cursors });

    return (
        <div className="flex flex-col gap-6">
            <Header title="Audit logs" description="A permanent, read-only record of every action taken by or on an admin, including who did it and when.">
                <label className="flex h-9 w-full items-center gap-2 sm:w-64 rounded-lg border border-neutral-200 bg-white px-3 text-sm transition-colors focus-within:border-neutral-900 focus-within:ring-2 focus-within:ring-neutral-900/10">
                    <IconSearch className="size-4 shrink-0 text-neutral-400" stroke={1.75} aria-hidden />
                    <input
                        type="search"
                        aria-label="Search logs"
                        placeholder="Search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-transparent text-neutral-900 outline-none placeholder:text-neutral-400"
                    />
                </label>
            </Header>

            <Filters filters={filters} onChange={update} />

            {query.isError ? (
                <div className="flex flex-col items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                    <p role="alert" className="text-sm text-red-700">{query.error.message}</p>
                    <Button variant="secondary" size="sm" onClick={() => query.refetch()}>Try again</Button>
                </div>
            ) : (
                <div className="flex flex-col">
                    <Table logs={logs} start={(page - 1) * pageSize + 1} loading={query.isPending} refreshing={query.isPlaceholderData} sort={filters.sort} order={filters.order} onSort={(sort, order) => update({ sort, order })} />

                    {query.isSuccess && logs.length === 0 && (
                        <div className="flex flex-col items-center gap-2 py-16 text-center">
                            <IconHistory className="size-8 text-neutral-300" stroke={1.5} aria-hidden />
                            <p className="text-sm font-medium text-neutral-900">No logs found</p>
                            <p className="text-sm text-neutral-500">{qs ? "Try a different search or fewer filters." : "Nothing has been recorded here yet."}</p>
                        </div>
                    )}

                    {(page > 1 || next) && (
                        <div className="flex items-center justify-between gap-4 pt-4">
                            <span className="text-sm text-neutral-500">Page {page}</span>
                            <div className="flex items-center gap-2">
                                <Button variant="secondary" size="sm" disabled={page === 1 || query.isPlaceholderData} onClick={() => go(cursors.slice(0, -1))}>Previous</Button>
                                <Button variant="secondary" size="sm" disabled={!next || query.isPlaceholderData} onClick={() => next && go([...cursors, next])}>Next</Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
