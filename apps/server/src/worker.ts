import { Worker } from "bullmq";
import { processors } from "./platform/jobs/processors.js";
import { handleShutdown } from "./platform/lifecycle/shutdown.js";
import { logger } from "./platform/logger/logger.js";
import { createQueueConnection } from "./platform/redis/connections.js";

// The worker entry point, the worker container in deploy/compose.yml. No HTTP: it only pulls jobs off the queue Redis.
const workers = Object.entries(processors).map(([name, processor]) => {
  const worker = new Worker(name, processor, { connection: createQueueConnection() });

  worker.on("failed", (job, err) => {
    logger.error({ err, queue: name, jobId: job?.id }, "job failed");
  });

  return worker;
});

logger.info({ queues: workers.map((w) => w.name) }, "worker started");

// close() stops fetching new jobs and waits for the running ones. A job cut off by the deadline is retried by BullMQ, so
// every job must be idempotent. 55 seconds, inside the container's 60-second stop_grace_period.
handleShutdown(async () => {
  await Promise.all(workers.map((w) => w.close()));
}, 55_000);
