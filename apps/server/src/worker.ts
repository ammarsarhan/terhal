import { Worker } from "bullmq";

import { processors } from "./jobs/processors.js";
import { prisma } from "./platform/db/prisma.js";
import { cache, createQueueConnection } from "./shared/utils/redis.js";

// Worker entry point, the worker container in deploy/compose.yml. No HTTP: it only pulls jobs off the queue Redis.
const workers = Object.entries(processors).map(([name, processor]) => {
  const worker = new Worker(name, processor, { connection: createQueueConnection() });

  worker.on("failed", (job, err) => {
    console.error(`[${name}] job ${job?.id} failed:`, err);
  });

  return worker;
});

console.log(`Worker is running: ${workers.map((w) => w.name).join(", ")}`);

// Docker sends SIGTERM on redeploy (deploy/compose.yml gives it 60 seconds). Let in-flight jobs finish before exiting, so nothing is left half-processed.
const shutdown = async () => {
  await Promise.all(workers.map((w) => w.close()));
  await Promise.all([cache.quit(), prisma.$disconnect()]);
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
