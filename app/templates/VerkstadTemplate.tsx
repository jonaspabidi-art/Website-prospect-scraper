'use client';

import { useState } from 'react';
import type { DemoContent } from './types';
import EditableSection from './EditableSection';

const HEADLINE = "'Oswald', sans-serif";
const BODY = "'Open Sans', sans-serif";

const DEFAULT_HERO =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCGne4OEqcZ51BLeTzWu-WkA8ivbIYW58qERgwYhxHpyr3P6rJFDPt_2mFFUBawACaQeEFns_0FJcFAjkwtQBeU1eBP3apzik3mpiwTZuknX_mp99CX5c80_ZXiqES08E6z1UNVjMZOsfzMxHgqJTus-zADEzg_3UN774p02lS2CUk6zqhgXdN8XI_6J77EP9m1ZSOQSuJe7VLOuWDFwnXn9k2hkD0qJlvQPY_h48Ds4jsjWSgf7nZ0wQq4CRc8ocSsokVQe3GMnGia';

const SUB_ICONS = ['◈', '▪', '▴'];
const SUB_DEFAULTS = ['Hjulbalansering', 'TPMS-Service', 'Fälgar'];

const SERVICES = [
  { id: 'hjulskifte', title: 'Hjulskifte', desc: 'Snabbt och säkert byte mellan sommar- och vinterhjul.', price: '450 kr' },
  { id: 'dackservice', title: 'Däckservice', desc: 'Balansering, lagning eller kontroll av dina däck.', price: 'Från 200 kr' },
  { id: 'dackhotell', title: 'Däckhotell', desc: 'Förvaring, tvätt och kontroll inför nästa säsong.', price: '995 kr/säs.' },
];

const TIMES = ['08:00', '09:30', '11:00', '13:30', '15:00', '16:30'];

const EMPTY = { name: '', email: '', phone: '', reg: '', date: '', time: '', service: 'hjulskifte', notes: '' };

// ── Booking modal ─────────────────────────────────────────────────────────────
function BookingModal({ open, onClose, primary }: { open: boolean; onClose: () => void; primary: string }) {
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  if (!open) return null;

  const field = (name: string) => ({
    name,
    value: form[name as keyof typeof form],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [name]: e.target.value })),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setTimeout(() => setStatus('success'), 1200);
  };

  const handleClose = () => { setStatus('idle'); setForm(EMPTY); onClose(); };

  const inp: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', padding: '12px 16px',
    border: '2px solid #d1d5db', fontSize: 14, fontFamily: BODY,
    background: 'white', color: '#1a1c1c', outline: 'none',
  };

  const lbl: React.CSSProperties = {
    display: 'block', fontFamily: BODY, fontSize: 11, fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '0.08em', color: '#5f5e5e', marginBottom: 6,
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      {/* Backdrop */}
      <div onClick={handleClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />

      {/* Modal */}
      <div style={{
        position: 'relative', width: '100%', maxWidth: 520, maxHeight: '90vh',
        overflowY: 'auto', background: 'white', borderTop: `4px solid ${primary}`,
        boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 32px', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ fontFamily: HEADLINE, fontSize: 22, fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>Boka Tid</h2>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#6b7280', lineHeight: 1 }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 32px' }}>
          {status === 'success' ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 56, marginBottom: 16, color: '#16a34a' }}>✓</div>
              <h3 style={{ fontFamily: HEADLINE, fontSize: 24, fontWeight: 700, textTransform: 'uppercase', margin: '0 0 8px' }}>Bokning mottagen!</h3>
              <p style={{ fontFamily: BODY, fontSize: 14, color: '#5f5e5e', marginBottom: 32 }}>Vi bekräftar din bokning via e-post inom kort.</p>
              <button onClick={handleClose} style={{ fontFamily: HEADLINE, background: primary, color: 'white', border: 'none', padding: '14px 32px', fontSize: 14, fontWeight: 600, textTransform: 'uppercase', cursor: 'pointer' }}>
                Stäng
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Service selector */}
              <div>
                <span style={lbl}>Välj tjänst</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {SERVICES.map(s => {
                    const active = form.service === s.id;
                    return (
                      <button key={s.id} type="button" onClick={() => setForm(f => ({ ...f, service: s.id }))} style={{
                        padding: '12px 8px', border: `2px solid ${active ? primary : '#d1d5db'}`,
                        background: active ? primary : 'white', color: active ? 'white' : '#1a1c1c',
                        cursor: 'pointer', textAlign: 'center', transition: 'all 0.12s',
                      }}>
                        <div style={{ fontFamily: HEADLINE, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', lineHeight: 1.3 }}>{s.title}</div>
                        <div style={{ fontFamily: BODY, fontSize: 11, marginTop: 4, opacity: active ? 0.9 : 0.6 }}>{s.price}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Name */}
              <div>
                <label style={lbl}>Namn *</label>
                <input {...field('name')} required placeholder="Förnamn Efternamn" style={inp} />
              </div>

              {/* Email + phone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={lbl}>E-post *</label>
                  <input {...field('email')} type="email" required placeholder="namn@mail.se" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Telefon *</label>
                  <input {...field('phone')} type="tel" required placeholder="070-000 00 00" style={inp} />
                </div>
              </div>

              {/* Reg + date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={lbl}>Reg.nummer *</label>
                  <input {...field('reg')} required placeholder="ABC 123" style={{ ...inp, textTransform: 'uppercase' }} />
                </div>
                <div>
                  <label style={lbl}>Önskat datum *</label>
                  <input {...field('date')} type="date" required min={new Date().toISOString().split('T')[0]} style={inp} />
                </div>
              </div>

              {/* Time slots */}
              <div>
                <span style={lbl}>Önskad tid</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {TIMES.map(t => {
                    const active = form.time === t;
                    return (
                      <button key={t} type="button" onClick={() => setForm(f => ({ ...f, time: t }))} style={{
                        padding: '7px 14px', border: `2px solid ${active ? primary : '#d1d5db'}`,
                        background: active ? primary : 'white', color: active ? 'white' : '#1a1c1c',
                        fontFamily: HEADLINE, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      }}>{t}</button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={lbl}>Övrigt (valfritt)</label>
                <textarea {...field('notes')} rows={2} placeholder="Specialönskemål, frågor..." style={{ ...inp, resize: 'vertical' }} />
              </div>

              <button type="submit" disabled={status === 'loading'} style={{
                fontFamily: HEADLINE, background: primary, color: 'white', border: 'none',
                padding: '16px', fontSize: 14, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.1em', cursor: status === 'loading' ? 'default' : 'pointer',
                opacity: status === 'loading' ? 0.7 : 1,
              }}>
                {status === 'loading' ? 'Skickar...' : 'Bekräfta Bokning'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

interface VerkstadProps {
  content: DemoContent;
  editMode?: boolean;
  selectedSection?: string | null;
  onSectionClick?: (id: string) => void;
}

// ── Main template ─────────────────────────────────────────────────────────────
export default function VerkstadTemplate({ content, editMode, selectedSection, onSectionClick }: VerkstadProps) {
  const [bookingOpen, setBookingOpen] = useState(false);
  const primary = content.primaryColor || '#9e001f';
  const sel = (id: string) => selectedSection === id;
  const logo = content.logoUrl;
  const hero = content.heroImageUrl || DEFAULT_HERO;
  const services = content.serviceList ?? [];
  const brands = content.brands ?? [];
  const mainService = services[0] || 'Däckskifte & Service';
  const hotelService = services[1] || 'Däckhotell';
  const subServices = services.length > 2 ? services.slice(2, 5) : SUB_DEFAULTS;

  return (
    <div style={{ fontFamily: BODY, background: '#f9f9f9', color: '#1a1c1c', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&family=Open+Sans:wght@400;600&display=swap');
        .vt-nav-link { font-family: ${HEADLINE}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600; color: #5f5e5e; text-decoration: none; transition: color 0.15s; }
        .vt-nav-link:hover { color: ${primary}; }
        .vt-service-card:hover { background: #f4f3f3 !important; }
      `}</style>

      <BookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} primary={primary} />

      {/* ── Header ── */}
      <EditableSection id="header" editMode={editMode} selected={sel('header')} onSelect={onSectionClick} outerStyle={{ position: 'sticky', top: 0, zIndex: 50 }} bgImage={content.sectionBackgrounds?.['header']}>
      <header style={{ background: '#f9f9f9', borderBottom: '2px solid #1a1c1c', position: 'sticky', top: 0, zIndex: 50 }}>
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 48px', maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {logo ? (
              <img src={logo} alt={content.businessName} style={{ height: content.logoHeight ?? 40, maxWidth: (content.logoHeight ?? 40) * 4, objectFit: 'contain' }} />
            ) : (
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: HEADLINE, fontWeight: 700, fontSize: 18 }}>
                {content.businessName[0]}
              </div>
            )}
            {content.showBusinessName !== false && (
              <span style={{ fontFamily: HEADLINE, fontWeight: 700, fontSize: 22, color: primary, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {content.businessName}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 32 }}>
            {['Hem', 'Tjänster', 'Kontakt'].map(l => (
              <a key={l} href="#" className="vt-nav-link">{l}</a>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <a href={`tel:${content.phone}`} style={{ fontFamily: BODY, fontSize: 13, color: '#5f5e5e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', textDecoration: 'none' }}>
              {content.phone}
            </a>
            <button onClick={() => setBookingOpen(true)} style={{ fontFamily: HEADLINE, background: primary, color: 'white', padding: '10px 24px', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', cursor: 'pointer' }}>
              Boka Tid
            </button>
          </div>
        </nav>
      </header>
      </EditableSection>

      {/* ── Hero ── */}
      <EditableSection id="hero" editMode={editMode} selected={sel('hero')} onSelect={onSectionClick} bgImage={content.sectionBackgrounds?.['hero']}>
      <section style={{ position: 'relative', height: 'min(90vh, 900px)', minHeight: 520, display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
        <img src={hero} alt={content.businessName} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 55%' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.05) 100%)' }} />
        <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 1280, margin: '0 auto', padding: '0 48px 80px' }}>
          <p style={{ fontFamily: BODY, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#ffb3b1', margin: '0 0 16px' }}>
            {content.tagline}
          </p>
          <h1 style={{ fontFamily: HEADLINE, fontSize: 'clamp(48px, 7vw, 80px)', fontWeight: 700, textTransform: 'uppercase', color: 'white', margin: '0 0 32px', lineHeight: 1, letterSpacing: '-0.02em' }}>
            {content.businessName}
          </h1>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <button onClick={() => setBookingOpen(true)} style={{ fontFamily: HEADLINE, background: primary, color: 'white', padding: '16px 32px', fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', cursor: 'pointer' }}>
              Boka tid
            </button>
            <a href={`tel:${content.phone}`} style={{ fontFamily: BODY, fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'white', textDecoration: 'none' }}>
              {content.phone}
            </a>
          </div>
        </div>
      </section>
      </EditableSection>

      {/* ── Tjänster ── */}
      <EditableSection id="services" editMode={editMode} selected={sel('services')} onSelect={onSectionClick} bgImage={content.sectionBackgrounds?.['services']}>
      <section style={{ padding: '80px 48px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontFamily: HEADLINE, fontSize: 48, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '-0.02em', margin: 0 }}>
            Våra Tjänster
          </h2>
          <div style={{ width: 96, height: 6, background: primary, margin: '14px auto 0' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 24 }}>
          <div style={{ gridColumn: 'span 8', position: 'relative', overflow: 'hidden', border: '1px solid #eeeeee', height: 'clamp(240px, 40vw, 380px)' }}>
            <img src={hero} alt="Tjänster" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.2) 50%, transparent)', padding: '24px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <h3 style={{ fontFamily: HEADLINE, fontSize: 28, fontWeight: 600, textTransform: 'uppercase', color: 'white', margin: '0 0 8px' }}>{mainService}</h3>
              <p style={{ fontFamily: BODY, fontSize: 15, color: '#e2e2e2', margin: 0, maxWidth: 440, lineHeight: 1.6 }}>{content.description}</p>
            </div>
          </div>

          <div style={{ gridColumn: 'span 4', background: primary, padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderBottom: '8px solid rgba(0,0,0,0.25)', color: 'white' }}>
            <div>
              <div style={{ fontSize: 48, marginBottom: 16, fontWeight: 700, lineHeight: 1 }}>▦</div>
              <h3 style={{ fontFamily: HEADLINE, fontSize: 28, fontWeight: 600, textTransform: 'uppercase', margin: '0 0 16px' }}>{hotelService}</h3>
              <p style={{ fontFamily: BODY, fontSize: 14, opacity: 0.9, lineHeight: 1.7, margin: 0 }}>Vi tar hand om dina däck under optimala förhållanden till nästa säsong.</p>
            </div>
            <button onClick={() => setBookingOpen(true)} style={{ marginTop: 32, display: 'inline-block', border: '2px solid white', textAlign: 'center', padding: '10px 16px', fontFamily: HEADLINE, fontSize: 13, fontWeight: 600, textTransform: 'uppercase', color: 'white', background: 'none', cursor: 'pointer' }}>
              Boka Nu
            </button>
          </div>

          {subServices.map((s, i) => (
            <div key={i} className="vt-service-card" style={{ gridColumn: 'span 4', border: '1px solid #eeeeee', padding: 32, background: 'white', transition: 'background 0.15s' }}>
              <div style={{ fontSize: 36, color: primary, marginBottom: 14 }}>{SUB_ICONS[i] ?? '🔧'}</div>
              <h3 style={{ fontFamily: HEADLINE, fontSize: 20, fontWeight: 600, textTransform: 'uppercase', margin: '0 0 8px', color: '#1a1c1c' }}>{s}</h3>
            </div>
          ))}
        </div>
      </section>
      </EditableSection>

      {/* ── Erbjudanden ── */}
      <EditableSection id="offers" editMode={editMode} selected={sel('offers')} onSelect={onSectionClick} bgImage={content.sectionBackgrounds?.['offers']}>
      <section style={{ background: '#f4f3f3', padding: '80px 48px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontFamily: HEADLINE, fontSize: 48, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '-0.02em', margin: '0 0 8px' }}>Aktuella Erbjudanden</h2>
            <p style={{ fontFamily: BODY, fontSize: 16, color: '#5f5e5e', margin: 0 }}>Gör ett klipp hos {content.businessName}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ border: `2px solid ${primary}`, display: 'flex', background: 'white', overflow: 'hidden' }}>
              <div style={{ width: '50%', background: primary, padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', color: 'white' }}>
                <h3 style={{ fontFamily: HEADLINE, fontSize: 22, fontWeight: 600, textTransform: 'uppercase', lineHeight: 1.2, margin: '0 0 20px' }}>Säsongens<br />{hotelService}</h3>
                <span style={{ fontFamily: BODY, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Från</span>
                <div style={{ fontFamily: HEADLINE, fontSize: 60, fontWeight: 700, lineHeight: 1 }}>995:-</div>
                <span style={{ marginTop: 16, fontFamily: BODY, background: 'white', color: primary, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 14px' }}>Bästa Pris</span>
              </div>
              <div style={{ width: '50%', padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <p style={{ fontFamily: BODY, fontSize: 15, color: '#1a1c1c', marginBottom: 24, lineHeight: 1.6 }}>Inklusive tvätt, kontroll av mönsterdjup och korrekt lufttryck.</p>
                <button onClick={() => setBookingOpen(true)} style={{ fontFamily: HEADLINE, background: '#2f3131', color: 'white', textAlign: 'center', padding: 12, fontSize: 13, fontWeight: 600, textTransform: 'uppercase', border: 'none', cursor: 'pointer', display: 'block', width: '100%' }}>
                  Boka nu
                </button>
              </div>
            </div>

            <div style={{ border: '1px solid #eeeeee', display: 'flex', background: 'white', overflow: 'hidden' }}>
              <div style={{ width: '50%', padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', borderRight: '1px solid #eeeeee' }}>
                <div style={{ fontSize: 56, marginBottom: 8, color: primary, lineHeight: 1 }}>◎</div>
                <h3 style={{ fontFamily: HEADLINE, fontSize: 22, fontWeight: 600, textTransform: 'uppercase', color: '#1a1c1c', lineHeight: 1.2, margin: '0 0 16px' }}>Sommardäck<br />Special</h3>
                <div style={{ fontFamily: BODY, fontSize: 13, color: '#5f5e5e', textTransform: 'uppercase', marginBottom: 4 }}>Spara upp till</div>
                <div style={{ fontFamily: HEADLINE, fontSize: 60, fontWeight: 700, color: primary, lineHeight: 1 }}>20%</div>
              </div>
              <div style={{ width: '50%', padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <p style={{ fontFamily: BODY, fontSize: 15, color: '#5f5e5e', lineHeight: 1.7, margin: 0 }}>Gäller utvalda märken vid köp av komplett set.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      </EditableSection>

      {/* ── Info / Kontakt ── */}
      <EditableSection id="contact" editMode={editMode} selected={sel('contact')} onSelect={onSectionClick} bgImage={content.sectionBackgrounds?.['contact']}>
      <section style={{ padding: '80px 48px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80 }}>
          <div>
            <h2 style={{ fontFamily: HEADLINE, fontSize: 48, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '-0.02em', margin: '0 0 32px' }}>Hitta till oss</h2>
            <div style={{ height: 260, border: '1px solid #eeeeee', background: '#e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, overflow: 'hidden' }}>
              <div style={{ background: 'white', borderTop: `4px solid ${primary}`, padding: 16, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', textAlign: 'center' }}>
                <p style={{ fontFamily: HEADLINE, fontSize: 15, fontWeight: 600, textTransform: 'uppercase', margin: '0 0 4px' }}>{content.businessName}</p>
                <p style={{ fontFamily: BODY, fontSize: 13, color: '#5f5e5e', margin: '0 0 8px' }}>{content.address}</p>
                <a href="#" style={{ fontFamily: BODY, fontSize: 13, fontWeight: 600, textTransform: 'uppercase', color: primary, textDecoration: 'none' }}>Öppna i Google Maps</a>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 32 }}>
              <div>
                <p style={{ fontFamily: BODY, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#5f5e5e', margin: '0 0 4px' }}>Telefon</p>
                <a href={`tel:${content.phone}`} style={{ fontFamily: HEADLINE, fontSize: 20, fontWeight: 600, textTransform: 'uppercase', color: '#1a1c1c', textDecoration: 'none' }}>{content.phone}</a>
              </div>
              <div>
                <p style={{ fontFamily: BODY, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#5f5e5e', margin: '0 0 4px' }}>E-post</p>
                <a href={`mailto:${content.email}`} style={{ fontFamily: HEADLINE, fontSize: 20, fontWeight: 600, textTransform: 'uppercase', color: '#1a1c1c', textDecoration: 'none' }}>{content.email}</a>
              </div>
            </div>
          </div>

          <div style={{ background: '#2f3131', borderLeft: `8px solid ${primary}`, padding: 48, color: 'white' }}>
            <h2 style={{ fontFamily: HEADLINE, fontSize: 48, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '-0.02em', margin: '0 0 32px' }}>Öppettider</h2>
            <p style={{ fontFamily: BODY, fontSize: 16, opacity: 0.85, lineHeight: 2, margin: '0 0 32px', whiteSpace: 'pre-line' }}>
              {content.openingHours || 'Mån–Tors  07:00 – 17:00\nFredag  07:00 – 16:00\nLördag  10:00 – 14:00\nSöndag  Stängt'}
            </p>
            <button onClick={() => setBookingOpen(true)} style={{ fontFamily: HEADLINE, background: primary, color: 'white', padding: '16px 32px', fontSize: 14, fontWeight: 700, textTransform: 'uppercase', border: 'none', cursor: 'pointer' }}>
              Boka Tid
            </button>
          </div>
        </div>
      </section>
      </EditableSection>

      {/* ── Märken ── */}
      {brands.length > 0 && (
        <EditableSection id="brands" editMode={editMode} selected={sel('brands')} onSelect={onSectionClick}>
        <section style={{ background: '#2f3131', padding: '48px' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', textAlign: 'center' }}>
            <p style={{ fontFamily: BODY, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#9e9e9e', marginBottom: 24 }}>Märken vi arbetar med</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
              {brands.map(b => (
                <span key={b} style={{ fontFamily: HEADLINE, fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '8px 20px', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}>{b}</span>
              ))}
            </div>
          </div>
        </section>
        </EditableSection>
      )}

      {/* ── Galleri (optional section) ── */}
      {content.galleryImages && content.galleryImages.length > 0 && (
        <EditableSection id="gallery" editMode={editMode} selected={sel('gallery')} onSelect={onSectionClick}>
        <section style={{ padding: '80px 48px' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <h2 style={{ fontFamily: HEADLINE, fontSize: 48, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '-0.02em', margin: 0 }}>Galleri</h2>
              <div style={{ width: 96, height: 6, background: primary, margin: '14px auto 0' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
              {content.galleryImages.filter(Boolean).map((url, i) => (
                <img key={i} src={url} alt="" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover' }} />
              ))}
            </div>
          </div>
        </section>
        </EditableSection>
      )}

      {/* ── Footer ── */}
      <footer style={{ background: '#2f3131', borderTop: `4px solid ${primary}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 48px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 48, marginBottom: 48 }}>
            <div style={{ maxWidth: 300 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                {logo ? (
                  <img src={logo} alt={content.businessName} style={{ height: content.logoHeight ?? 44, maxWidth: (content.logoHeight ?? 44) * 4, objectFit: 'contain' }} />
                ) : (
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: HEADLINE, fontWeight: 700, fontSize: 20 }}>
                    {content.businessName[0]}
                  </div>
                )}
                <span style={{ fontFamily: HEADLINE, fontSize: 20, fontWeight: 700, textTransform: 'uppercase', color: '#ffb3b1' }}>{content.businessName}</span>
              </div>
              <p style={{ fontFamily: BODY, fontSize: 14, color: '#c8c6c5', lineHeight: 1.7, margin: 0 }}>{content.description}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontFamily: HEADLINE, fontSize: 18, fontWeight: 600, textTransform: 'uppercase', color: 'white', marginBottom: 4 }}>Kontakt</span>
              <a href={`tel:${content.phone}`} style={{ fontFamily: BODY, fontSize: 14, color: '#c8c6c5', textDecoration: 'none' }}>{content.phone}</a>
              <a href={`mailto:${content.email}`} style={{ fontFamily: BODY, fontSize: 14, color: '#c8c6c5', textDecoration: 'none' }}>{content.email}</a>
              <span style={{ fontFamily: BODY, fontSize: 14, color: '#c8c6c5' }}>{content.address}</span>
            </div>

            <button onClick={() => setBookingOpen(true)} style={{ fontFamily: HEADLINE, background: primary, color: 'white', padding: '16px 40px', fontSize: 14, fontWeight: 700, textTransform: 'uppercase', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', alignSelf: 'flex-start' }}>
              Boka Tid
            </button>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontFamily: BODY, fontSize: 13, color: '#9e9e9e', margin: 0 }}>© {new Date().getFullYear()} {content.businessName} · {content.address}</p>
            <p style={{ fontFamily: BODY, fontSize: 13, color: '#9e9e9e', margin: 0 }}>Vi accepterar kort</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
