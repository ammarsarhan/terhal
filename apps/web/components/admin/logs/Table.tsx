"use client";

import { createColumnHelper, tableFeatures, useTable } from "@tanstack/react-table";
import { AnimatePresence, motion } from "motion/react";
import { IconArrowDown, IconArrowUp, IconArrowsSort } from "@tabler/icons-react";
import type { InferResponseType } from "hono/client";
import { cn } from "@/lib/cn";
import type { api } from "@/lib/api";
import Badge from "./Badge";
import { sorts, type Order, type Sort } from "./Filters";

export type Log = InferResponseType<typeof api.admin.logs.$get, 200>["data"]["logs"][number];

const features = tableFeatures({});
const helper = createColumnHelper<typeof features, Log>();

// In the admin's own time zone, with seconds, since events often land within the same minute.
const time = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });

const None = () => <span className="text-neutral-400">—</span>;

const columns = helper.columns([
    helper.accessor("createdAt", {
        header: "Time",
        cell: (info) => <span className="whitespace-nowrap tabular-nums">{time.format(new Date(info.getValue()))}</span>,
    }),
    helper.accessor("action", {
        header: "Action",
        cell: (info) => <Badge action={info.getValue()} />,
    }),
    helper.accessor("admin", {
        header: "Actor",
        cell: (info) => {
            const admin = info.getValue();
            if (!admin) return <span className="text-neutral-500">System</span>;

            return <span className="whitespace-nowrap" title={admin.email}>{admin.firstName} {admin.lastName}</span>;
        },
    }),
    helper.accessor("entityType", {
        header: "Entity",
        cell: (info) => info.getValue(),
    }),
    helper.accessor("entityId", {
        header: "Entity ID",
        cell: (info) => <span className="block max-w-56 truncate text-neutral-500" title={info.getValue()}>{info.getValue()}</span>,
    }),
    helper.accessor("ipAddress", {
        header: "IP address",
        cell: (info) => info.getValue() ?? <None />,
    }),
]);

type TableProps = {
    logs: Log[];
    sort: Sort;
    order: Order;
    onSort: (sort: Sort, order: Order) => void;
    // The number of the first row on this page, so numbering carries on across pages.
    start: number;
    loading: boolean;
    // True while the next page or filter is loading over the rows already shown.
    refreshing: boolean;
};

const cellClass = "px-4 first:pl-0 last:pr-0";

const isSort = (id: string): id is Sort => (sorts as readonly string[]).includes(id);

// A sortable column's title, with arrows showing its direction. Each click goes descending, then ascending, then back to
// the default (newest first).
function SortButton({ id, label, sort, order, onSort }: { id: Sort; label: string } & Pick<TableProps, "sort" | "order" | "onSort">) {
    // The default sort (newest first) shows on the Time column, so there's always one arrow saying how rows are ordered.
    const active = sort === id;
    const direction = !active ? "none" : order;
    const Icon = { none: IconArrowsSort, asc: IconArrowUp, desc: IconArrowDown }[direction];

    const next = () => {
        if (!active) return onSort(id, "desc");
        if (order === "desc") return onSort(id, "asc");
        onSort("createdAt", "desc");
    };

    return (
        <button type="button" onClick={next} className={cn("inline-flex items-center gap-1.5 hover:text-neutral-900", active && "text-neutral-900")}>
            {label}
            {/* Both icons share one grid cell, so the old one fades out while the new one fades in on top of it. */}
            <span className="grid">
                <AnimatePresence initial={false}>
                    <motion.span
                        key={direction}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="col-start-1 row-start-1"
                    >
                        <Icon className={cn("size-4", !active && "text-neutral-400")} stroke={1.75} aria-hidden />
                    </motion.span>
                </AnimatePresence>
            </span>
        </button>
    );
}

export default function Table({ logs, start, loading, refreshing, sort, order, onSort }: TableProps) {
    const table = useTable({ features, columns, data: logs, getRowId: (log) => log.id });

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[15px]">
                <thead>
                    {table.getHeaderGroups().map((group) => (
                        <tr key={group.id} className="border-b border-neutral-200">
                            <th scope="col" className={cn(cellClass, "w-12 py-3")}><span className="sr-only">Row</span></th>
                            {group.headers.map((header) => {
                                const id = header.column.id;
                                const sortable = isSort(id);

                                return (
                                    <th
                                        key={header.id}
                                        scope="col"
                                        aria-sort={sortable && sort === id ? (order === "asc" ? "ascending" : "descending") : undefined}
                                        className={cn(cellClass, "py-3 text-left font-medium whitespace-nowrap text-neutral-500")}
                                    >
                                        {header.isPlaceholder ? null : sortable
                                            ? <SortButton id={id} label={String(header.column.columnDef.header)} sort={sort} order={order} onSort={onSort} />
                                            : <table.FlexRender header={header} />}
                                    </th>
                                );
                            })}
                        </tr>
                    ))}
                </thead>
                <tbody className={cn("text-[13px] text-neutral-900 transition-opacity", refreshing && "opacity-60")}>
                    {loading
                        ? Array.from({ length: 10 }, (_, i) => (
                            <tr key={i} className="border-b border-neutral-200">
                                <td className={cn(cellClass, "py-4")}><span className="block h-4 w-5 animate-pulse rounded bg-neutral-100" /></td>
                                {columns.map((_, j) => (
                                    <td key={j} className={cn(cellClass, "py-4")}><span className="block h-4 w-24 animate-pulse rounded bg-neutral-100" /></td>
                                ))}
                            </tr>
                        ))
                        : table.getRowModel().rows.map((row, i) => (
                            <tr key={row.id} className="border-b border-neutral-200 hover:bg-neutral-50">
                                <td className={cn(cellClass, "py-3.5 text-neutral-500 tabular-nums")}>{start + i}</td>
                                {row.getAllCells().map((cell) => (
                                    <td key={cell.id} className={cn(cellClass, "py-3.5")}>
                                        <table.FlexRender cell={cell} />
                                    </td>
                                ))}
                            </tr>
                        ))}
                </tbody>
            </table>
        </div>
    );
}
