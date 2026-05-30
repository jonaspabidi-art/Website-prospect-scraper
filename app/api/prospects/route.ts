import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const bransch = searchParams.get('bransch') || '';
  const stad = searchParams.get('stad') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '25');
  const pipeline = searchParams.get('pipeline');
  const typ = searchParams.get('typ') || '';

  const jobFilter = {
    ...(session.role !== 'admin' && { userId: session.userId }),
    ...(bransch && { industry: { contains: bransch, mode: 'insensitive' as const } }),
  };

  const where = {
    dismissed: false,
    job: Object.keys(jobFilter).length > 0 ? jobFilter : undefined,
    ...(search && { name: { contains: search, mode: 'insensitive' as const } }),
    ...(status && { status }),
    ...(pipeline === 'true' && { inPipeline: true }),
    ...(stad && { city: { contains: stad, mode: 'insensitive' as const } }),
    ...(typ === 'weak_website' && { websiteUrl: { not: null } }),
    ...(typ === 'no_website' && { websiteUrl: null }),
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
