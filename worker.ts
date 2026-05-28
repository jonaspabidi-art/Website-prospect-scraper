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
    const { jobId, industry, city, maxResults, mode = 'no_website' } = job.data;

    await prisma.scrapeJob.update({
      where: { id: jobId },
      data: { status: 'running' },
    });

    const logs: string[] = [];

    const existing = await prisma.prospect.findMany({
      where: { city: { contains: city, mode: 'insensitive' } },
      select: { name: true, phone: true },
    });
    const skipNames = new Set(existing.map((e: { name: string }) => e.name.toLowerCase()));
    const skipPhones = new Set(
      existing
        .filter((e: { phone: string | null }) => e.phone)
        .map((e: { phone: string | null }) => (e.phone || '').replace(/\D/g, '').slice(-9))
        .filter((p: string) => p.length >= 8)
    );
    if (skipNames.size > 0) {
      logs.push(`Minne: ${skipNames.size} bolag i ${city} redan sparade (${skipPhones.size} telefoner), hoppar över dessa`);
    }

    const results = await runScraper({
      industry,
      city,
      maxResults,
      mode,
      skipNames,
      skipPhones,
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
        mapsVerified: r.maps_verified ?? false,
        mapsUrl: r.maps_url ?? null,
        websiteUrl: r.website_url ?? null,
        websiteQuality: r.website_quality ?? null,
        websiteSignals: r.website_signals?.length ? r.website_signals.join(' · ') : null,
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
console.log(`ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? 'inläst ✓' : 'SAKNAS ✗'}`);
