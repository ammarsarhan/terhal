import { createHash, randomBytes } from "node:crypto";
import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { sign, verify } from "hono/jwt";

// Who a token was issued to. Each audience has its own secret and cookies, so a token from one can never be used as another.
// Staff join as a second audience once their auth is built.
export type Audience = "admin";

// Extra claims carried by each audience's access token.
type AudienceClaims = {
    admin: {};
};

export type AccessTokenPayload<A extends Audience = Audience> = {
    sub: string;
    aud: A;
    iat: number;
    exp: number;
} & AudienceClaims[A];

type CookiesPayload = {
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
};

const config = {
    admin: {
        secretVariable: "ADMIN_SECRET",
        accessCookie: "admin_access",
        refreshCookie: "admin_refresh",
        basePath: "/admin",
        refreshPath: "/admin/auth",
    },
} as const satisfies Record<Audience, Record<string, string>>;

export default class TokenService {
    // The frontends and the API are subdomains of the same site (e.g. admin.terhal.co and api.terhal.co), so Lax cookies
    // reach the API on the frontends' fetches while staying off requests started by other sites. The cookies are host-only
    // on the API, so other subdomains never receive them. Always Secure: local development runs on https too
    // (*.local.terhal.co), so it behaves exactly like production.
    private static readonly baseCookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
    } as const;

    // Read lazily so the app can still boot without it; only token operations fail.
    private static getSecret = (audience: Audience) => {
        const variable = config[audience].secretVariable;
        const secret = process.env[variable];

        if (!secret) throw new Error(`${variable} is not defined. Please define it in the environment variables.`);
        return secret;
    }

    static generateAccessToken = async <A extends Audience>(audience: A, subject: string, claims: AudienceClaims[A]) => {
        const now = Math.floor(Date.now() / 1000);
        const payload = { ...claims, sub: subject, aud: audience, iat: now, exp: now + 15 * 60 };

        return sign(payload, this.getSecret(audience), "HS256");
    }

    // Throws when the token is invalid, expired, or was issued to a different audience.
    static verifyAccessToken = async <A extends Audience>(audience: A, token: string) => {
        return await verify(token, this.getSecret(audience), { alg: "HS256", aud: audience }) as unknown as AccessTokenPayload<A>;
    }

    // Reads the access token from the audience's cookie, undefined when it isn't there.
    static getAccessToken = (c: Context, audience: Audience) => {
        return getCookie(c, config[audience].accessCookie);
    }

    // Reads the refresh token from the audience's cookie, undefined when it isn't there.
    static getRefreshToken = (c: Context, audience: Audience) => {
        return getCookie(c, config[audience].refreshCookie);
    }

    // Refresh tokens are opaque random strings, the session row in the database is what makes them valid.
    static generateRefreshToken = () => {
        return randomBytes(32).toString("base64url");
    }

    // Only the hash is stored, so a leaked database can't be used to hijack sessions.
    static hashRefreshToken = (refreshToken: string) => {
        return createHash("sha256").update(refreshToken).digest("hex");
    }

    static generateTokenPair = async <A extends Audience>(audience: A, subject: string, claims: AudienceClaims[A]) => {
        const accessToken = await this.generateAccessToken(audience, subject, claims);
        const refreshToken = this.generateRefreshToken();

        return {
            accessToken,
            refreshToken,
            refreshTokenHash: this.hashRefreshToken(refreshToken),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        };
    }

    static setAuthenticationCookies = (c: Context, audience: Audience, { accessToken, refreshToken, expiresAt }: CookiesPayload) => {
        const local = config[audience];

        // The cookie outlives the token on purpose. If it expired with the token, the browser would drop it and the next
        // request would arrive with no token at all, which reads as signed out (UNAUTHENTICATED) instead of expired
        // (ACCESS_TOKEN_EXPIRED), so the client would never refresh. The token's own exp claim still limits it to 15 minutes.
        setCookie(c, local.accessCookie, accessToken, {
            ...this.baseCookieOptions,
            path: local.basePath,
            expires: expiresAt,
        });

        // Only sent to the auth routes, which are the only ones that need it.
        setCookie(c, local.refreshCookie, refreshToken, {
            ...this.baseCookieOptions,
            path: local.refreshPath,
            expires: expiresAt,
        });
    }

    // The step between an admin's correct password and their two-factor code. The challenge proves the password was right
    // and names who still owes a code, for 5 minutes. It uses its own audience, so it can never pass as an access token.
    private static readonly challengeAudience = "admin-challenge";
    private static readonly challengeCookie = "admin_challenge";
    private static readonly challengeLifetime = 5 * 60;

    static setChallengeCookie = async (c: Context, adminId: string) => {
        const now = Math.floor(Date.now() / 1000);
        const token = await sign({ sub: adminId, aud: this.challengeAudience, iat: now, exp: now + this.challengeLifetime }, this.getSecret("admin"), "HS256");

        // Only sent to the admin auth routes, which are the only ones that read it.
        setCookie(c, this.challengeCookie, token, {
            ...this.baseCookieOptions,
            path: config.admin.refreshPath,
            maxAge: this.challengeLifetime,
        });
    }

    // The admin id behind the challenge, or null when it's missing, expired, or not genuine.
    static verifyChallengeCookie = async (c: Context) => {
        const token = getCookie(c, this.challengeCookie);
        if (!token) return null;

        try {
            const payload = await verify(token, this.getSecret("admin"), { alg: "HS256", aud: this.challengeAudience });
            return typeof payload.sub === "string" ? payload.sub : null;
        } catch {
            return null;
        }
    }

    static clearChallengeCookie = (c: Context) => {
        deleteCookie(c, this.challengeCookie, { ...this.baseCookieOptions, path: config.admin.refreshPath });
    }

    // Deleting a cookie only works with the same path and options it was set with.
    static clearAuthenticationCookies = (c: Context, audience: Audience) => {
        const local = config[audience];

        deleteCookie(c, local.accessCookie, { ...this.baseCookieOptions, path: local.basePath });
        deleteCookie(c, local.refreshCookie, { ...this.baseCookieOptions, path: local.refreshPath });
    }
}
