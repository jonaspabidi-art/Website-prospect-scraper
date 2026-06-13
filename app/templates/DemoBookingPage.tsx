'use client';

import { useState } from 'react';

export type BookingVariant = 'verkstad' | 'restaurang' | 'hantverkare' | 'tjansteforetag';

const CONFIG = {
  verkstad:      { title: 'Boka Tid',      sub: 'Välj tjänst och fyll i dina uppgifter så bekräftar vi din bokning.' },
  restaurang:    { title: 'Boka Bord',     sub: 'Reservera ett bord — vi bekräftar inom kort.' },
  hantverkare:   { title: 'Begär Offert',  sub: 'Berätta om ditt projekt och vi återkommer med ett kostnadsfritt prisförslag.' },
  tjansteforetag:{ title: 'Kontakta Oss', sub: 'Fyll i formuläret så hör vi av oss inom en arbetsdag.' },
};

const TIMES = ['08:00', '09:30', '11:00', '13:30', '15:00', '16:30'];
const PERSONS = ['1–2', '3–4', '5–6', '7+'];

interface Props {
  variant: BookingVariant;
  primary: string;
  businessName: string;
  phone: string;
  email: string;
  address: string;
  serviceList?: string[];
  onBack: () => void;
  // styling
  font?: string;
  inputBorder?: string;
  inputBg?: string;
  labelColor?: string;
  headingFont?: string;
}

const EMPTY = { name: '', phone: '', email: '', service: '', date: '', time: '', persons: '', message: '' };

export default function DemoBookingPage({
  variant, primary, businessName, phone, email, address,
  serviceList = [], onBack,
  font = "'Segoe UI', system-ui, sans-serif",
  inputBorder = '#d1d5db',
  inputBg = '#fff',
  labelColor = '#6b7280',
  headingFont,
}: Props) {
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const cfg = CONFIG[variant];
  const hf = headingFont ?? font;

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setTimeout(() => setStatus('success'), 1200);
  };

  const inp: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '11px 14px', fontSize: 14, fontFamily: font,
    border: `1.5px solid ${inputBorder}`, background: inputBg,
    color: '#111', outline: 'none', borderRadius: 4,
  };
  const lbl: React.CSSProperties = {
    display: 'block', fontFamily: font, fontSize: 11, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.07em',
    color: labelColor, marginBottom: 6,
  };
  const row = (label: string, children: React.ReactNode) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <label style={lbl}>{label}</label>
      {children}
    </div>
  );

  if (status === 'success') {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontFamily: hf, fontSize: 28, fontWeight: 700, margin: '0 0 12px', textTransform: 'uppercase' }}>
          {variant === 'restaurang' ? 'Bokning mottagen!' : variant === 'hantverkare' ? 'Offert skickad!' : 'Tack för ditt meddelande!'}
        </h2>
        <p style={{ fontFamily: font, fontSize: 15, color: '#6b7280', marginBottom: 32 }}>
          Vi återkommer till dig inom kort.
        </p>
        <button onClick={onBack} style={{
          fontFamily: hf, background: primary, color: '#fff', border: 'none',
          padding: '14px 32px', fontSize: 14, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer',
          borderRadius: variant === 'verkstad' ? 0 : 8,
        }}>
          ← Tillbaka till startsidan
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '56px 32px' }}>
      {/* Back + heading */}
      <button onClick={onBack} style={{
        fontFamily: font, background: 'none', border: 'none', cursor: 'pointer',
        color: primary, fontWeight: 600, fontSize: 13, display: 'flex',
        alignItems: 'center', gap: 6, marginBottom: 32, padding: 0,
        textTransform: 'uppercase', letterSpacing: '0.07em',
      }}>
        ← Tillbaka
      </button>

      <div style={{ marginBottom: 48 }}>
        <h1 style={{
          fontFamily: hf, fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 700,
          textTransform: 'uppercase', margin: '0 0 12px', letterSpacing: '-0.02em',
        }}>{cfg.title}</h1>
        <p style={{ fontFamily: font, fontSize: 15, color: '#6b7280', margin: 0 }}>{cfg.sub}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 48, alignItems: 'start' }}>
        {/* Left: info */}
        <div>
          {serviceList.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ fontFamily: hf, fontSize: 16, fontWeight: 700, textTransform: 'uppercase', margin: '0 0 16px', letterSpacing: '0.04em' }}>
                {variant === 'verkstad' ? 'Våra tjänster' : variant === 'hantverkare' ? 'Vi utför' : 'Tjänster'}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {serviceList.map((s, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', background: `${primary}0d`,
                    border: `1px solid ${primary}22`, borderRadius: 6,
                  }}>
                    <span style={{ color: primary, fontWeight: 700, fontSize: 12 }}>✓</span>
                    <span style={{ fontFamily: font, fontSize: 14, fontWeight: 500 }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: '📞', label: 'Telefon', value: phone, href: `tel:${phone}` },
              { icon: '✉️', label: 'E-post', value: email, href: `mailto:${email}` },
              { icon: '📍', label: 'Adress', value: address },
            ].map(({ icon, label, value, href }) => (
              <div key={label}>
                <p style={{ ...lbl, marginBottom: 2 }}>{icon} {label}</p>
                {href
                  ? <a href={href} style={{ fontFamily: font, fontSize: 14, color: '#111', textDecoration: 'none', fontWeight: 600 }}>{value}</a>
                  : <p style={{ fontFamily: font, fontSize: 14, color: '#111', margin: 0 }}>{value}</p>
                }
              </div>
            ))}
          </div>
        </div>

        {/* Right: form */}
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {row('Namn *', <input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Förnamn Efternamn" style={inp} />)}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {row('Telefon *', <input required type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="070-000 00 00" style={inp} />)}
            {row('E-post', <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="namn@mail.se" style={inp} />)}
          </div>

          {/* Variant-specific fields */}
          {variant === 'verkstad' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {row('Reg.nummer *', <input required value={form.service} onChange={e => set('service', e.target.value)} placeholder="ABC 123" style={{ ...inp, textTransform: 'uppercase' }} />)}
                {row('Önskat datum *', <input required type="date" value={form.date} onChange={e => set('date', e.target.value)} min={new Date().toISOString().split('T')[0]} style={inp} />)}
              </div>
              <div>
                <label style={lbl}>Önskad tid</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {TIMES.map(t => (
                    <button key={t} type="button" onClick={() => set('time', t)} style={{
                      padding: '8px 16px', border: `2px solid ${form.time === t ? primary : inputBorder}`,
                      background: form.time === t ? primary : inputBg,
                      color: form.time === t ? '#fff' : '#111',
                      fontFamily: hf, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      borderRadius: 4,
                    }}>{t}</button>
                  ))}
                </div>
              </div>
            </>
          )}

          {variant === 'restaurang' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {row('Datum *', <input required type="date" value={form.date} onChange={e => set('date', e.target.value)} min={new Date().toISOString().split('T')[0]} style={inp} />)}
                <div>
                  <label style={lbl}>Antal personer *</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {PERSONS.map(p => (
                      <button key={p} type="button" onClick={() => set('persons', p)} style={{
                        padding: '9px 16px', border: `2px solid ${form.persons === p ? primary : inputBorder}`,
                        background: form.persons === p ? primary : inputBg,
                        color: form.persons === p ? '#fff' : '#111',
                        fontFamily: font, fontSize: 13, fontWeight: 600, cursor: 'pointer', borderRadius: 50,
                      }}>{p}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label style={lbl}>Tid</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {['11:30', '12:00', '17:00', '18:00', '19:00', '20:00'].map(t => (
                    <button key={t} type="button" onClick={() => set('time', t)} style={{
                      padding: '8px 16px', border: `2px solid ${form.time === t ? primary : inputBorder}`,
                      background: form.time === t ? primary : inputBg,
                      color: form.time === t ? '#fff' : '#111',
                      fontFamily: font, fontSize: 13, fontWeight: 600, cursor: 'pointer', borderRadius: 50,
                    }}>{t}</button>
                  ))}
                </div>
              </div>
            </>
          )}

          {variant === 'hantverkare' && (
            <>
              {row('Vad behöver du hjälp med? *',
                <select required value={form.service} onChange={e => set('service', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                  <option value="">Välj tjänst...</option>
                  {serviceList.map(s => <option key={s} value={s}>{s}</option>)}
                  <option value="Övrigt">Övrigt</option>
                </select>
              )}
              {row('Önskat startdatum', <input type="date" value={form.date} onChange={e => set('date', e.target.value)} min={new Date().toISOString().split('T')[0]} style={inp} />)}
            </>
          )}

          {variant === 'tjansteforetag' && (
            <>
              {row('Företag', <input value={form.service} onChange={e => set('service', e.target.value)} placeholder="Ditt företagsnamn" style={inp} />)}
            </>
          )}

          {row(variant === 'hantverkare' ? 'Beskriv uppdraget *' : 'Meddelande',
            <textarea
              required={variant === 'hantverkare'}
              value={form.message} onChange={e => set('message', e.target.value)}
              rows={3} placeholder={variant === 'hantverkare' ? 'Beskriv vad som ska göras, storlek, material osv...' : 'Övriga önskemål eller frågor...'}
              style={{ ...inp, resize: 'vertical' }}
            />
          )}

          <button type="submit" disabled={status === 'loading'} style={{
            fontFamily: hf, background: primary, color: '#fff', border: 'none',
            padding: '16px 24px', fontSize: 14, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.08em',
            cursor: status === 'loading' ? 'default' : 'pointer',
            opacity: status === 'loading' ? 0.7 : 1,
            borderRadius: variant === 'verkstad' ? 0 : 8,
            width: '100%',
          }}>
            {status === 'loading' ? 'Skickar...' : cfg.title === 'Boka Tid' ? 'Bekräfta Bokning' : cfg.title === 'Boka Bord' ? 'Bekräfta Reservation' : cfg.title === 'Begär Offert' ? 'Skicka Offertförfrågan' : 'Skicka Meddelande'}
          </button>
        </form>
      </div>
    </div>
  );
}
