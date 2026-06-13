'use client';

import { useState, useEffect, useCallback, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { DemoContent, TemplateId, MenuItem, ServiceFeature } from '@/app/templates/types';

const RestaurangTemplate = dynamic(() => import('@/app/templates/RestaurangTemplate'), { ssr: false });
const HantverkareTemplate = dynamic(() => import('@/app/templates/HantverkareTemplate'), { ssr: false });
const TjansteforetagTemplate = dynamic(() => import('@/app/templates/TjansteforetagTemplate'), { ssr: false });
const VerkstadTemplate = dynamic(() => import('@/app/templates/VerkstadTemplate'), { ssr: false });

interface EditProps {
  editMode: boolean;
  selectedSection: string | null;
  onSectionClick: (id: string) => void;
}

function renderTemplate(template: TemplateId, content: DemoContent, editProps: EditProps) {
  switch (template) {
    case 'restaurang': return <RestaurangTemplate content={content} {...editProps} />;
    case 'hantverkare': return <HantverkareTemplate content={content} {...editProps} />;
    case 'tjansteforetag': return <TjansteforetagTemplate content={content} {...editProps} />;
    case 'verkstad': return <VerkstadTemplate content={content} {...editProps} />;
  }
}

// ── Section definitions per template ────────────────────────
type SectionDef = { id: string; label: string; icon: string };

const TEMPLATE_SECTIONS: Record<TemplateId, SectionDef[]> = {
  verkstad: [
    { id: 'header', label: 'Header & Logo', icon: '▪' },
    { id: 'hero', label: 'Hero', icon: '◆' },
    { id: 'services', label: 'Tjänster', icon: '≡' },
    { id: 'offers', label: 'Erbjudanden', icon: '◇' },
    { id: 'contact', label: 'Kontakt & öppettider', icon: '○' },
    { id: 'brands', label: 'Märken', icon: '◈' },
  ],
  restaurang: [
    { id: 'hero', label: 'Hero & Logo', icon: '◆' },
    { id: 'about', label: 'Om oss', icon: '◦' },
    { id: 'menu', label: 'Meny', icon: '≡' },
    { id: 'contact', label: 'Kontakt & öppettider', icon: '○' },
  ],
  hantverkare: [
    { id: 'header', label: 'Header & Logo', icon: '▪' },
    { id: 'hero', label: 'Hero', icon: '◆' },
    { id: 'services', label: 'Tjänster', icon: '≡' },
    { id: 'contact', label: 'Kontakt', icon: '○' },
  ],
  tjansteforetag: [
    { id: 'header', label: 'Header & Logo', icon: '▪' },
    { id: 'hero', label: 'Hero', icon: '◆' },
    { id: 'services', label: 'Tjänster', icon: '≡' },
    { id: 'cta', label: 'Kontakt-sektion', icon: '→' },
  ],
};

// ── Shared input style ────────────────────────────────────────
const inp: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '7px 10px', fontSize: 13,
  border: '1px solid var(--border)', borderRadius: 8,
  background: 'var(--bg)', color: 'var(--text)', outline: 'none',
};

// ── Field row ────────────────────────────────────────────────
function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</label>
      {children}
    </div>
  );
}

// ── AI button ────────────────────────────────────────────────
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
      <button type="button" onClick={() => setOpen(o => !o)} title="Förbättra med AI" style={{
        width: 26, height: 26, borderRadius: 6,
        border: '1px solid var(--border)',
        background: open ? 'var(--accent-soft)' : 'var(--bg)',
        color: open ? 'var(--accent)' : 'var(--text-muted)',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14,
      }}>✦</button>
      {open && (
        <div style={{
          position: 'absolute', top: 32, right: 0, zIndex: 50,
          background: 'var(--bg)', border: '1px solid var(--border)',
          borderRadius: 10, padding: 14, width: 260, boxShadow: 'var(--shadow-lg)',
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Beskriv vad du vill ändra</div>
          <textarea
            value={instruction}
            onChange={e => setInstruction(e.target.value)}
            placeholder="t.ex. Gör det mer säljande och kortare"
            rows={2}
            style={{ width: '100%', boxSizing: 'border-box', padding: '7px 9px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 7, background: 'var(--bg-subtle)', color: 'var(--text)', resize: 'none', outline: 'none' }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="button" onClick={() => setOpen(false)} style={{ flex: 1, padding: '7px 0', fontSize: 12, borderRadius: 7, border: '1px solid var(--border)', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>Avbryt</button>
            <button type="button" onClick={run} disabled={loading || !instruction.trim()} style={{ flex: 1, padding: '7px 0', fontSize: 12, fontWeight: 600, borderRadius: 7, border: 'none', background: 'var(--accent)', color: '#fff', cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1 }}>{loading ? '...' : 'Generera'}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Image uploader ────────────────────────────────────────────
function ImageUpload({ label, value, demoId, onChange }: {
  label: string; value: string | null; demoId: string; onChange: (url: string | null) => void;
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
      if (data.url) onChange(data.url);
      else setError(data.error || `Fel ${res.status}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nätverksfel');
    } finally { setUploading(false); e.target.value = ''; }
  };

  return (
    <FieldRow label={label}>
      <div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {value && <img src={value} alt="" style={{ height: 40, width: 60, objectFit: 'contain', borderRadius: 6, border: '1px solid var(--border)', background: '#f0f0f0' }} />}
          <label style={{ padding: '7px 12px', fontSize: 12, fontWeight: 500, borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--text-muted)', cursor: uploading ? 'default' : 'pointer', flexShrink: 0 }}>
            {uploading ? 'Laddar upp...' : value ? 'Byt bild' : 'Välj bild'}
            <input type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} disabled={uploading} />
          </label>
          {value && (
            <button type="button" onClick={() => onChange(null)} style={{ background: 'none', border: '1px solid var(--red-border)', color: 'var(--red)', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>Ta bort</button>
          )}
        </div>
        {error && <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 4 }}>⚠ {error}</div>}
      </div>
    </FieldRow>
  );
}

// ── Gallery image uploader ────────────────────────────────────
function GalleryUploadButton({ demoId, onAdd }: { demoId: string; onAdd: (url: string) => void }) {
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
      if (data.url) onAdd(data.url);
      else setError(data.error || `Fel ${res.status}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nätverksfel');
    } finally { setUploading(false); e.target.value = ''; }
  };

  return (
    <div>
      <label style={{ display: 'block', padding: '7px 0', fontSize: 12, borderRadius: 7, border: '1px dashed var(--border)', background: 'none', color: 'var(--text-muted)', cursor: uploading ? 'default' : 'pointer', textAlign: 'center' }}>
        {uploading ? 'Laddar upp...' : '+ Lägg till bild'}
        <input type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} disabled={uploading} />
      </label>
      {error && <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 4 }}>⚠ {error}</div>}
    </div>
  );
}

// ── Section background upload ─────────────────────────────────
function SectionBgUpload({ sectionId, content, set, demoId }: {
  sectionId: string;
  content: DemoContent;
  set: <K extends keyof DemoContent>(k: K, v: DemoContent[K]) => void;
  demoId: string;
}) {
  const current = content.sectionBackgrounds?.[sectionId] ?? null;
  const update = (url: string | null) => {
    const next = { ...(content.sectionBackgrounds ?? {}) };
    if (url) next[sectionId] = url;
    else delete next[sectionId];
    set('sectionBackgrounds', next);
  };
  return (
    <div style={{ paddingTop: 4, borderTop: '1px solid var(--border)', marginTop: 4 }}>
      <ImageUpload label="Bakgrundsbild (sektion)" value={current} demoId={demoId} onChange={update} />
    </div>
  );
}

// ── Section controls ──────────────────────────────────────────
function SectionControls({
  section, template, content, set, demoId,
}: {
  section: string;
  template: TemplateId;
  content: DemoContent;
  set: <K extends keyof DemoContent>(k: K, v: DemoContent[K]) => void;
  demoId: string;
}) {
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

  switch (section) {
    case 'header':
      return (
        <>
          <ImageUpload label="Logo" value={content.logoUrl} demoId={demoId} onChange={v => set('logoUrl', v)} />
          {content.logoUrl && (
            <>
              <FieldRow label={`Logostorlek — ${content.logoHeight ?? 40}px`}>
                <input type="range" min={20} max={120} step={2} value={content.logoHeight ?? 40} onChange={e => set('logoHeight', Number(e.target.value))} style={{ width: '100%', cursor: 'pointer' }} />
              </FieldRow>
              <FieldRow label="Visa företagsnamn bredvid loggan">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text)' }}>
                  <input type="checkbox" checked={content.showBusinessName !== false} onChange={e => set('showBusinessName', e.target.checked)} />
                  {content.showBusinessName !== false ? 'Visas' : 'Dolt'}
                </label>
              </FieldRow>
            </>
          )}
          <FieldRow label="Företagsnamn">
            <div style={{ display: 'flex', gap: 6 }}>
              <input style={inp} value={content.businessName} onChange={e => set('businessName', e.target.value)} />
              <AIButton field="businessName" value={content.businessName} template={template} businessName={content.businessName} onResult={v => set('businessName', v)} />
            </div>
          </FieldRow>
          <SectionBgUpload sectionId="header" content={content} set={set} demoId={demoId} />
        </>
      );

    case 'hero':
      return (
        <>
          <ImageUpload label="Huvudbild (hero)" value={content.heroImageUrl} demoId={demoId} onChange={v => set('heroImageUrl', v)} />
          {template === 'restaurang' && (
            <>
              <ImageUpload label="Logo" value={content.logoUrl} demoId={demoId} onChange={v => set('logoUrl', v)} />
              {content.logoUrl && (
                <FieldRow label={`Logostorlek — ${content.logoHeight ?? 56}px`}>
                  <input
                    type="range" min={20} max={120} step={2}
                    value={content.logoHeight ?? 56}
                    onChange={e => set('logoHeight', Number(e.target.value))}
                    style={{ width: '100%', cursor: 'pointer' }}
                  />
                </FieldRow>
              )}
            </>
          )}
          <FieldRow label="Företagsnamn">
            <div style={{ display: 'flex', gap: 6 }}>
              <input style={inp} value={content.businessName} onChange={e => set('businessName', e.target.value)} />
              <AIButton field="businessName" value={content.businessName} template={template} businessName={content.businessName} onResult={v => set('businessName', v)} />
            </div>
          </FieldRow>
          <FieldRow label="Tagline / Slogan">
            <div style={{ display: 'flex', gap: 6 }}>
              <input style={inp} value={content.tagline} onChange={e => set('tagline', e.target.value)} />
              <AIButton field="tagline" value={content.tagline} template={template} businessName={content.businessName} onResult={v => set('tagline', v)} />
            </div>
          </FieldRow>
          {template !== 'verkstad' && (
            <FieldRow label="Beskrivning">
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                <textarea style={{ ...inp, resize: 'vertical', minHeight: 72 }} value={content.description} onChange={e => set('description', e.target.value)} />
                <AIButton field="description" value={content.description} template={template} businessName={content.businessName} onResult={v => set('description', v)} />
              </div>
            </FieldRow>
          )}
          <SectionBgUpload sectionId="hero" content={content} set={set} demoId={demoId} />
        </>
      );

    case 'about':
      return (
        <>
          <FieldRow label="Beskrivning">
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
              <textarea style={{ ...inp, resize: 'vertical', minHeight: 100 }} value={content.description} onChange={e => set('description', e.target.value)} />
              <AIButton field="description" value={content.description} template={template} businessName={content.businessName} onResult={v => set('description', v)} />
            </div>
          </FieldRow>
          <SectionBgUpload sectionId="about" content={content} set={set} demoId={demoId} />
        </>
      );

    case 'services':
      if (template === 'tjansteforetag') {
        return (
          <>
            {(content.serviceFeatures || []).map((f, i) => (
              <div key={i} style={{ background: 'var(--bg)', borderRadius: 8, padding: 10, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Tjänst {i + 1}</span>
                  <button type="button" onClick={() => set('serviceFeatures', (content.serviceFeatures || []).filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', fontSize: 16 }}>×</button>
                </div>
                <input style={inp} placeholder="Titel" value={f.title} onChange={e => setServiceFeature(i, 'title', e.target.value)} />
                <textarea style={{ ...inp, resize: 'vertical', minHeight: 52 }} placeholder="Beskrivning" value={f.description} onChange={e => setServiceFeature(i, 'description', e.target.value)} />
              </div>
            ))}
            <button type="button" onClick={() => set('serviceFeatures', [...(content.serviceFeatures || []), { title: '', description: '' }])} style={{ padding: '7px 0', fontSize: 12, borderRadius: 7, border: '1px dashed var(--border)', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              + Lägg till tjänst
            </button>
            <SectionBgUpload sectionId="services" content={content} set={set} demoId={demoId} />
          </>
        );
      }
      if (template === 'verkstad') {
        return (
          <>
            <FieldRow label="Beskrivning">
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                <textarea style={{ ...inp, resize: 'vertical', minHeight: 72 }} value={content.description} onChange={e => set('description', e.target.value)} />
                <AIButton field="description" value={content.description} template={template} businessName={content.businessName} onResult={v => set('description', v)} />
              </div>
            </FieldRow>
            <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
            {(content.serviceList || []).map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 6 }}>
                <input style={{ ...inp, flex: 1 }} value={s} onChange={e => setServiceListItem(i, e.target.value)} placeholder={`Tjänst ${i + 1}`} />
                <button type="button" onClick={() => set('serviceList', (content.serviceList || []).filter((_, j) => j !== i))} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '0 8px', color: 'var(--text-faint)', cursor: 'pointer' }}>×</button>
              </div>
            ))}
            <button type="button" onClick={() => set('serviceList', [...(content.serviceList || []), ''])} style={{ padding: '7px 0', fontSize: 12, borderRadius: 7, border: '1px dashed var(--border)', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              + Lägg till tjänst
            </button>
            <SectionBgUpload sectionId="services" content={content} set={set} demoId={demoId} />
          </>
        );
      }
      // hantverkare
      return (
        <>
          {(content.serviceList || []).map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 6 }}>
              <input style={{ ...inp, flex: 1 }} value={s} onChange={e => setServiceListItem(i, e.target.value)} placeholder={`Tjänst ${i + 1}`} />
              <button type="button" onClick={() => set('serviceList', (content.serviceList || []).filter((_, j) => j !== i))} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '0 8px', color: 'var(--text-faint)', cursor: 'pointer' }}>×</button>
            </div>
          ))}
          <button type="button" onClick={() => set('serviceList', [...(content.serviceList || []), ''])} style={{ padding: '7px 0', fontSize: 12, borderRadius: 7, border: '1px dashed var(--border)', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            + Lägg till tjänst
          </button>
          <SectionBgUpload sectionId="services" content={content} set={set} demoId={demoId} />
        </>
      );

    case 'menu':
      return (
        <>
          {(content.menuItems || []).map((item, i) => (
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
          <button type="button" onClick={() => set('menuItems', [...(content.menuItems || []), { name: '', description: '', price: '' }])} style={{ padding: '7px 0', fontSize: 12, borderRadius: 7, border: '1px dashed var(--border)', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            + Lägg till rätt
          </button>
          <SectionBgUpload sectionId="menu" content={content} set={set} demoId={demoId} />
        </>
      );

    case 'gallery':
      return (
        <>
          {(content.galleryImages || []).filter(Boolean).length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
              {(content.galleryImages || []).filter(Boolean).map((url, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={url} alt="" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 6, display: 'block' }} />
                  <button
                    type="button"
                    onClick={() => set('galleryImages', (content.galleryImages || []).filter((_, j) => j !== i))}
                    style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >×</button>
                </div>
              ))}
            </div>
          )}
          <GalleryUploadButton demoId={demoId} onAdd={url => set('galleryImages', [...(content.galleryImages || []), url])} />
        </>
      );

    case 'brands':
      return (
        <>
          {(content.brands || []).map((b, i) => (
            <div key={i} style={{ display: 'flex', gap: 6 }}>
              <input style={{ ...inp, flex: 1 }} value={b} onChange={e => setBrand(i, e.target.value)} placeholder={`Märke ${i + 1}`} />
              <button type="button" onClick={() => set('brands', (content.brands || []).filter((_, j) => j !== i))} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '0 8px', color: 'var(--text-faint)', cursor: 'pointer' }}>×</button>
            </div>
          ))}
          <button type="button" onClick={() => set('brands', [...(content.brands || []), ''])} style={{ padding: '7px 0', fontSize: 12, borderRadius: 7, border: '1px dashed var(--border)', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            + Lägg till märke
          </button>
          <SectionBgUpload sectionId="brands" content={content} set={set} demoId={demoId} />
        </>
      );

    case 'contact':
      return (
        <>
          <FieldRow label="Telefon">
            <input style={inp} value={content.phone} onChange={e => set('phone', e.target.value)} />
          </FieldRow>
          <FieldRow label="E-post">
            <input style={inp} value={content.email} onChange={e => set('email', e.target.value)} />
          </FieldRow>
          <FieldRow label="Adress">
            <input style={inp} value={content.address} onChange={e => set('address', e.target.value)} />
          </FieldRow>
          {(template === 'restaurang' || template === 'verkstad') && (
            <FieldRow label="Öppettider">
              <div style={{ display: 'flex', gap: 6 }}>
                <textarea style={{ ...inp, resize: 'vertical', minHeight: 80 }} value={content.openingHours || ''} onChange={e => set('openingHours', e.target.value)} />
                <AIButton field="openingHours" value={content.openingHours || ''} template={template} businessName={content.businessName} onResult={v => set('openingHours', v)} />
              </div>
            </FieldRow>
          )}
          <SectionBgUpload sectionId="contact" content={content} set={set} demoId={demoId} />
        </>
      );

    case 'offers':
      return (
        <>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Erbjudandena visas automatiskt baserat på dina tjänster och priser.
          </p>
          <SectionBgUpload sectionId="offers" content={content} set={set} demoId={demoId} />
        </>
      );

    case 'cta':
      return (
        <>
          <FieldRow label="Telefon">
            <input style={inp} value={content.phone} onChange={e => set('phone', e.target.value)} />
          </FieldRow>
          <FieldRow label="E-post">
            <input style={inp} value={content.email} onChange={e => set('email', e.target.value)} />
          </FieldRow>
          <SectionBgUpload sectionId="cta" content={content} set={set} demoId={demoId} />
        </>
      );

    default:
      return null;
  }
}

// ── Section label lookup ──────────────────────────────────────
const SECTION_LABELS: Record<string, string> = {
  header: 'Header & Logo', hero: 'Hero', services: 'Tjänster', offers: 'Erbjudanden',
  contact: 'Kontakt', brands: 'Märken', about: 'Om oss', menu: 'Meny',
  gallery: 'Galleri', cta: 'Kontakt-sektion',
};

// ── Main builder ──────────────────────────────────────────────
export default function EditDemoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [demo, setDemo] = useState<{ id: string; name: string; template: TemplateId; content: DemoContent; slug: string; published: boolean } | null>(null);
  const [content, setContent] = useState<DemoContent | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [showAddSection, setShowAddSection] = useState(false);
  const savedContentRef = useRef<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch(`/api/demos/${id}`)
      .then(r => r.json())
      .then(d => {
        setDemo(d);
        setContent(d.content as DemoContent);
        savedContentRef.current = JSON.stringify(d.content);
      });
  }, [id]);

  const set = useCallback(<K extends keyof DemoContent>(key: K, value: DemoContent[K]) => {
    setContent(c => c ? { ...c, [key]: value } : c);
  }, []);

  const doSave = useCallback(async (c: DemoContent) => {
    setSaving(true);
    await fetch(`/api/demos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: c }),
    });
    savedContentRef.current = JSON.stringify(c);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [id]);

  useEffect(() => {
    if (!content) return;
    const str = JSON.stringify(content);
    if (str === savedContentRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => doSave(content), 1500);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [content, doSave]);

  const save = () => {
    if (!content) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    doSave(content);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.origin + previewUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
  const sections = TEMPLATE_SECTIONS[demo.template];
  const hasGallery = content.galleryImages !== undefined && content.galleryImages !== null;

  const editProps: EditProps = {
    editMode: true,
    selectedSection,
    onSectionClick: (id: string) => setSelectedSection(id),
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* ── Left panel ── */}
      <div style={{ width: 300, flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--bg-subtle)' }}>

        {/* Top bar */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button onClick={() => router.push('/demos')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px 6px', fontSize: 18 }}>←</button>
          <div style={{ flex: 1, fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{demo.name}</div>
          <button onClick={save} disabled={saving} style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, borderRadius: 7, border: 'none', background: saved ? '#16a34a' : 'var(--accent)', color: '#fff', cursor: saving ? 'default' : 'pointer', flexShrink: 0 }}>
            {saved ? '✓ Sparat' : saving ? '...' : 'Spara'}
          </button>
        </div>

        {/* Publish row */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 6, flexShrink: 0 }}>
          <a href={previewUrl} target="_blank" rel="noopener noreferrer" style={{ padding: '7px 10px', fontSize: 12, fontWeight: 500, border: '1px solid var(--border)', borderRadius: 7, textDecoration: 'none', color: 'var(--text-muted)', background: 'var(--bg)', whiteSpace: 'nowrap' }}>↗</a>
          <button onClick={copyLink} style={{ padding: '7px 10px', fontSize: 12, fontWeight: 500, borderRadius: 7, border: '1px solid var(--border)', background: copied ? '#dcfce7' : 'var(--bg)', color: copied ? '#15803d' : 'var(--text-muted)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {copied ? '✓' : '🔗'}
          </button>
          <button onClick={togglePublish} disabled={publishing} style={{ flex: 1, padding: '7px 0', fontSize: 12, fontWeight: 600, borderRadius: 7, border: 'none', cursor: publishing ? 'default' : 'pointer', background: demo.published ? '#dcfce7' : 'var(--accent)', color: demo.published ? '#15803d' : '#fff', whiteSpace: 'nowrap' }}>
            {demo.published ? '✓ Publicerad' : 'Publicera'}
          </button>
        </div>

        {/* Color + device toggle */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <input type="color" value={content.primaryColor} onChange={e => set('primaryColor', e.target.value)} style={{ width: 28, height: 28, border: '1px solid var(--border)', borderRadius: 6, padding: 2, cursor: 'pointer', background: 'none', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1 }}>Accentfärg</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['desktop', 'mobile'] as const).map(d => (
              <button key={d} onClick={() => setPreviewDevice(d)} style={{ padding: '4px 8px', fontSize: 11, borderRadius: 5, border: 'none', cursor: 'pointer', background: previewDevice === d ? '#1a1a1a' : 'transparent', color: previewDevice === d ? 'white' : 'var(--text-muted)' }}>
                {d === 'desktop' ? '🖥' : '📱'}
              </button>
            ))}
          </div>
        </div>

        {/* Section panel (scrollable) */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {selectedSection === null ? (
            /* ── Section list ── */
            <>
              <div style={{ padding: '12px 16px 4px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Sektioner
              </div>
              {sections.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedSection(s.id)}
                  style={{
                    width: '100%', padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 10,
                    background: 'none', border: 'none', borderBottom: '1px solid var(--border)',
                    cursor: 'pointer', textAlign: 'left', color: 'var(--text)',
                    fontSize: 13, fontWeight: 500,
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <span style={{ fontSize: 16 }}>{s.icon}</span>
                  <span style={{ flex: 1 }}>{s.label}</span>
                  <span style={{ color: 'var(--text-faint)', fontSize: 12 }}>›</span>
                </button>
              ))}

              {/* Gallery section (if active) */}
              {hasGallery && (
                <button
                  type="button"
                  onClick={() => setSelectedSection('gallery')}
                  style={{ width: '100%', padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left', color: 'var(--text)', fontSize: 13, fontWeight: 500 }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <span style={{ fontSize: 16 }}>▦</span>
                  <span style={{ flex: 1 }}>Galleri</span>
                  <span style={{ color: 'var(--text-faint)', fontSize: 12 }}>›</span>
                </button>
              )}

              {/* Add section */}
              <div style={{ padding: '12px 16px' }}>
                {!showAddSection ? (
                  <button
                    type="button"
                    onClick={() => setShowAddSection(true)}
                    style={{ width: '100%', padding: '8px 0', fontSize: 12, borderRadius: 7, border: '1px dashed var(--border)', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    + Lägg till sektion
                  </button>
                ) : (
                  <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Välj sektion att lägga till</div>
                    {!hasGallery && (
                      <button
                        type="button"
                        onClick={() => { set('galleryImages', []); setShowAddSection(false); setSelectedSection('gallery'); }}
                        style={{ width: '100%', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left', fontSize: 13 }}
                      >
                        <span>📷</span> Galleri
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowAddSection(false)}
                      style={{ width: '100%', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)' }}
                    >
                      Avbryt
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* ── Section detail ── */
            <>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => setSelectedSection(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18, padding: '2px 4px', lineHeight: 1 }}
                >
                  ←
                </button>
                <span style={{ fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {SECTION_LABELS[selectedSection] ?? selectedSection}
                </span>

                {/* Remove gallery option */}
                {selectedSection === 'gallery' && (
                  <button
                    type="button"
                    onClick={() => { set('galleryImages', undefined); setSelectedSection(null); }}
                    style={{ marginLeft: 'auto', background: 'none', border: '1px solid var(--red-border)', color: 'var(--red)', borderRadius: 6, padding: '3px 8px', fontSize: 11, cursor: 'pointer' }}
                  >
                    Ta bort
                  </button>
                )}
              </div>
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <SectionControls
                  section={selectedSection}
                  template={demo.template}
                  content={content}
                  set={set}
                  demoId={id}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Right panel: preview ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: previewDevice === 'mobile' ? '#d1d5db' : '#f0f0f0' }}>
        {previewDevice === 'desktop' ? (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ transform: 'scale(0.75)', transformOrigin: 'top left', width: '133.33%' }}>
              {renderTemplate(demo.template, content, editProps)}
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center', padding: '32px 24px' }}>
            <div style={{ width: 390, flexShrink: 0, border: '10px solid #1a1a1a', borderRadius: 44, overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.4)', background: 'white' }}>
              <div style={{ width: 1280, zoom: 0.305 } as React.CSSProperties}>
                {renderTemplate(demo.template, content, editProps)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
