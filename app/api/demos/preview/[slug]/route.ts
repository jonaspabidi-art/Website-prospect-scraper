import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const demo = await prisma.demoSite.findUnique({ where: { slug } });
  if (!demo) return NextResponse.json({ error: 'Hittades inte' }, { status: 404 });
  return NextResponse.json(demo);
}
