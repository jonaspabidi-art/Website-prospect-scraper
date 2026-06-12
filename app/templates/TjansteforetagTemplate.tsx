import type { DemoContent } from './types';

export default function TjansteforetagTemplate({ content }: { content: DemoContent }) {
  const c = content.primaryColor;

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", color: '#111827', minHeight: '100vh' }}>
      {/* Nav */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68, position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {content.logoUrl
            ? <img src={content.logoUrl} alt="Logo" style={{ height: 38, objectFit: 'contain' }} />
            : <span style={{ fontWeight: 800, fontSize: 20, background: `linear-gradient(135deg, ${c}, #4f46e5)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{content.businessName}</span>
          }
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <a href={`mailto:${content.email}`} style={{ color: '#374151', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Kontakt</a>
          <a href={`tel:${content.phone}`} style={{
            padding: '9px 22px', background: c, color: '#fff',
            borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 14,
          }}>Ring oss</a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        background: `linear-gradient(135deg, #f5f3ff 0%, #ede9fe 40%, #fff 100%)`,
        padding: '100px 40px 80px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {content.heroImageUrl && (
          <div style={{ position: 'absolute', inset: 0, background: `url(${content.heroImageUrl}) center/cover`, opacity: 0.08 }} />
        )}
        <div style={{ position: 'relative', maxWidth: 720, margin: '0 auto' }}>
          <div style={{
            display: 'inline-block', background: `${c}18`, color: c,
            borderRadius: 50, padding: '6px 16px', fontSize: 13, fontWeight: 600, marginBottom: 20,
          }}>
            {content.businessName}
          </div>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 60px)', fontWeight: 800, margin: '0 0 20px', letterSpacing: '-0.03em', lineHeight: 1.05, color: '#0f0e17' }}>
            {content.tagline}
          </h1>
          <p style={{ fontSize: 18, color: '#4b5563', margin: '0 0 40px', lineHeight: 1.7, maxWidth: 560, marginLeft: 'auto', marginRight: 'auto' }}>
            {content.description}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href={`tel:${content.phone}`} style={{
              padding: '14px 32px', background: c, color: '#fff',
              borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 16,
              boxShadow: `0 4px 24px ${c}44`,
            }}>
              Kom igång
            </a>
            <a href={`mailto:${content.email}`} style={{
              padding: '14px 32px', background: '#fff', color: '#374151',
              border: '1.5px solid #d1d5db',
              borderRadius: 10, textDecoration: 'none', fontWeight: 600, fontSize: 16,
            }}>
              Läs mer
            </a>
          </div>
        </div>
      </section>

      {/* Services */}
      {content.serviceFeatures && content.serviceFeatures.length > 0 && (
        <section style={{ background: '#fff', padding: '80px 40px' }}>
          <div style={{ maxWidth: 960, margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', fontSize: 32, fontWeight: 700, marginBottom: 12, letterSpacing: '-0.02em' }}>Vad vi erbjuder</h2>
            <p style={{ textAlign: 'center', color: '#6b7280', fontSize: 16, marginBottom: 48, maxWidth: 480, margin: '0 auto 48px' }}>
              Vi levererar lösningar som skapar verklig skillnad för din verksamhet.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 }}>
              {content.serviceFeatures.map((f, i) => (
                <div key={i} style={{
                  border: '1.5px solid #e5e7eb', borderRadius: 16, padding: '28px 24px',
                  transition: 'border-color 0.2s',
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: `${c}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 16,
                  }}>
                    <span style={{ fontSize: 20 }}>{['💡', '🚀', '🎯', '📊', '⚡', '🛡️'][i % 6]}</span>
                  </div>
                  <h3 style={{ fontWeight: 700, fontSize: 17, margin: '0 0 8px' }}>{f.title}</h3>
                  <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.65, margin: 0 }}>{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section style={{ background: `linear-gradient(135deg, ${c} 0%, #4f46e5 100%)`, padding: '64px 40px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, color: '#fff', margin: '0 0 16px', letterSpacing: '-0.02em' }}>
          Redo att ta nästa steg?
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 17, margin: '0 0 32px' }}>
          Kontakta oss idag för en kostnadsfri konsultation.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href={`tel:${content.phone}`} style={{
            padding: '14px 32px', background: '#fff', color: c,
            borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 16,
          }}>
            {content.phone}
          </a>
          <a href={`mailto:${content.email}`} style={{
            padding: '14px 32px', background: 'rgba(255,255,255,0.18)',
            border: '1.5px solid rgba(255,255,255,0.4)', color: '#fff',
            borderRadius: 10, textDecoration: 'none', fontWeight: 600, fontSize: 16,
          }}>
            {content.email}
          </a>
        </div>
      </section>

      <footer style={{ background: '#0f0e17', color: 'rgba(255,255,255,0.45)', textAlign: 'center', padding: '24px 32px', fontSize: 13 }}>
        © {new Date().getFullYear()} {content.businessName} · {content.address}
      </footer>
    </div>
  );
}
