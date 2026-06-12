import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import type { DemoContent, TemplateId } from '@/app/templates/types';
import RestaurangTemplate from '@/app/templates/RestaurangTemplate';
import HantverkareTemplate from '@/app/templates/HantverkareTemplate';
import TjansteforetagTemplate from '@/app/templates/TjansteforetagTemplate';
import VerkstadTemplate from '@/app/templates/VerkstadTemplate';

export default async function PreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const demo = await prisma.demoSite.findUnique({ where: { slug } });
  if (!demo) notFound();

  const content = demo.content as unknown as DemoContent;
  const template = demo.template as TemplateId;

  switch (template) {
    case 'restaurang':
      return <RestaurangTemplate content={content} />;
    case 'hantverkare':
      return <HantverkareTemplate content={content} />;
    case 'tjansteforetag':
      return <TjansteforetagTemplate content={content} />;
    case 'verkstad':
      return <VerkstadTemplate content={content} />;
    default:
      notFound();
  }
}
