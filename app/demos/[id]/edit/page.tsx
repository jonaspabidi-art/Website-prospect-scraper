'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { DemoContent, TemplateId, MenuItem, ServiceFeature } from '@/app/templates/types';

const RestaurangTemplate = dynamic(() => import('@/app/templates/RestaurangTemplate'), { ssr: false });
const HantverkareTemplate = dynamic(() => import('@/app/templates/HantverkareTemplate'), { ssr: false });
const TjansteforetagTemplate = dynamic(() => import('@/app/templates/TjansteforetagTemplate'), { ssr: false });
const VerkstadTemplate = dynamic(() => import('@/app/templates/VerkstadTemplate'), { ssr: false });

function renderTemplate(template: TemplateId, content: DemoContent) {
  switch (template) {
    case 'restaurang': return <RestaurangTemplate content={content} />;
    case 'hantverkare': return <HantverkareTemplate content={content} />;
    case 'tjansteforetag': return <TjansteforetagTemplate content={content} />;
    case 'verkstad': return <VerkstadTemplate content={content} />;
  }
}

// ── AI popup ────────────────────────────────────────────
function AIButton({ field, value, template, businessName, onResult }: {
  field: string; value: string; template: TemplateId; businessName: string;
  onResult: (text: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoId, setDemoId] = useState('');

  useEffect(() => {
    setDemoId(window.location.pathname.split('/')[2]);
  }, []);

  const run = async () => {
    if (!instruction.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/demos/${demoId}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, currentValue: value, instruction, businessName, template }),
      });
      const data = await res.json();
      if (data.text) { onResult(data.text); setOpen(false); setInstruction(''); }
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        title="Förbättra med AI"
        style={{
          width: 26, height: 26, borderRadius: 6,
          border: '1px solid var(--border)',
          background: open ? 'var(--accent-soft)' : 'var(--bg)',
          color: open ? 'var(--accent)' : 'var(--text-muted)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          fontSize: 14,
        }}
      >✦</button>
      {open && (
        <div style={{
          position: 'absolute', top: 32, right: 0, zIndex: 50,
          background: 'var(--bg)', border: '1px solid var(--border)',
          borderRadius: 10, padding: 14, width: 260,
          boxShadow: 'var(--shadow-lg)',
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Beskriv vad du vill ändra</div>
          <textarea
            value={instruction}
            onChange={e => setInstruction(e.target.value)}
            placeholder="t.ex. Gör det mer säljande och kortare"
            rows={2}
            style={{
              width: '100%', boxSizing: 'border-box', padding: '7px 9px', fontSize: 13,
              border: '1px solid var(--border)', borderRadius: 7,
              background: 'var(--bg-subtle)', color: 'var(--text)',
              resize: 'none', outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="button" onClick={() => setOpen(false)} style={{
              flex: 1, padding: '7px 0', fontSize: 12, borderRadius: 7,
              border: '1px solid var(--border)', background: 'none', color: 'var(--text-muted)', cursor: 'pointer',
            }}>Avbryt</button>
            <button type="button" onClick={run} disabled={loading || !instruction.trim()} style={{
              flex: 1, padding: '7px 0', fontSize: 12, fontWeight: 600, borderRadius: 7,
              border: 'none', background: 'var(--accent)', color: '#fff', cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}>{loading ? '...' : 'Generera'}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Field components ─────────────────────────────────────
function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</label>
      {children}
    </div>
  );
}

const inp: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '7px 10px', fontSize: 13,
  border: '1px solid var(--border)', borderRadius: 8,
  background: 'var(--bg)', color: 'var(--text)', outline: 'none',
};

// ── Image uploader ────────────────────────────────────────
function ImageUpload({ label, value, field, demoId, onChange }: {
  label: string; value: string | null; field: string; demoId: string; onChange: (url: string | null) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`/api/demos/${demoId}/upload`, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) {
        onChange(data.url);
      } else {
        setError(data.error || `Fel ${res.status}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nätverksfel');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <FieldRow label={label}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {value && <img src={value} alt="" style={{ height: 40, width: 40, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }} />}
        <label style={{
          padding: '7px 12px', fontSize: 12, fontWeight: 500, borderRadius: 7,
          border: '1px solid var(--border)', background: 'var(--bg-subtle)',
          color: 'var(--text-muted)', cursor: uploading ? 'default' : 'pointer',
          flexShrink: 0,
        }}>
          {uploading ? 'Laddar upp...' : value ? 'Byt bild' : 'Välj bild'}
          <input type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} disabled={uploading} />
        </label>
        {value && (
          <button type="button" onClick={() => onChange(null)} style={{
            background: 'none', border: '1px solid var(--red-border)', color: 'var(--red)',
            borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer',
          }}>Ta bort</button>
        )}
      </div>
      {error && <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 4 }}>⚠ {error}</div>}
    </FieldRow>
  );
}

// ── Section accordion ─────────────────────────────────────
function Section({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '12px 16px', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 13, fontWeight: 600, color: 'var(--text)', textAlign: 'left',
        }}
      >
        {title}
        <span style={{ color: 'var(--text-faint)', fontSize: 12, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>▾</span>
      </button>
      {open && <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>}
    </div>
  );
}

// ── Main builder ──────────────────────────────────────────
export default function EditDemoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [demo, setDemo] = useState<{ id: string; name: string; template: TemplateId; content: DemoContent; slug: string; published: boolean } | null>(null);
  const [content, setContent] = useState<DemoContent | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    fetch(`/api/demos/${id}`)
      .then(r => r.json())
      .then(d => { setDemo(d); setContent(d.content as DemoContent); });
  }, [id]);

  const set = useCallback(<K extends keyof DemoContent>(key: K, value: DemoContent[K]) => {
    setContent(c => c ? { ...c, [key]: value } : c);
  }, []);

  const save = async () => {
    if (!content) return;
    setSaving(true);
    await fetch(`/api/demos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const togglePublish = async () => {
    if (!demo) return;
    setPublishing(true);
    const res = await fetch(`/api/demos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !demo.published }),
    });
    const updated = await res.json();
    setDemo(d => d ? { ...d, published: updated.published } : d);
    setPublishing(false);
  };

  if (!demo || !content) {
    return <div style={{ padding: 40, color: 'var(--text-muted)', fontSize: 14 }}>Laddar...</div>;
  }

  const previewUrl = `/demos/preview/${demo.slug}`;

  const setMenuItem = (i: number, key: keyof MenuItem, val: string) => {
    const items = [...(content.menuItems || [])];
    items[i] = { ...items[i], [key]: val };
    set('menuItems', items);
  };

  const setServiceFeature = (i: number, key: keyof ServiceFeature, val: string) => {
    const items = [...(content.serviceFeatures || [])];
    items[i] = { ...items[i], [key]: val };
    set('serviceFeatures', items);
  };

  const setServiceListItem = (i: number, val: string) => {
    const items = [...(content.serviceList || [])];
    items[i] = val;
    set('serviceList', items);
  };

  const setBrand = (i: number, val: string) => {
    const items = [...(content.brands || [])];
    items[i] = val;
    set('brands', items);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* ── Left panel ── */}
      <div style={{
        width: 320, flexShrink: 0, borderRight: '1px solid var(--border)',
        overflowY: 'auto', display: 'flex', flexDirection: 'column',
        background: 'var(--bg-subtle)',
      }}>
        {/* Header */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button
            onClick={() => router.push('/demos')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px 6px', fontSize: 18 }}
          >←</button>
          <div style={{ flex: 1, fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {demo.name}
          </div>
          <button
            onClick={save}
            disabled={saving}
            style={{
              padding: '6px 14px', fontSize: 12, fontWeight: 600, borderRadius: 7,
              border: 'none', background: saved ? '#16a34a' : 'var(--accent)',
              color: '#fff', cursor: saving ? 'default' : 'pointer', flexShrink: 0,
            }}
          >{saved ? '✓ Sparat' : saving ? '...' : 'Spara'}</button>
        </div>

        {/* Publish + preview */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, flexShrink: 0 }}>
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1, textAlign: 'center', padding: '7px 0', fontSize: 12, fontWeight: 500,
              border: '1px solid var(--border)', borderRadius: 7, textDecoration: 'none',
              color: 'var(--text-muted)', background: 'var(--bg)',
            }}
          >↗ Öppna preview</a>
          <button
            onClick={togglePublish}
            disabled={publishing}
            style={{
              flex: 1, padding: '7px 0', fontSize: 12, fontWeight: 600, borderRadius: 7,
              border: 'none', cursor: publishing ? 'default' : 'pointer',
              background: demo.published ? '#dcfce7' : 'var(--accent)',
              color: demo.published ? '#15803d' : '#fff',
            }}
          >
            {demo.published ? '✓ Publicerad' : 'Publicera'}
          </button>
        </div>

        {/* Color picker */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', flex: 1 }}>Accentfärg</span>
          <input
            type="color"
            value={content.primaryColor}
            onChange={e => set('primaryColor', e.target.value)}
            style={{ width: 36, height: 28, border: '1px solid var(--border)', borderRadius: 6, padding: 2, cursor: 'pointer', background: 'none' }}
          />
        </div>

        {/* Sections */}
        <Section title="Allmänt" defaultOpen>
          <FieldRow label="Företagsnamn">
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input style={inp} value={content.businessName} onChange={e => set('businessName', e.target.value)} />
              <AIButton field="businessName" value={content.businessName} template={demo.template} businessName={content.businessName} onResult={v => set('businessName', v)} />
            </div>
          </FieldRow>
          <FieldRow label="Tagline / Slogan">
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input style={inp} value={content.tagline} onChange={e => set('tagline', e.target.value)} />
              <AIButton field="tagline" value={content.tagline} template={demo.template} businessName={content.businessName} onResult={v => set('tagline', v)} />
            </div>
          </FieldRow>
          <FieldRow label="Beskrivning">
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
              <textarea
                style={{ ...inp, resize: 'vertical', minHeight: 72 }}
                value={content.description}
                onChange={e => set('description', e.target.value)}
              />
              <AIButton field="description" value={content.description} template={demo.template} businessName={content.businessName} onResult={v => set('description', v)} />
            </div>
          </FieldRow>
        </Section>

        <Section title="Kontakt & adress">
          <FieldRow label="Telefon">
            <input style={inp} value={content.phone} onChange={e => set('phone', e.target.value)} />
          </FieldRow>
          <FieldRow label="E-post">
            <input style={inp} value={content.email} onChange={e => set('email', e.target.value)} />
          </FieldRow>
          <FieldRow label="Adress">
            <input style={inp} value={content.address} onChange={e => set('address', e.target.value)} />
          </FieldRow>
          {(demo.template === 'restaurang' || demo.template === 'verkstad') && (
            <FieldRow label="Öppettider">
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input style={inp} value={content.openingHours || ''} onChange={e => set('openingHours', e.target.value)} />
                <AIButton field="openingHours" value={content.openingHours || ''} template={demo.template} businessName={content.businessName} onResult={v => set('openingHours', v)} />
              </div>
            </FieldRow>
          )}
        </Section>

        <Section title="Bilder">
          <ImageUpload label="Logo" value={content.logoUrl} field="logoUrl" demoId={id} onChange={v => set('logoUrl', v)} />
          <ImageUpload label="Hero-bild (bakgrund)" value={content.heroImageUrl} field="heroImageUrl" demoId={id} onChange={v => set('heroImageUrl', v)} />
        </Section>

        {/* Template-specific sections */}
        {demo.template === 'restaurang' && content.menuItems && (
          <Section title={`Meny (${content.menuItems.length} rätter)`}>
            {content.menuItems.map((item, i) => (
              <div key={i} style={{ background: 'var(--bg)', borderRadius: 8, padding: 10, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Rätt {i + 1}</span>
                  <button type="button" onClick={() => set('menuItems', (content.menuItems || []).filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', fontSize: 16 }}>×</button>
                </div>
                <input style={inp} placeholder="Namn" value={item.name} onChange={e => setMenuItem(i, 'name', e.target.value)} />
                <input style={inp} placeholder="Beskrivning" value={item.description} onChange={e => setMenuItem(i, 'description', e.target.value)} />
                <input style={inp} placeholder="Pris (t.ex. 135 kr)" value={item.price} onChange={e => setMenuItem(i, 'price', e.target.value)} />
              </div>
            ))}
            <button
              type="button"
              onClick={() => set('menuItems', [...(content.menuItems || []), { name: '', description: '', price: '' }])}
              style={{ padding: '7px 0', fontSize: 12, borderRadius: 7, border: '1px dashed var(--border)', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >+ Lägg till rätt</button>
          </Section>
        )}

        {(demo.template === 'hantverkare' || demo.template === 'verkstad') && content.serviceList && (
          <Section title={`Tjänster (${content.serviceList.length})`}>
            {content.serviceList.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 6 }}>
                <input style={{ ...inp, flex: 1 }} value={s} onChange={e => setServiceListItem(i, e.target.value)} placeholder={`Tjänst ${i + 1}`} />
                <button type="button" onClick={() => set('serviceList', (content.serviceList || []).filter((_, j) => j !== i))} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '0 8px', color: 'var(--text-faint)', cursor: 'pointer' }}>×</button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => set('serviceList', [...(content.serviceList || []), ''])}
              style={{ padding: '7px 0', fontSize: 12, borderRadius: 7, border: '1px dashed var(--border)', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >+ Lägg till tjänst</button>
          </Section>
        )}

        {demo.template === 'tjansteforetag' && content.serviceFeatures && (
          <Section title={`Tjänster / Features (${content.serviceFeatures.length})`}>
            {content.serviceFeatures.map((f, i) => (
              <div key={i} style={{ background: 'var(--bg)', borderRadius: 8, padding: 10, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Feature {i + 1}</span>
                  <button type="button" onClick={() => set('serviceFeatures', (content.serviceFeatures || []).filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', fontSize: 16 }}>×</button>
                </div>
                <input style={inp} placeholder="Titel" value={f.title} onChange={e => setServiceFeature(i, 'title', e.target.value)} />
                <textarea style={{ ...inp, resize: 'vertical', minHeight: 52 }} placeholder="Beskrivning" value={f.description} onChange={e => setServiceFeature(i, 'description', e.target.value)} />
              </div>
            ))}
            <button
              type="button"
              onClick={() => set('serviceFeatures', [...(content.serviceFeatures || []), { title: '', description: '' }])}
              style={{ padding: '7px 0', fontSize: 12, borderRadius: 7, border: '1px dashed var(--border)', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >+ Lägg till feature</button>
          </Section>
        )}

        {demo.template === 'verkstad' && content.brands && (
          <Section title={`Bilmärken (${content.brands.length})`}>
            {content.brands.map((b, i) => (
              <div key={i} style={{ display: 'flex', gap: 6 }}>
                <input style={{ ...inp, flex: 1 }} value={b} onChange={e => setBrand(i, e.target.value)} placeholder={`Märke ${i + 1}`} />
                <button type="button" onClick={() => set('brands', (content.brands || []).filter((_, j) => j !== i))} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '0 8px', color: 'var(--text-faint)', cursor: 'pointer' }}>×</button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => set('brands', [...(content.brands || []), ''])}
              style={{ padding: '7px 0', fontSize: 12, borderRadius: 7, border: '1px dashed var(--border)', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >+ Lägg till märke</button>
          </Section>
        )}

        {demo.template === 'hantverkare' && (
          <Section title="Galleri (bilder)">
            {(content.galleryImages || []).filter(Boolean).map((url, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <img src={url} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                <input style={{ ...inp, flex: 1 }} value={url} onChange={e => {
                  const imgs = [...(content.galleryImages || [])];
                  imgs[i] = e.target.value;
                  set('galleryImages', imgs);
                }} placeholder="Bild-URL" />
                <button type="button" onClick={() => set('galleryImages', (content.galleryImages || []).filter((_, j) => j !== i))} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '0 8px', color: 'var(--text-faint)', cursor: 'pointer' }}>×</button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => set('galleryImages', [...(content.galleryImages || []), ''])}
              style={{ padding: '7px 0', fontSize: 12, borderRadius: 7, border: '1px dashed var(--border)', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >+ Lägg till bild-URL</button>
          </Section>
        )}
      </div>

      {/* ── Right panel: preview ── */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#f0f0f0' }}>
        <div style={{ transform: 'scale(0.75)', transformOrigin: 'top left', width: '133.33%', pointerEvents: 'none' }}>
          {renderTemplate(demo.template, content)}
        </div>
      </div>
    </div>
  );
}
