import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const demos = await prisma.demoSite.findMany({ orderBy: { industry: 'asc' } });
  return NextResponse.json(demos);
}

export async function POST(req: Request) {
  const { industry, url, notes } = await req.json();
  if (!industry?.trim()) return NextResponse.json({ error: 'Bransch krävs' }, { status: 400 });
  if (!url?.trim()) return NextResponse.json({ error: 'URL krävs' }, { status: 400 });

  const demo = await prisma.demoSite.create({
    data: {
      industry: industry.trim(),
      url: url.trim(),
      notes: notes?.trim() || null,
    },
  });
  return NextResponse.json(demo, { status: 201 });
}
