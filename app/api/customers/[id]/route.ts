import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { name, website, amountPaid, pitch, notes } = await req.json();

  const customer = await prisma.customer.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      website: website?.trim() || null,
      amountPaid: amountPaid ? Number(amountPaid) : null,
      pitch: pitch?.trim() || null,
      notes: notes?.trim() || null,
    },
  });
  return NextResponse.json(customer);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.customer.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
