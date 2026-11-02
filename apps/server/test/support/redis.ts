import { cache } from "../../src/platform/redis/connections";

// Empties this worker's Redis database (each worker has its own, see test/setup.ts), e.g. rate limit counters.
export const resetRedis = async () => {
  await cache.flushdb();
};
