import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { scrapeQueue } from '@/lib/queue';

function cap(s: string) {
  const t = s.trim().toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export async function POST(req: Request) {
  const { industry, city, maxResults = 20 } = await req.json();

  if (!industry || !city) {
    return NextResponse.json({ error: 'industry och city krävs' }, { status: 400 });
  }

  const normIndustry = cap(industry);
  const normCity = cap(city);

  const job = await prisma.scrapeJob.create({
    data: { industry: normIndustry, city: normCity, maxResults },
  });

  await scrapeQueue.add('scrape', { jobId: job.id, industry: normIndustry, city: normCity, maxResults });

  return NextResponse.json(job, { status: 201 });
}

export async function GET() {
  const jobs = await prisma.scrapeJob.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { _count: { select: { prospects: true } } },
  });
  return NextResponse.json(jobs);
}
