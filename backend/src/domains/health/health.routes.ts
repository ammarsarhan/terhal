import { Hono } from "hono";

import { prisma } from "../../shared/utils/prisma.js";
import { cache } from "../../shared/utils/redis.js";
import { ServiceUnavailableError } from "../../shared/utils/error.js";

const health = new Hono()
    .get("/", async (c) => {
        return c.json({
            success: true,
            data: {
                service: "backend",
                timestamp: new Date().toISOString(),
            },
        });
    })
    .get("/process", async (c) => {
        try {
            // Checks whether or not the database is up and running.
            await prisma.$queryRaw`SELECT 1`;
        } catch {
            throw new ServiceUnavailableError("Could not connect to the database.");
        }

        try {
            await cache.ping();
        } catch {
            throw new ServiceUnavailableError("Could not connect to the cache.");
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
