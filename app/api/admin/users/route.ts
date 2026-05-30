import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Ej behörig' }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true, email: true, role: true, createdAt: true,
      _count: { select: { jobs: true } },
    },
  });

  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Ej behörig' }, { status: 403 });
  }

  const { email, password, role = 'seller' } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email och lösenord krävs' }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (existing) {
    return NextResponse.json({ error: 'Email används redan' }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email: email.toLowerCase().trim(), passwordHash, role },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  return NextResponse.json(user, { status: 201 });
}
