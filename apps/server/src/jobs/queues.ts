import { Queue } from "bullmq";

import { createQueueConnection } from "../shared/utils/redis.js";

// Each queue's job payload, keyed by queue name. Producers (the server) and processors (the worker) both type off this.
export type JobData = {
    email: { to: string; subject: string; html: string };
};

export type QueueName = keyof JobData;

const connection = createQueueConnection();

export const queues = {
    email: new Queue<JobData["email"]>("email", { connection }),
} satisfies { [K in QueueName]: Queue<JobData[K]> };
