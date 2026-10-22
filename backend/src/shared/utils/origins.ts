import "./env.js";

export type Audience = "site" | "staff" | "admin";

const variables = {
    site: "SITE_URL",
    staff: "DASHBOARD_URL",
    admin: "ADMIN_URL",
} as const satisfies Record<Audience, string>;

// Local development (see the README). Never used in production, where a missing URL is a misconfiguration.
const localOrigins = {
    site: "https://local.terhal.co:3000",
    staff: "https://dashboard.local.terhal.co:3000",
    admin: "https://admin.local.terhal.co:3000",
} as const satisfies Record<Audience, string>;

// Where each audience's frontend lives in this environment, e.g. https://admin.terhal.co. Used both as the only browser
// origin allowed to call that audience's routes and as the base of the links emailed to it, so a link can never point at
// localhost in production.
export const getOrigin = (audience: Audience) => {
    const variable = variables[audience];
    const url = process.env[variable];
    if (url) return url;

    if (process.env.NODE_ENV === "production") throw new Error(`${variable} is not defined. Please define it in the environment variables.`);
    return localOrigins[audience];
}
