import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { defaultContent } from '@/app/templates/types';
import type { TemplateId } from '@/app/templates/types';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 });

  const demos = await prisma.demoSite.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(demos);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 });

  const { name, template } = await req.json();

  const validTemplates: TemplateId[] = ['restaurang', 'hantverkare', 'tjansteforetag', 'verkstad'];
  if (!name?.trim()) return NextResponse.json({ error: 'Namn krävs' }, { status: 400 });
  if (!validTemplates.includes(template)) return NextResponse.json({ error: 'Ogiltig mall' }, { status: 400 });

  const slug = crypto.randomUUID().replace(/-/g, '');
  const content = defaultContent(template as TemplateId);

  const demo = await prisma.demoSite.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { name: name.trim(), template, content: content as any, slug },
  });
  return NextResponse.json(demo, { status: 201 });
}
