"use client";

import { useState, type ReactNode } from "react";
import { IconCaretDownFilled, IconCheck, IconSearch, IconX } from "@tabler/icons-react";
import type { AuditAction } from "@terhal/backend/client";
import { cn } from "@/lib/cn";
import Dropdown from "@/components/ui/Dropdown";
import { actions, actionKeys, groups } from "./Actions";

// Who did it: anyone, or only the events with no admin behind them.
export type Actor = "all" | "system";

// Kept as a preset rather than exact times, so it fits in the URL and "Last 7 days" always means up to now.
export const dates = {
    any: { label: "Any time", hours: null },
    "24h": { label: "Last 24 hours", hours: 24 },
    "7d": { label: "Last 7 days", hours: 7 * 24 },
    "30d": { label: "Last 30 days", hours: 30 * 24 },
} as const;

export type DatePreset = keyof typeof dates;

const dateKeys = Object.keys(dates) as DatePreset[];

// The columns the API can sort by: only ones that are never empty, so paging a sort never skips or repeats a log.
export const sorts = ["createdAt", "action", "entityType"] as const;

export type Sort = (typeof sorts)[number];
export type Order = "asc" | "desc";

export type LogFilters = {
    q: string;
    actions: AuditAction[];
    actor: Actor;
    date: DatePreset;
    sort: Sort;
    order: Order;
};

// The filters and sort live in the URL (?q=…&action=…&action=…&actor=system&date=7d&sort=action&order=asc), so a view
// can be shared or bookmarked. Anything unknown in the URL is ignored rather than sent to the API.
export const readFilters = (params: URLSearchParams): LogFilters => {
    const date = params.get("date") as DatePreset | null;
    const sort = params.get("sort") as Sort | null;

    return {
        q: params.get("q")?.trim() ?? "",
        actions: [...new Set(params.getAll("action"))].filter((action): action is AuditAction => action in actions),
        actor: params.get("actor") === "system" ? "system" : "all",
        date: date && dateKeys.includes(date) ? date : "any",
        sort: sort && sorts.includes(sort) ? sort : "createdAt",
        order: params.get("order") === "asc" ? "asc" : "desc",
    };
};

// Leaves defaults out, so an unfiltered view has a clean URL.
export const writeFilters = ({ q, actions, actor, date, sort, order }: LogFilters) => {
    const params = new URLSearchParams();

    if (q) params.set("q", q);
    actions.forEach((action) => params.append("action", action));
    if (actor !== "all") params.set("actor", actor);
    if (date !== "any") params.set("date", date);
    if (sort !== "createdAt") params.set("sort", sort);
    if (order !== "desc") params.set("order", order);

    return params;
};

const triggerClass = "flex h-9 max-w-full items-center rounded-lg border border-neutral-200 bg-white text-sm whitespace-nowrap transition-colors hover:bg-neutral-50";

// A joined "Label | value ▾" button. Always one line: a long value (e.g. one long action name) is cut short with an
// ellipsis instead of wrapping, so every button in the row stays the same height.
function Trigger({ label, value }: { label: string; value: string }) {
    return (
        <>
            <span className="shrink-0 px-3 text-neutral-700">{label}</span>
            <span className="flex h-full min-w-0 items-center gap-2 border-l border-neutral-200 px-3 font-medium text-neutral-900" title={value}>
                <span className="max-w-40 truncate">{value}</span>
                <IconCaretDownFilled className="size-3.5 shrink-0" aria-hidden />
            </span>
        </>
    );
}

function Option({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
    return (
        <button
            type="button"
            role="menuitemcheckbox"
            aria-checked={selected}
            onClick={onClick}
            className="flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-2 text-left text-sm text-neutral-800 hover:bg-neutral-100"
        >
            {children}
            <IconCheck className={cn("size-4 shrink-0 text-neutral-900", !selected && "invisible")} stroke={2} aria-hidden />
        </button>
    );
}

function DateFilter({ date, onChange }: { date: DatePreset; onChange: (date: DatePreset) => void }) {
    return (
        <Dropdown triggerClassName={triggerClass} trigger={<Trigger label="Date" value={dates[date].label} />}>
            {(close) => (
                <div className="flex flex-col">
                    {dateKeys.map((key) => (
                        <Option key={key} selected={date === key} onClick={() => { onChange(key); close(); }}>{dates[key].label}</Option>
                    ))}
                </div>
            )}
        </Dropdown>
    );
}

// The panel's contents, mounted each time the dropdown opens, so the search starts empty.
function ActionList({ selected, onChange }: { selected: AuditAction[]; onChange: (selected: AuditAction[]) => void }) {
    const [search, setSearch] = useState("");
    const term = search.trim().toLowerCase();

    // A search matches an action's label or its group's name, so "invitation" lists the whole group.
    const visible = actionKeys.filter((action) => !term || actions[action].label.toLowerCase().includes(term) || actions[action].group.toLowerCase().includes(term));
    const sections = groups.map((group) => ({ group, items: visible.filter((action) => actions[action].group === group) })).filter(({ items }) => items.length > 0);

    const toggle = (action: AuditAction) => onChange(selected.includes(action) ? selected.filter((a) => a !== action) : [...selected, action]);

    // Selects the group's listed actions, or clears them when they're all selected already.
    const toggleGroup = (items: AuditAction[]) => {
        const all = items.every((action) => selected.includes(action));
        onChange(all ? selected.filter((a) => !items.includes(a)) : [...new Set([...selected, ...items])]);
    };

    return (
        <div className="flex flex-col">
            <label className="mb-1.5 flex h-9 items-center gap-2 rounded-md border border-neutral-200 px-2.5 text-sm focus-within:border-neutral-900">
                <IconSearch className="size-4 shrink-0 text-neutral-400" stroke={1.75} aria-hidden />
                <input
                    type="search"
                    aria-label="Search actions"
                    placeholder="Search actions"
                    autoFocus
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-transparent text-neutral-900 outline-none placeholder:text-neutral-400"
                />
            </label>

            <div className="max-h-80 overflow-y-auto">
                {sections.length === 0 && <p className="px-2.5 py-6 text-center text-sm text-neutral-500">No actions match &ldquo;{search.trim()}&rdquo;.</p>}
                {sections.map(({ group, items }) => {
                    const chosen = items.filter((action) => selected.includes(action)).length;

                    return (
                        <div key={group} role="group" aria-label={group} className="flex flex-col pt-1">
                            <button
                                type="button"
                                onClick={() => toggleGroup(items)}
                                className="flex items-center justify-between gap-3 rounded-md px-2.5 py-1.5 text-left text-xs font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                            >
                                {group}
                                <span>{chosen === items.length ? "Clear" : "Select all"}</span>
                            </button>
                            {items.map((action) => (
                                <Option key={action} selected={selected.includes(action)} onClick={() => toggle(action)}>{actions[action].label}</Option>
                            ))}
                        </div>
                    );
                })}
            </div>

            {selected.length > 0 && (
                <button type="button" onClick={() => onChange([])} className="mt-1.5 border-t border-neutral-200 px-2.5 pt-2 pb-1 text-left text-sm font-medium text-neutral-600 hover:text-neutral-900">
                    Clear selection ({selected.length})
                </button>
            )}
        </div>
    );
}

function ActionFilter({ selected, onChange }: { selected: AuditAction[]; onChange: (selected: AuditAction[]) => void }) {
    const value = selected.length === 0 ? "All" : selected.length === 1 ? actions[selected[0]].label : `${selected.length} selected`;

    return (
        <Dropdown triggerClassName={triggerClass} trigger={<Trigger label="Action" value={value} />} panelClassName="w-80">
            {() => <ActionList selected={selected} onChange={onChange} />}
        </Dropdown>
    );
}

function ActorFilter({ actor, onChange }: { actor: Actor; onChange: (actor: Actor) => void }) {
    return (
        <Dropdown triggerClassName={triggerClass} trigger={<Trigger label="Actor" value={actor === "all" ? "Everyone" : "System"} />}>
            {(close) => (
                <div className="flex flex-col">
                    <Option selected={actor === "all"} onClick={() => { onChange("all"); close(); }}>Everyone</Option>
                    <Option selected={actor === "system"} onClick={() => { onChange("system"); close(); }}>System</Option>
                </div>
            )}
        </Dropdown>
    );
}

export default function Filters({ filters, onChange }: { filters: LogFilters; onChange: (changes: Partial<LogFilters>) => void }) {
    const filtered = filters.actions.length > 0 || filters.actor !== "all" || filters.date !== "any";

    return (
        <div className="flex flex-wrap items-center gap-2">
            <DateFilter date={filters.date} onChange={(date) => onChange({ date })} />
            <ActorFilter actor={filters.actor} onChange={(actor) => onChange({ actor })} />
            <ActionFilter selected={filters.actions} onChange={(actions) => onChange({ actions })} />
            {filtered && (
                <button
                    type="button"
                    onClick={() => onChange({ actions: [], actor: "all", date: "any" })}
                    // At the end of the row when there's room. On a phone the row wraps, so it sits after the filters instead of
                    // alone on a line of its own, pushed to the far edge.
                    className="flex h-9 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-medium whitespace-nowrap text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 sm:ml-auto"
                >
                    <IconX className="size-4" stroke={1.75} aria-hidden />
                    Reset
                </button>
            )}
        </div>
    );
}
