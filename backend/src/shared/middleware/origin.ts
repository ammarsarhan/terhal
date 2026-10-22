import { createMiddleware } from "hono/factory";
import { errorCodes, ForbiddenError } from "../utils/error.js";

const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// The auth cookies are SameSite=Lax, which still sends them on requests from any terhal.co subdomain. This rejects
// unsafe requests a browser sent from any page other than the allowed ones, so no other page can act with someone's session.
export const requireOrigin = (allowed: string[]) => createMiddleware(async (c, next) => {
    const origin = c.req.header("origin");

    // Browsers always send Origin on these methods and pages can't change it. Requests without one aren't from a browser,
    // so they don't carry anyone else's cookies and are let through.
    if (unsafeMethods.has(c.req.method) && origin !== undefined && !allowed.includes(origin)) {
        throw new ForbiddenError("Requests from this origin are not allowed.", errorCodes.UNTRUSTED_ORIGIN);
    }

    await next();
});
