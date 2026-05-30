import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST() {
  const count = await prisma.user.count();
  if (count > 0) {
    return NextResponse.json({ error: 'Setup redan gjord' }, { status: 403 });
  }

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Sätt ADMIN_EMAIL och ADMIN_PASSWORD som miljövariabler' },
      { status: 500 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email: email.toLowerCase().trim(), passwordHash, role: 'admin' },
    select: { id: true, email: true, role: true },
  });

  // Assign all existing orphan jobs to the new admin
  await prisma.scrapeJob.updateMany({
    where: { userId: null },
    data: { userId: user.id },
  });

  return NextResponse.json({ ok: true, email: user.email });
}
