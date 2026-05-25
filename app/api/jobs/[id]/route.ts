import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const job = await prisma.scrapeJob.findUnique({
    where: { id },
    include: {
      prospects: { orderBy: { priorityScore: 'desc' } },
    },
  });

  if (!job) return NextResponse.json({ error: 'Jobb hittades inte' }, { status: 404 });
  return NextResponse.json(job);
}
