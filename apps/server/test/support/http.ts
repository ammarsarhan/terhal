import { routes } from "../../src/http/router";

export const ADMIN_ORIGIN = "https://admin.local.terhal.co:3000";

// A browser in miniature: sends the admin panel's Origin and keeps the cookies the API sets, by name, like a browser
// would for the API's host (paths aside: every admin cookie is under /v1/admin, which is all these tests call).
export const createAgent = () => {
  const jar = new Map<string, string>();

  const request = async (path: string, init: RequestInit & { json?: unknown } = {}) => {
    const headers = new Headers(init.headers);
    headers.set("Origin", ADMIN_ORIGIN);
    if (jar.size > 0) {
      headers.set("Cookie", [...jar].map(([name, value]) => `${name}=${value}`).join("; "));
    }
    if (init.json !== undefined) headers.set("Content-Type", "application/json");

    const response = await routes.request(path, {
      ...init,
      headers,
      body: init.json === undefined ? init.body : JSON.stringify(init.json),
    });

    for (const cookie of response.headers.getSetCookie()) {
      const [pair = "", ...attributes] = cookie.split(";");
      const [name = "", value = ""] = pair.split("=");
      const expired = attributes.some((a) => /max-age=0/i.test(a.trim()));
      if (expired || value === "") jar.delete(name.trim());
      else jar.set(name.trim(), value);
    }

    return response;
  };

  return { request, jar };
};
