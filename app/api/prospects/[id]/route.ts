import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const VALID_STATUSES = ['Ny', 'Ringd', 'Intresserad', 'Kund', 'Nej'];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { status, inPipeline, dismissed } = body;

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Ogiltig status' }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (status !== undefined) data.status = status;
  if (inPipeline !== undefined) data.inPipeline = Boolean(inPipeline);
  if (dismissed !== undefined) data.dismissed = Boolean(dismissed);

  const prospect = await prisma.prospect.update({ where: { id }, data });
  return NextResponse.json(prospect);
}
