import type { Processor } from "bullmq";

import type { JobData, QueueName } from "./queues";
import { logger } from "../logger/logger";

// One processor per queue. The worker starts a BullMQ Worker for every entry here.
export const processors: { [K in QueueName]: Processor<JobData[K]> } = {
  email: (job) => {
    // TODO: send through Resend.
    logger.info({ queue: "email", jobId: job.id }, "email job received (not sent yet)");
    return Promise.resolve();
  },
};
