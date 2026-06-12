import type { DemoContent } from './types';

export default function HantverkareTemplate({ content }: { content: DemoContent }) {
  const c = content.primaryColor;
  const cLight = `${c}18`;

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", color: '#111827', minHeight: '100vh', background: '#f8fafc' }}>
      {/* Nav */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {content.logoUrl
            ? <img src={content.logoUrl} alt="Logo" style={{ height: 40, objectFit: 'contain' }} />
            : <span style={{ fontWeight: 800, fontSize: 20, color: c }}>{content.businessName}</span>
          }
        </div>
        <a href={`tel:${content.phone}`} style={{
          padding: '9px 22px', background: c, color: '#fff',
          borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 14,
        }}>
          Kontakta oss
        </a>
      </nav>

      {/* Hero */}
      <section style={{
        background: content.heroImageUrl
          ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${content.heroImageUrl}) center/cover`
          : `linear-gradient(135deg, ${c} 0%, #1e3a8a 100%)`,
        padding: '80px 32px',
        textAlign: 'center',
        color: '#fff',
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 800, margin: '0 0 16px', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            {content.tagline}
          </h1>
          <p style={{ fontSize: 18, opacity: 0.88, margin: '0 0 36px', lineHeight: 1.6 }}>{content.description}</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href={`tel:${content.phone}`} style={{
              padding: '14px 32px', background: '#fff', color: c,
              borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 16,
            }}>
              {content.phone}
            </a>
            <a href={`mailto:${content.email}`} style={{
              padding: '14px 32px', background: 'rgba(255,255,255,0.18)',
              border: '1.5px solid rgba(255,255,255,0.4)', color: '#fff',
              borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 16,
            }}>
              Skicka mail
            </a>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <div style={{ background: c, padding: '16px 32px' }}>
        <div style={{ maxWidth: 840, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 40, flexWrap: 'wrap' }}>
          {['✓ Alltid fast pris', '✓ Nöjd-kund-garanti', '✓ F-skattsedel', '✓ Snabb respons'].map(t => (
            <span key={t} style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Services */}
      {content.serviceList && content.serviceList.length > 0 && (
        <section style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px' }}>
          <h2 style={{ textAlign: 'center', fontSize: 30, fontWeight: 700, marginBottom: 40, letterSpacing: '-0.02em' }}>Vad vi erbjuder</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {content.serviceList.map((s, i) => (
              <div key={i} style={{
                background: '#fff', borderRadius: 12, padding: '18px 20px',
                border: '1px solid #e5e7eb',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, flexShrink: 0 }} />
                <span style={{ fontWeight: 500, fontSize: 15 }}>{s}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Gallery */}
      {content.galleryImages && content.galleryImages.filter(Boolean).length > 0 && (
        <section style={{ background: '#fff', padding: '56px 32px' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', fontSize: 30, fontWeight: 700, marginBottom: 32, letterSpacing: '-0.02em' }}>Utfört arbete</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
              {content.galleryImages.filter(Boolean).map((url, i) => (
                <img key={i} src={url} alt="" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 12 }} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact */}
      <section style={{ background: cLight, padding: '56px 32px' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Kontakta oss idag</h2>
          <p style={{ color: '#4b5563', marginBottom: 28, fontSize: 16 }}>Vi svarar snabbt och ger dig alltid en kostnadsfri offert.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            <a href={`tel:${content.phone}`} style={{ fontSize: 22, fontWeight: 700, color: c, textDecoration: 'none' }}>{content.phone}</a>
            <a href={`mailto:${content.email}`} style={{ fontSize: 16, color: '#374151', textDecoration: 'none' }}>{content.email}</a>
            <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>{content.address}</p>
          </div>
        </div>
      </section>

      <footer style={{ background: '#1e293b', color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '24px 32px', fontSize: 13 }}>
        © {new Date().getFullYear()} {content.businessName} · {content.address}
      </footer>
    </div>
  );
}
