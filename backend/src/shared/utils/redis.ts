import "./env.js";
import { Redis, type RedisOptions } from "ioredis";

// The cache may evict keys (allkeys-lru), the queue must never evict (noeviction). Locally they're separate instances; on
// Render both URLs point at the queue's instance for now (see render.yaml).
const cacheUrl = process.env.CACHE_URL;
const queueUrl = process.env.QUEUE_URL;

if (!cacheUrl || !queueUrl) {
    throw new Error("CACHE_URL and QUEUE_URL must both be defined in the environment variables.");
}

// ioredis defaults to IPv4 only. family: 0 lets it resolve either, whatever the host's private network uses.
const baseOptions: RedisOptions = { family: 0 };

export const cache = new Redis(cacheUrl, baseOptions);

// BullMQ needs maxRetriesPerRequest: null so blocking commands wait for Redis instead of failing mid-job.
// Each Queue/Worker gets its own connection from here, since workers hold a blocking connection open.
export const createQueueConnection = () => new Redis(queueUrl, { ...baseOptions, maxRetriesPerRequest: null });
