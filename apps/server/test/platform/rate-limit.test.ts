import { Hono } from "hono";
import { beforeEach, describe, expect, it } from "vitest";
import { onError } from "../../src/http/errors";
import { ipKey, rateLimit } from "../../src/platform/rate-limit/rate-limit";
import { resetRedis } from "../support/redis";

const app = new Hono()
  .use(rateLimit({ limit: 3, windowMs: 60_000, key: ipKey("test") }))
  .get("/", (c) => c.text("ok"))
  .onError(onError);

beforeEach(resetRedis);

describe("rateLimit", () => {
  it("answers 429 with Retry-After past the limit", async () => {
    for (let i = 0; i < 3; i++) expect((await app.request("/")).status).toBe(200);

    const limited = await app.request("/");
    expect(limited.status).toBe(429);
    expect(Number(limited.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect(await limited.json()).toMatchObject({ code: "RATE_LIMITED" });
  });

  // CLIENT_IP_HEADER is unset here, as in local development: no header is trusted, whatever the client sends.
  it("ignores client IP headers it wasn't told to trust", async () => {
    for (let i = 0; i < 3; i++) {
      await app.request("/", {
        headers: { "X-Real-IP": `10.0.0.${i}`, "X-Forwarded-For": `10.0.1.${i}` },
      });
    }
    expect((await app.request("/", { headers: { "X-Real-IP": "10.0.0.99" } })).status).toBe(429);
  });
});
