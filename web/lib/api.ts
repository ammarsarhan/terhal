import { hc } from "hono/client";
import type { AppType, ErrorCode } from "@terhal/backend/client";

const endpoint = process.env.NEXT_PUBLIC_API_URL ?? "https://api.local.terhal.co:8080";

// The shape the backend's error handler sends back for every failed request.
export type ApiError = {
    success: false;
    error: {
        code?: ErrorCode;
        message: string;
        fields?: { field: string; message: string }[];
    };
};

// Each audience has its own session, cookies and refresh route. Staff join here once their auth is built.
type Audience = "admin";

const refreshPaths: Record<Audience, string> = {
    admin: "/admin/auth/refresh",
};

const audienceOf = (input: RequestInfo | URL): Audience | null => {
    const url = new URL(input instanceof Request ? input.url : input.toString(), endpoint);
    return url.pathname.startsWith("/admin") ? "admin" : null;
};

// Shared between concurrent requests, so a burst of expired requests only triggers one refresh per audience.
const refreshing: Partial<Record<Audience, Promise<boolean>>> = {};

const refresh = (audience: Audience) => {
    refreshing[audience] ??= fetch(`${endpoint}${refreshPaths[audience]}`, { method: "POST", credentials: "include" })
        .then((response) => response.ok)
        .catch(() => false)
        .finally(() => { delete refreshing[audience]; });

    return refreshing[audience];
};

// Tokens live in http-only cookies, so every request includes credentials.
// When the access token has expired, refresh it once and replay the request.
const appFetch: typeof fetch = async (input, init) => {
    const response = await fetch(input, { ...init, credentials: "include" });
    if (response.status !== 401) return response;

    const audience = audienceOf(input);
    if (!audience) return response;

    const body: Partial<ApiError> | null = await response.clone().json().catch(() => null);
    if (body?.error?.code !== "ACCESS_TOKEN_EXPIRED") return response;
    if (!(await refresh(audience))) return response;

    return fetch(input, { ...init, credentials: "include" });
};

// Typed against the backend's routes, e.g. api.admin.auth["sign-in"].$post({ json: { email, password } }).
export const api = hc<AppType>(endpoint, { fetch: appFetch });
