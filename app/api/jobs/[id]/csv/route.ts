import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const job = await prisma.scrapeJob.findUnique({
    where: { id },
    include: { prospects: { orderBy: { priorityScore: 'desc' } } },
  });

  if (!job) return NextResponse.json({ error: 'Hittades inte' }, { status: 404 });

  const headers = ['Namn', 'Telefon', 'Adress', 'Stad', 'Anställda', 'Omsättning', 'Google Betyg', 'Google Reviews', 'Källa', 'Score'];
  const rows = job.prospects.map(p => [
    p.name,
    p.phone ?? '',
    p.address ?? '',
    p.city ?? '',
    p.employees ?? '',
    p.revenue ? `${p.revenue.toLocaleString('sv-SE')} kr` : '',
    p.googleRating ?? '',
    p.googleReviewsCount ?? '',
    p.source ?? '',
    p.priorityScore,
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const filename = `prospects-${job.industry}-${job.city}-${job.createdAt.toISOString().split('T')[0]}.csv`;

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
