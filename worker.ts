import { Worker } from 'bullmq';
import { prisma } from './lib/db';
import type { ScrapeJobData } from './lib/queue';

const { runScraper } = require('./scraper/index.js');

const connection = {
  host: process.env.REDIS_HOST || process.env.REDISHOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || process.env.REDISPORT || '6379'),
  password: process.env.REDIS_PASSWORD || process.env.REDISPASSWORD || undefined,
};

const worker = new Worker<ScrapeJobData>(
  'scrape',
  async (job) => {
    const { jobId, industry, city, maxResults } = job.data;

    await prisma.scrapeJob.update({
      where: { id: jobId },
      data: { status: 'running' },
    });

    const logs: string[] = [];

    const results = await runScraper({
      industry,
      city,
      maxResults,
      onProgress: async (msg: string) => {
        logs.push(msg);
        await prisma.scrapeJob.update({
          where: { id: jobId },
          data: { progress: logs.slice(-50).join('\n') },
        });
      },
    });

    await prisma.prospect.createMany({
      data: results.map((r: any) => ({
        jobId,
        name: r.name,
        phone: r.phone || null,
        address: r.address || null,
        city: r.city || city,
        orgNumber: r.org_number || null,
        revenue: r.revenue ? Math.round(r.revenue) : null,
        employees: r.employees || null,
        profitPositive: r.profit_positive || null,
        yearsInBusiness: r.years_in_business || null,
        googleReviewsCount: r.google_reviews_count || null,
        googleRating: r.google_rating || null,
        source: r.source || null,
        priorityScore: r.priority_score || 0,
      })),
    });

    await prisma.scrapeJob.update({
      where: { id: jobId },
      data: { status: 'completed', completedAt: new Date() },
    });
  },
  { connection, concurrency: 1 }
);

worker.on('failed', async (job, err) => {
  if (job) {
    await prisma.scrapeJob.update({
      where: { id: job.data.jobId },
      data: { status: 'failed', error: err.message },
    });
  }
  console.error('Job failed:', err);
});

console.log('Worker startad, väntar på jobb...');
