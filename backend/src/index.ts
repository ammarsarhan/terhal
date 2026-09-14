import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.json({
    message: "Hello world!",
  });
});

const port = Number(process.env.PORT ?? 8080);

serve({
  fetch: app.fetch,
  port,
});

console.log(`Backend is running on http://localhost:${port}`);
