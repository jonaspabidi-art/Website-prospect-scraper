import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const VALID_STATUSES = ['Ny', 'Ringd', 'Intresserad', 'Kund', 'Nej'];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status } = await req.json();

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Ogiltig status' }, { status: 400 });
  }

  const prospect = await prisma.prospect.update({
    where: { id },
    data: { status } as any,
  });

  return NextResponse.json(prospect);
}
