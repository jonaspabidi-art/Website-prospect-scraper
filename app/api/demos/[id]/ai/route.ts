import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 });

  await params;

  const { field, currentValue, instruction, businessName, template } = await req.json();

  if (!field || !instruction) return NextResponse.json({ error: 'field och instruction krävs' }, { status: 400 });

  const fieldLabels: Record<string, string> = {
    businessName: 'företagsnamn',
    tagline: 'slogan/tagline',
    description: 'beskrivning',
    openingHours: 'öppettider',
    phone: 'telefonnummer',
    email: 'e-postadress',
    address: 'adress',
  };

  const fieldLabel = fieldLabels[field] || field;
  const templateLabels: Record<string, string> = {
    restaurang: 'restaurang/café',
    hantverkare: 'hantverkarföretag',
    tjansteforetag: 'tjänsteföretag',
    verkstad: 'bilverkstad/däckverkstad',
  };

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `Du skriver webbinnehåll på svenska för ett ${templateLabels[template] || 'företag'} som heter "${businessName}".

Fält: ${fieldLabel}
Nuvarande text: "${currentValue || '(tom)'}"
Instruktion: ${instruction}

Svara ENDAST med den nya texten för fältet. Inga förklaringar, inga citattecken runt svaret.`,
    }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text.trim() : '';
  return NextResponse.json({ text });
}
