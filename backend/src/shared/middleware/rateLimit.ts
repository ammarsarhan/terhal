import { createHash } from "node:crypto";
import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import { getConnInfo } from "@hono/node-server/conninfo";
import { cache } from "../utils/redis.js";
import { errorCodes, ServiceUnavailableError, TooManyRequestsError } from "../utils/error.js";

// What a limit is counted against.
export type RateLimitSubject = "ip" | "identifier" | "user";

type RateLimitOptions = {
    limit: number;
    windowMs: number;
    key: (c: Context) => string | undefined | Promise<string | undefined>;
};

// Builds every key in the same shape: "<scope>:<subject>:<hash>", e.g. "admin:sign-in:ip:9f86d0…".
export const createRateLimitKey = (scope: string, subject: RateLimitSubject, value: string) => {
    // Values are normalized and hashed, so Redis never holds raw IPs or emails.
    const hashed = createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
    return `${scope}:${subject}:${hashed}`;
}

// Render's edge is Cloudflare, which overwrites CF-Connecting-IP with the caller's address, so a client can't choose its
// own. X-Forwarded-For and X-Real-IP aren't safe here: Render passes on whatever the client sent. Without the header
// (e.g. locally), fall back to the socket's address. On Render that's the proxy, so every caller would share one limit:
// stricter, never looser. Checked on every new environment with a spoofed header (see the README).
export const getClientIp = (c: Context) => {
    const real = c.req.header("cf-connecting-ip")?.trim();
    if (real) return real;

    try {
        return getConnInfo(c).remote.address ?? "unknown";
    } catch {
        return "unknown";
    }
}

// Key builders to pass as rateLimit's key option.
// Counts requests per client IP.
export const ipKey = (scope: string) => (c: Context) => createRateLimitKey(scope, "ip", getClientIp(c));

// Counts requests per value of a JSON body field, e.g. the email being signed into.
// Runs before validation, so it reads the raw body (the validator can still read it afterwards) and skips the limit when the field is missing.
export const bodyKey = (scope: string, subject: RateLimitSubject, field: string) => async (c: Context) => {
    const body = await c.req.json().catch(() => null);
    const value = body?.[field];

    return typeof value === "string" ? createRateLimitKey(scope, subject, value) : undefined;
}

// Fixed window: the first request creates the counter with the window as its expiry, and Redis deletes it when the window
// ends. One script, so concurrent requests can't slip past the limit. A counter that somehow lost its expiry gets it back.
const consumeScript = `
local count = redis.call("INCR", KEYS[1])
local ttl = redis.call("PTTL", KEYS[1])
if ttl < 0 then
    redis.call("PEXPIRE", KEYS[1], ARGV[1])
    ttl = tonumber(ARGV[1])
end
return { count, ttl }
`;

// Counts this request and returns the new count and the milliseconds left in the window.
const consume = async (key: string, windowMs: number) => {
    const [count, ttl] = await cache.eval(consumeScript, 1, `ratelimit:${key}`, windowMs) as [number, number];
    return { count, ttl };
}

const formatWait = (seconds: number) => {
    if (seconds < 60) return `${seconds} ${seconds === 1 ? "second" : "seconds"}`;

    const minutes = Math.ceil(seconds / 60);
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
}

export const rateLimit = ({ limit, windowMs, key }: RateLimitOptions) => createMiddleware(
    async (c, next) => {
        const rateLimitKey = await key(c);

        if (rateLimitKey) {
            // Fails closed: these limits guard sign in, so an unreachable Redis must not mean unlimited attempts.
            const { count, ttl } = await consume(rateLimitKey, windowMs).catch((error) => {
                console.error("Rate limiter unavailable:", error);
                throw new ServiceUnavailableError("This service is temporarily unavailable. Please try again shortly.");
            });

            if (count > limit) {
                const retryAfter = Math.max(1, Math.ceil(ttl / 1000));

                c.header("Retry-After", String(retryAfter));
                throw new TooManyRequestsError(`Too many requests. Please try again in ${formatWait(retryAfter)}.`, errorCodes.RATE_LIMITED);
            }
        }

        await next();
    }
);
