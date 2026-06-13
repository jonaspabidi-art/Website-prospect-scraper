'use client';

import type { DemoContent } from './types';
import EditableSection from './EditableSection';

interface RestaurangProps {
  content: DemoContent;
  editMode?: boolean;
  selectedSection?: string | null;
  onSectionClick?: (id: string) => void;
}

export default function RestaurangTemplate({ content, editMode, selectedSection, onSectionClick }: RestaurangProps) {
  const c = content.primaryColor;
  const sel = (id: string) => selectedSection === id;
  const bg = content.heroImageUrl
    ? `linear-gradient(rgba(0,0,0,0.52), rgba(0,0,0,0.52)), url(${content.heroImageUrl}) center/cover no-repeat`
    : `linear-gradient(135deg, #1a1209 0%, #3d2a0e 60%, #5c3d14 100%)`;

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", color: '#1a1209', minHeight: '100vh', background: '#fdf8f0' }}>
      {/* Hero */}
      <EditableSection id="hero" editMode={editMode} selected={sel('hero')} onSelect={onSectionClick} bgImage={content.sectionBackgrounds?.["hero"]}>
      <section style={{ background: bg, minHeight: 480, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', textAlign: 'center' }}>
        {content.logoUrl && (
          <img src={content.logoUrl} alt="Logo" style={{ height: content.logoHeight ?? 64, maxWidth: (content.logoHeight ?? 64) * 4, marginBottom: 24, objectFit: 'contain' }} />
        )}
        <h1 style={{ fontSize: 'clamp(32px, 6vw, 56px)', fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
          {content.businessName}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: 'clamp(16px, 3vw, 22px)', margin: '16px 0 32px', maxWidth: 540 }}>
          {content.tagline}
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <a href={`tel:${content.phone}`} style={{
            padding: '12px 28px', background: c, color: '#fff',
            borderRadius: 50, textDecoration: 'none', fontWeight: 600, fontSize: 15,
          }}>
            Boka bord
          </a>
          <a href="#meny" style={{
            padding: '12px 28px', background: 'rgba(255,255,255,0.15)',
            border: '1.5px solid rgba(255,255,255,0.4)', color: '#fff',
            borderRadius: 50, textDecoration: 'none', fontWeight: 500, fontSize: 15, backdropFilter: 'blur(4px)',
          }}>
            Se menyn
          </a>
        </div>
      </section>
      </EditableSection>

      {/* About */}
      <EditableSection id="about" editMode={editMode} selected={sel('about')} onSelect={onSectionClick} bgImage={content.sectionBackgrounds?.["about"]}>
      <section style={{ maxWidth: 720, margin: '0 auto', padding: '64px 24px 48px', textAlign: 'center' }}>
        <p style={{ fontSize: 18, lineHeight: 1.75, color: '#4a3520' }}>{content.description}</p>
      </section>
      </EditableSection>

      {/* Menu */}
      {content.menuItems && content.menuItems.length > 0 && (
        <EditableSection id="menu" editMode={editMode} selected={sel('menu')} onSelect={onSectionClick} bgImage={content.sectionBackgrounds?.["menu"]}>
        <section id="meny" style={{ background: '#fff', padding: '56px 24px' }}>
          <div style={{ maxWidth: 840, margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', fontSize: 32, fontWeight: 700, marginBottom: 40, letterSpacing: '-0.02em' }}>Vår meny</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
              {content.menuItems.map((item, i) => (
                <div key={i} style={{
                  border: `2px solid ${c}22`,
                  borderRadius: 16, padding: '24px 20px',
                  borderTop: `4px solid ${c}`,
                }}>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{item.name}</div>
                  <div style={{ color: '#6b5740', fontSize: 14, lineHeight: 1.5, marginBottom: 12 }}>{item.description}</div>
                  <div style={{ fontWeight: 700, color: c, fontSize: 17 }}>{item.price}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
        </EditableSection>
      )}

      {/* Galleri (optional) */}
      {content.galleryImages && content.galleryImages.filter(Boolean).length > 0 && (
        <EditableSection id="gallery" editMode={editMode} selected={sel('gallery')} onSelect={onSectionClick} bgImage={content.sectionBackgrounds?.["gallery"]}>
        <section style={{ padding: '56px 24px', background: '#fdf8f0' }}>
          <div style={{ maxWidth: 840, margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', fontSize: 32, fontWeight: 700, marginBottom: 32, letterSpacing: '-0.02em' }}>Galleri</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
              {content.galleryImages.filter(Boolean).map((url, i) => (
                <img key={i} src={url} alt="" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 12 }} />
              ))}
            </div>
          </div>
        </section>
        </EditableSection>
      )}

      {/* Info */}
      <EditableSection id="contact" editMode={editMode} selected={sel('contact')} onSelect={onSectionClick} bgImage={content.sectionBackgrounds?.["contact"]}>
      <section style={{ maxWidth: 840, margin: '0 auto', padding: '56px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 24 }}>
          {content.openingHours && (
            <InfoCard icon="○" title="Öppettider" text={content.openingHours} accent={c} />
          )}
          <InfoCard icon="◆" title="Adress" text={content.address} accent={c} />
          <InfoCard icon="◎" title="Telefon" text={content.phone} accent={c} />
          <InfoCard icon="→" title="E-post" text={content.email} accent={c} />
        </div>
      </section>
      </EditableSection>

      {/* Footer */}
      <footer style={{ background: '#1a1209', color: 'rgba(255,255,255,0.55)', textAlign: 'center', padding: '28px 24px', fontSize: 13 }}>
        © {new Date().getFullYear()} {content.businessName} · {content.address}
      </footer>
    </div>
  );
}

function InfoCard({ icon, title, text, accent }: { icon: string; title: string; text: string; accent: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: '20px 18px', border: '1px solid #e8ddd0' }}>
      <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontWeight: 600, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: accent, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 14, color: '#4a3520', lineHeight: 1.6 }}>{text}</div>
    </div>
  );
}
