import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const customers = await prisma.customer.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(customers);
}

export async function POST(req: Request) {
  const { name, website, amountPaid, pitch, notes } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Namn krävs' }, { status: 400 });

  const customer = await prisma.customer.create({
    data: {
      name: name.trim(),
      website: website?.trim() || null,
      amountPaid: amountPaid ? Number(amountPaid) : null,
      pitch: pitch?.trim() || null,
      notes: notes?.trim() || null,
    },
  });
  return NextResponse.json(customer, { status: 201 });
}
