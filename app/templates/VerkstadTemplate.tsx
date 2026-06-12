import type { DemoContent } from './types';

const HEADLINE = "'Oswald', sans-serif";
const BODY = "'Open Sans', sans-serif";

const DEFAULT_HERO =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCGne4OEqcZ51BLeTzWu-WkA8ivbIYW58qERgwYhxHpyr3P6rJFDPt_2mFFUBawACaQeEFns_0FJcFAjkwtQBeU1eBP3apzik3mpiwTZuknX_mp99CX5c80_ZXiqES08E6z1UNVjMZOsfzMxHgqJTus-zADEzg_3UN774p02lS2CUk6zqhgXdN8XI_6J77EP9m1ZSOQSuJe7VLOuWDFwnXn9k2hkD0qJlvQPY_h48Ds4jsjWSgf7nZ0wQq4CRc8ocSsokVQe3GMnGia';

const SUB_ICONS = ['⚙️', '📡', '🔧'];
const SUB_DEFAULTS = ['Hjulbalansering', 'TPMS-Service', 'Fälgar'];

export default function VerkstadTemplate({ content }: { content: DemoContent }) {
  const primary = content.primaryColor || '#9e001f';
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

      {/* ── Header ── */}
      <header style={{ background: '#f9f9f9', borderBottom: '2px solid #1a1c1c', position: 'sticky', top: 0, zIndex: 50 }}>
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 48px', maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {logo ? (
              <img src={logo} alt={content.businessName} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: HEADLINE, fontWeight: 700, fontSize: 18 }}>
                {content.businessName[0]}
              </div>
            )}
            <span style={{ fontFamily: HEADLINE, fontWeight: 700, fontSize: 22, color: primary, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {content.businessName}
            </span>
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
            <a href="#" style={{ fontFamily: HEADLINE, background: primary, color: 'white', padding: '10px 24px', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', textDecoration: 'none' }}>
              Boka Tid
            </a>
          </div>
        </nav>
      </header>

      {/* ── Hero ── */}
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
            <a href="#" style={{ fontFamily: HEADLINE, background: primary, color: 'white', padding: '16px 32px', fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', textDecoration: 'none' }}>
              Boka tid
            </a>
            <a href={`tel:${content.phone}`} style={{ fontFamily: BODY, fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'white', textDecoration: 'none' }}>
              {content.phone}
            </a>
          </div>
        </div>
      </section>

      {/* ── Tjänster ── */}
      <section style={{ padding: '80px 48px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontFamily: HEADLINE, fontSize: 48, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '-0.02em', margin: 0 }}>
            Våra Tjänster
          </h2>
          <div style={{ width: 96, height: 6, background: primary, margin: '14px auto 0' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 24 }}>
          {/* Main card */}
          <div style={{ gridColumn: 'span 8', position: 'relative', overflow: 'hidden', border: '1px solid #eeeeee', height: 'clamp(240px, 40vw, 380px)' }}>
            <img src={hero} alt="Tjänster" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.2) 50%, transparent)', padding: '24px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <h3 style={{ fontFamily: HEADLINE, fontSize: 28, fontWeight: 600, textTransform: 'uppercase', color: 'white', margin: '0 0 8px' }}>
                {mainService}
              </h3>
              <p style={{ fontFamily: BODY, fontSize: 15, color: '#e2e2e2', margin: 0, maxWidth: 440, lineHeight: 1.6 }}>
                {content.description}
              </p>
            </div>
          </div>

          {/* Red hotel card */}
          <div style={{ gridColumn: 'span 4', background: primary, padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderBottom: '8px solid rgba(0,0,0,0.25)', color: 'white' }}>
            <div>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🏨</div>
              <h3 style={{ fontFamily: HEADLINE, fontSize: 28, fontWeight: 600, textTransform: 'uppercase', margin: '0 0 16px' }}>
                {hotelService}
              </h3>
              <p style={{ fontFamily: BODY, fontSize: 14, opacity: 0.9, lineHeight: 1.7, margin: 0 }}>
                Vi tar hand om dina däck under optimala förhållanden till nästa säsong.
              </p>
            </div>
            <a href="#" style={{ marginTop: 32, display: 'inline-block', border: '2px solid white', textAlign: 'center', padding: '10px 16px', fontFamily: HEADLINE, fontSize: 13, fontWeight: 600, textTransform: 'uppercase', color: 'white', textDecoration: 'none' }}>
              Läs Mer
            </a>
          </div>

          {/* Sub-service cards */}
          {subServices.map((s, i) => (
            <div key={i} className="vt-service-card" style={{ gridColumn: 'span 4', border: '1px solid #eeeeee', padding: 32, background: 'white', transition: 'background 0.15s' }}>
              <div style={{ fontSize: 36, color: primary, marginBottom: 14 }}>{SUB_ICONS[i] ?? '🔧'}</div>
              <h3 style={{ fontFamily: HEADLINE, fontSize: 20, fontWeight: 600, textTransform: 'uppercase', margin: '0 0 8px', color: '#1a1c1c' }}>{s}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* ── Erbjudanden ── */}
      <section style={{ background: '#f4f3f3', padding: '80px 48px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontFamily: HEADLINE, fontSize: 48, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '-0.02em', margin: '0 0 8px' }}>
              Aktuella Erbjudanden
            </h2>
            <p style={{ fontFamily: BODY, fontSize: 16, color: '#5f5e5e', margin: 0 }}>
              Gör ett klipp hos {content.businessName}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ border: `2px solid ${primary}`, display: 'flex', background: 'white', overflow: 'hidden' }}>
              <div style={{ width: '50%', background: primary, padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', color: 'white' }}>
                <h3 style={{ fontFamily: HEADLINE, fontSize: 22, fontWeight: 600, textTransform: 'uppercase', lineHeight: 1.2, margin: '0 0 20px' }}>
                  Säsongens<br />{hotelService}
                </h3>
                <span style={{ fontFamily: BODY, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Från</span>
                <div style={{ fontFamily: HEADLINE, fontSize: 60, fontWeight: 700, lineHeight: 1 }}>995:-</div>
                <span style={{ marginTop: 16, fontFamily: BODY, background: 'white', color: primary, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 14px' }}>
                  Bästa Pris
                </span>
              </div>
              <div style={{ width: '50%', padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <p style={{ fontFamily: BODY, fontSize: 15, color: '#1a1c1c', marginBottom: 24, lineHeight: 1.6 }}>
                  Inklusive tvätt, kontroll av mönsterdjup och korrekt lufttryck.
                </p>
                <a href="#" style={{ fontFamily: HEADLINE, background: '#2f3131', color: 'white', textAlign: 'center', padding: 12, fontSize: 13, fontWeight: 600, textTransform: 'uppercase', textDecoration: 'none', display: 'block' }}>
                  Boka nu
                </a>
              </div>
            </div>

            <div style={{ border: '1px solid #eeeeee', display: 'flex', background: 'white', overflow: 'hidden' }}>
              <div style={{ width: '50%', padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', borderRight: '1px solid #eeeeee' }}>
                <div style={{ fontSize: 56, marginBottom: 8 }}>☀️</div>
                <h3 style={{ fontFamily: HEADLINE, fontSize: 22, fontWeight: 600, textTransform: 'uppercase', color: '#1a1c1c', lineHeight: 1.2, margin: '0 0 16px' }}>
                  Sommardäck<br />Special
                </h3>
                <div style={{ fontFamily: BODY, fontSize: 13, color: '#5f5e5e', textTransform: 'uppercase', marginBottom: 4 }}>Spara upp till</div>
                <div style={{ fontFamily: HEADLINE, fontSize: 60, fontWeight: 700, color: primary, lineHeight: 1 }}>20%</div>
              </div>
              <div style={{ width: '50%', padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <p style={{ fontFamily: BODY, fontSize: 15, color: '#5f5e5e', lineHeight: 1.7, margin: 0 }}>
                  Gäller utvalda märken vid köp av komplett set.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Info / Kontakt ── */}
      <section style={{ padding: '80px 48px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80 }}>
          <div>
            <h2 style={{ fontFamily: HEADLINE, fontSize: 48, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '-0.02em', margin: '0 0 32px' }}>
              Hitta till oss
            </h2>
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
            <h2 style={{ fontFamily: HEADLINE, fontSize: 48, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '-0.02em', margin: '0 0 32px' }}>
              Öppettider
            </h2>
            <p style={{ fontFamily: BODY, fontSize: 16, opacity: 0.85, lineHeight: 2, margin: '0 0 32px', whiteSpace: 'pre-line' }}>
              {content.openingHours || 'Mån–Tors  07:00 – 17:00\nFredag  07:00 – 16:00\nLördag  10:00 – 14:00\nSöndag  Stängt'}
            </p>
            <a href={`tel:${content.phone}`} style={{ fontFamily: HEADLINE, background: primary, color: 'white', padding: '16px 32px', fontSize: 14, fontWeight: 700, textTransform: 'uppercase', textDecoration: 'none', display: 'inline-block' }}>
              Ring oss
            </a>
          </div>
        </div>
      </section>

      {/* ── Märken ── */}
      {brands.length > 0 && (
        <section style={{ background: '#2f3131', padding: '48px' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', textAlign: 'center' }}>
            <p style={{ fontFamily: BODY, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#9e9e9e', marginBottom: 24 }}>
              Märken vi arbetar med
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
              {brands.map(b => (
                <span key={b} style={{ fontFamily: HEADLINE, fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '8px 20px', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}>
                  {b}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer style={{ background: '#2f3131', borderTop: `4px solid ${primary}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 48px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 48, marginBottom: 48 }}>
            <div style={{ maxWidth: 300 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                {logo ? (
                  <img src={logo} alt={content.businessName} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: HEADLINE, fontWeight: 700, fontSize: 20 }}>
                    {content.businessName[0]}
                  </div>
                )}
                <span style={{ fontFamily: HEADLINE, fontSize: 20, fontWeight: 700, textTransform: 'uppercase', color: '#ffb3b1' }}>
                  {content.businessName}
                </span>
              </div>
              <p style={{ fontFamily: BODY, fontSize: 14, color: '#c8c6c5', lineHeight: 1.7, margin: 0 }}>
                {content.description}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontFamily: HEADLINE, fontSize: 18, fontWeight: 600, textTransform: 'uppercase', color: 'white', marginBottom: 4 }}>Kontakt</span>
              <a href={`tel:${content.phone}`} style={{ fontFamily: BODY, fontSize: 14, color: '#c8c6c5', textDecoration: 'none' }}>{content.phone}</a>
              <a href={`mailto:${content.email}`} style={{ fontFamily: BODY, fontSize: 14, color: '#c8c6c5', textDecoration: 'none' }}>{content.email}</a>
              <span style={{ fontFamily: BODY, fontSize: 14, color: '#c8c6c5' }}>{content.address}</span>
            </div>

            <a href="#" style={{ fontFamily: HEADLINE, background: primary, color: 'white', padding: '16px 40px', fontSize: 14, fontWeight: 700, textTransform: 'uppercase', textDecoration: 'none', display: 'inline-block', whiteSpace: 'nowrap', alignSelf: 'flex-start' }}>
              Kontakta Oss
            </a>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontFamily: BODY, fontSize: 13, color: '#9e9e9e', margin: 0 }}>
              © {new Date().getFullYear()} {content.businessName} · {content.address}
            </p>
            <p style={{ fontFamily: BODY, fontSize: 13, color: '#9e9e9e', margin: 0 }}>
              Vi accepterar kort
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
