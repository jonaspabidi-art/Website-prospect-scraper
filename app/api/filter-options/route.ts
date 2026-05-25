import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const [industryRows, cityRows] = await Promise.all([
    prisma.scrapeJob.findMany({
      select: { industry: true },
      distinct: ['industry'],
      orderBy: { industry: 'asc' },
    }),
    prisma.prospect.findMany({
      select: { city: true },
      distinct: ['city'],
      orderBy: { city: 'asc' },
      where: { city: { not: null } },
    }),
  ]);

  return NextResponse.json({
    industries: industryRows.map(r => r.industry).filter(Boolean),
    cities: cityRows.map(r => r.city).filter(Boolean),
  });
}
