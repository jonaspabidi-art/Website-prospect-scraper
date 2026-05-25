import { Queue } from 'bullmq';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
};

export const scrapeQueue = new Queue('scrape', { connection });

export type ScrapeJobData = {
  jobId: string;
  industry: string;
  city: string;
  maxResults: number;
};
