import { createMiddleware } from "hono/factory";
import { JwtTokenExpired } from "hono/utils/jwt/types";
import { prisma } from "../../shared/utils/prisma.js";
import TokenService from "../token/token.service.js";
import { errorCodes, ForbiddenError, UnauthorizedError } from "../../shared/utils/error.js";
import { AdminStatus } from "../../../generated/prisma/enums.js";
import type { Admin } from "../../../generated/prisma/client.js";

// Makes sure the request comes from a signed in, active admin, and passes them down as c.var.admin.
// Admin tokens use their own secret and audience, so no other token can pass this. The admin is loaded on every request,
// since the token can't reflect a deactivation made after it was issued: a deactivated admin is cut off immediately.
export const authorizeAdmin = () => createMiddleware<{ Variables: { admin: Admin } }>(
    async (c, next) => {
        const token = TokenService.getAccessToken(c, "admin");
        if (!token) throw new UnauthorizedError("You must be signed in to access this resource.", errorCodes.UNAUTHENTICATED);

        // Use a separate code for expired tokens so the client knows to refresh instead of signing out.
        const decoded = await TokenService.verifyAccessToken("admin", token).catch((error) => {
            if (error instanceof JwtTokenExpired) throw new UnauthorizedError("Your session has expired. Please refresh your access token.", errorCodes.ACCESS_TOKEN_EXPIRED);
            throw new UnauthorizedError("You must be signed in to access this resource.", errorCodes.UNAUTHENTICATED);
        });

        const admin = await prisma.admin.findUnique({ where: { id: decoded.sub } });

        if (!admin) throw new UnauthorizedError("You must be signed in to access this resource.", errorCodes.UNAUTHENTICATED);
        if (admin.status !== AdminStatus.ACTIVE) throw new ForbiddenError("This admin account is not active.", errorCodes.ACCOUNT_NOT_ACTIVE);

        c.set("admin", admin);
        await next();
    }
);
