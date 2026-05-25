import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 25;

  const where = {
    ...(search && { name: { contains: search, mode: 'insensitive' as const } }),
    ...(status && { status }),
  };

  const [prospects, total] = await Promise.all([
    prisma.prospect.findMany({
      where,
      orderBy: { priorityScore: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { job: { select: { industry: true, city: true } } },
    }),
    prisma.prospect.count({ where }),
  ]);

  return NextResponse.json({ prospects, total, page, totalPages: Math.ceil(total / limit) });
}
