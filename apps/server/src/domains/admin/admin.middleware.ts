import { createMiddleware } from "hono/factory";
import { JwtTokenExpired } from "hono/utils/jwt/types";
import { prisma } from "../../platform/db/prisma.js";
import TokenService from "../token/token.service.js";
import { AppError } from "../../platform/errors/app-error.js";
import { AdminStatus } from "../../../generated/prisma/enums.js";
import type { Admin } from "../../../generated/prisma/client.js";

// Makes sure the request comes from a signed in, active admin, and passes them down as c.var.admin.
// Admin tokens use their own secret and audience, so no other token can pass this. The admin is loaded on every request,
// since the token can't reflect a deactivation made after it was issued: a deactivated admin is cut off immediately.
export const authorizeAdmin = () =>
  createMiddleware<{ Variables: { admin: Admin } }>(async (c, next) => {
    const token = TokenService.getAccessToken(c, "admin");
    if (!token)
      throw new AppError({
        code: "UNAUTHENTICATED",
        status: 401,
        detail: "You must be signed in to access this resource.",
      });

    // Use a separate code for expired tokens so the client knows to refresh instead of signing out.
    const decoded = await TokenService.verifyAccessToken("admin", token).catch((error) => {
      if (error instanceof JwtTokenExpired)
        throw new AppError({
          code: "ACCESS_TOKEN_EXPIRED",
          status: 401,
          detail: "Your session has expired. Please refresh your access token.",
        });
      throw new AppError({
        code: "UNAUTHENTICATED",
        status: 401,
        detail: "You must be signed in to access this resource.",
      });
    });

    const admin = await prisma.admin.findUnique({ where: { id: decoded.sub } });

    if (!admin)
      throw new AppError({
        code: "UNAUTHENTICATED",
        status: 401,
        detail: "You must be signed in to access this resource.",
      });
    if (admin.status !== AdminStatus.ACTIVE)
      throw new AppError({
        code: "ACCOUNT_NOT_ACTIVE",
        status: 403,
        detail: "This admin account is not active.",
      });

    c.set("admin", admin);
    await next();
  });
