import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/auth';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Ej behörig' }, { status: 403 });
  }

  const { id } = await params;

  if (session.userId === id) {
    return NextResponse.json({ error: 'Kan inte ta bort dig själv' }, { status: 400 });
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Ej behörig' }, { status: 403 });
  }

  const { id } = await params;
  const { password } = await req.json();

  if (!password) {
    return NextResponse.json({ error: 'Nytt lösenord krävs' }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({ where: { id }, data: { passwordHash } });
  return NextResponse.json({ ok: true });
}
