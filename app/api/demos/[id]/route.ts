import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { industry, url, notes } = await req.json();

  const demo = await prisma.demoSite.update({
    where: { id },
    data: {
      ...(industry !== undefined && { industry: industry.trim() }),
      ...(url !== undefined && { url: url.trim() }),
      notes: notes?.trim() || null,
    },
  });
  return NextResponse.json(demo);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.demoSite.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
