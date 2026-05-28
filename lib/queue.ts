import { Queue } from 'bullmq';

const connection = {
  host: process.env.REDIS_HOST || process.env.REDISHOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || process.env.REDISPORT || '6379'),
  password: process.env.REDIS_PASSWORD || process.env.REDISPASSWORD || undefined,
};

export const scrapeQueue = new Queue('scrape', { connection });

export type ScrapeJobData = {
  jobId: string;
  industry: string;
  city: string;
  maxResults: number;
  mode: 'no_website' | 'weak_website';
};
