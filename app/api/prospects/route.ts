import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const bransch = searchParams.get('bransch') || '';
  const stad = searchParams.get('stad') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '25');

  const pipeline = searchParams.get('pipeline');

  const where = {
    ...(search && { name: { contains: search, mode: 'insensitive' as const } }),
    ...(status && { status }),
    ...(pipeline === 'true' && { inPipeline: true }),
    ...(stad && { city: { contains: stad, mode: 'insensitive' as const } }),
    ...(bransch && { job: { industry: { contains: bransch, mode: 'insensitive' as const } } }),
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
