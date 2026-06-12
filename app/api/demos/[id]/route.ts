import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 });

  const { id } = await params;
  const demo = await prisma.demoSite.findUnique({ where: { id } });
  if (!demo) return NextResponse.json({ error: 'Hittades inte' }, { status: 404 });
  return NextResponse.json(demo);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const demo = await prisma.demoSite.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.content !== undefined && { content: body.content }),
      ...(body.published !== undefined && { published: body.published }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
  });
  return NextResponse.json(demo);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 });

  const { id } = await params;
  await prisma.demoSite.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
