import type { DemoContent } from './types';

export default function VerkstadTemplate({ content }: { content: DemoContent }) {
  const c = content.primaryColor;

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", color: '#fff', minHeight: '100vh', background: '#111' }}>
      {/* Nav */}
      <nav style={{ background: '#1a1a1a', borderBottom: '1px solid #2a2a2a', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {content.logoUrl
            ? <img src={content.logoUrl} alt="Logo" style={{ height: 40, objectFit: 'contain' }} />
            : <span style={{ fontWeight: 900, fontSize: 20, color: '#fff', letterSpacing: '-0.02em' }}>{content.businessName}</span>
          }
        </div>
        <a href={`tel:${content.phone}`} style={{
          padding: '9px 20px', background: c, color: '#fff',
          borderRadius: 6, textDecoration: 'none', fontWeight: 700, fontSize: 14, letterSpacing: '0.01em',
        }}>
          {content.phone}
        </a>
      </nav>

      {/* Hero */}
      <section style={{
        background: content.heroImageUrl
          ? `linear-gradient(rgba(0,0,0,0.72), rgba(0,0,0,0.72)), url(${content.heroImageUrl}) center/cover`
          : `linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)`,
        padding: '80px 32px',
        borderBottom: `4px solid ${c}`,
      }}>
        <div style={{ maxWidth: 680, marginLeft: 0 }}>
          <div style={{ display: 'inline-block', background: c, color: '#fff', padding: '4px 14px', borderRadius: 4, fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 20 }}>
            Proffs på din bil
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 54px)', fontWeight: 900, margin: '0 0 16px', letterSpacing: '-0.03em', lineHeight: 1.05 }}>
            {content.tagline}
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.75)', margin: '0 0 36px', lineHeight: 1.6 }}>
            {content.description}
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a href={`tel:${content.phone}`} style={{
              padding: '14px 28px', background: c, color: '#fff',
              borderRadius: 6, textDecoration: 'none', fontWeight: 700, fontSize: 16,
            }}>
              Ring nu: {content.phone}
            </a>
            <a href={`mailto:${content.email}`} style={{
              padding: '14px 28px', background: 'rgba(255,255,255,0.1)',
              border: '1.5px solid rgba(255,255,255,0.25)', color: '#fff',
              borderRadius: 6, textDecoration: 'none', fontWeight: 600, fontSize: 16,
            }}>
              Boka service
            </a>
          </div>
        </div>
      </section>

      {/* Services */}
      {content.serviceList && content.serviceList.length > 0 && (
        <section style={{ background: '#1a1a1a', padding: '60px 32px' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 32, letterSpacing: '-0.02em' }}>
              <span style={{ color: c }}>// </span>Våra tjänster
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
              {content.serviceList.map((s, i) => (
                <div key={i} style={{
                  background: '#222', borderRadius: 10, padding: '18px 20px',
                  borderLeft: `3px solid ${c}`, display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <span style={{ color: c, fontWeight: 700, fontSize: 18 }}>✓</span>
                  <span style={{ fontWeight: 500, fontSize: 15 }}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Brands + Opening Hours */}
      <section style={{ background: '#111', padding: '56px 32px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 32 }}>
          {content.brands && content.brands.length > 0 && (
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: 'rgba(255,255,255,0.9)' }}>Bilmärken vi servar</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {content.brands.map((b, i) => (
                  <span key={i} style={{
                    background: '#2a2a2a', borderRadius: 6, padding: '6px 14px',
                    fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.8)',
                    border: '1px solid #3a3a3a',
                  }}>{b}</span>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: 'rgba(255,255,255,0.9)' }}>Hitta oss</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {content.openingHours && (
                <p style={{ margin: 0, fontSize: 15, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
                  <span style={{ color: c, fontWeight: 600 }}>Öppettider: </span>{content.openingHours}
                </p>
              )}
              <p style={{ margin: 0, fontSize: 15, color: 'rgba(255,255,255,0.65)' }}>
                <span style={{ color: c, fontWeight: 600 }}>Adress: </span>{content.address}
              </p>
              <p style={{ margin: 0, fontSize: 15, color: 'rgba(255,255,255,0.65)' }}>
                <span style={{ color: c, fontWeight: 600 }}>Tel: </span>
                <a href={`tel:${content.phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>{content.phone}</a>
              </p>
              <p style={{ margin: 0, fontSize: 15, color: 'rgba(255,255,255,0.65)' }}>
                <span style={{ color: c, fontWeight: 600 }}>Mail: </span>
                <a href={`mailto:${content.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>{content.email}</a>
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer style={{ background: '#0d0d0d', borderTop: `2px solid ${c}`, textAlign: 'center', padding: '20px 32px', fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
        © {new Date().getFullYear()} {content.businessName} · {content.address}
      </footer>
    </div>
  );
}
