import type { Processor } from "bullmq";

import type { JobData, QueueName } from "./queues.js";

// One processor per queue. The worker starts a BullMQ Worker for every entry here.
export const processors: { [K in QueueName]: Processor<JobData[K]> } = {
    email: async (job) => {
        // TODO: send through Resend.
        console.log(`[email] would send "${job.data.subject}" to ${job.data.to}`);
    },
};
