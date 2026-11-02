import { Hono } from "hono";

import { prisma } from "../../platform/db/prisma.js";
import { cache } from "../../platform/redis/connections.js";
import { AppError } from "../../platform/errors/app-error.js";

const health = new Hono()
  .get("/", async (c) => {
    return c.json({
      success: true,
      data: {
        service: "server",
        timestamp: new Date().toISOString(),
      },
    });
  })
  .get("/process", async (c) => {
    try {
      // Checks whether or not the database is up and running.
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new AppError({
        code: "SERVICE_UNAVAILABLE",
        status: 503,
        detail: "Could not connect to the database.",
      });
    }

    try {
      await cache.ping();
    } catch {
      throw new AppError({
        code: "SERVICE_UNAVAILABLE",
        status: 503,
        detail: "Could not connect to the cache.",
      });
    }

    return c.json({
      success: true,
      data: {
        service: "process",
        timestamp: new Date().toISOString(),
      },
    });
  });

export default health;
