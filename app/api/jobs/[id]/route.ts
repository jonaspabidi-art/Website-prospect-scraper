import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 });

  const { id } = await params;
  const job = await prisma.scrapeJob.findUnique({ where: { id }, select: { userId: true } });
  if (!job) return NextResponse.json({ error: 'Hittades inte' }, { status: 404 });
  if (session.role !== 'admin' && job.userId !== session.userId) {
    return NextResponse.json({ error: 'Ej behörig' }, { status: 403 });
  }

  await prisma.prospect.deleteMany({ where: { jobId: id } });
  await prisma.scrapeJob.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

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
