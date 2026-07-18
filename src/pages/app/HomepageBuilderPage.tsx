import { useEffect, useState } from 'react';
import { AceCard } from '@/components/ace/AceCard';
import { AceButton } from '@/components/ace/AceButton';
import { AceBadge, EmptyState, StatCard } from '@/components/ace/PageShell';
import { useApi } from '../../hooks/useApi';
import { useAppStore } from '../../lib/store';

const SECTION_TYPES = [
  'hero',
  'about',
  'featured_menu',
  'promo',
  'gallery',
  'hours',
  'location',
  'facilities',
  'testimonial',
  'cta',
  'social',
];

export function HomepageBuilderPage() {
  const api = useApi();
  const organizationId = useAppStore((s) => s.organizationId);
  const [pages, setPages] = useState<any[]>([]);
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [selected, setSelected] = useState('');
  const [design, setDesign] = useState({
    primaryColor: '#1a1a1a',
    secondaryColor: '#c4a574',
    font: 'Inter',
  });
  const [seo, setSeo] = useState({ title: '', description: '' });
  const [sections, setSections] = useState<any[]>([
    { type: 'hero', content: { title: '', subtitle: '', imageUrl: '' } },
    { type: 'about', content: { body: '' } },
    { type: 'hours', content: { text: 'Sen–Min 08:00–22:00' } },
    { type: 'location', content: { address: '', mapsUrl: '' } },
    { type: 'facilities', content: { items: 'WiFi, AC, Outdoor' } },
    { type: 'gallery', content: { urls: '' } },
    { type: 'cta', content: { menuLabel: 'Lihat Menu', reservationLabel: 'Reservasi' } },
    { type: 'social', content: { instagram: '', whatsapp: '' } },
  ]);
  const [uploadMsg, setUploadMsg] = useState('');

  async function load() {
    if (!organizationId) return;
    const list = await api<any[]>(`/homepage?organizationId=${organizationId}`);
    setPages(list);
    if (list[0] && !selected) setSelected(list[0].id);
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, [api, organizationId]);

  async function createPage(e: React.FormEvent) {
    e.preventDefault();
    await api('/homepage', {
      method: 'POST',
      body: { organizationId, slug, title },
    });
    setSlug('');
    setTitle('');
    await load();
  }

  async function saveDraft() {
    if (!selected) return;
    await api(`/homepage/${selected}/draft`, {
      method: 'POST',
      body: {
        design: { ...design, seo },
        sections: sections.map((s) => ({
          type: s.type,
          content: s.content,
          visible: s.visible !== false,
        })),
      },
    });
    await load();
  }

  async function publish() {
    if (!selected) return;
    await api(`/homepage/${selected}/publish`, { method: 'POST' });
    await load();
  }

  function updateSection(i: number, content: any) {
    setSections((prev) => prev.map((s, idx) => (idx === i ? { ...s, content } : s)));
  }

  function addSection(type: string) {
    setSections((prev) => [...prev, { type, content: {} }]);
  }

  function moveSection(i: number, dir: -1 | 1) {
    setSections((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>, sectionIndex?: number) {
    const file = e.target.files?.[0];
    if (!file || !organizationId) return;
    setUploadMsg('Uploading…');
    try {
      const sig = await api<any>('/media/sign-upload', {
        method: 'POST',
        body: { organizationId, folder: 'homepage' },
      });
      if (sig.mock || !sig.uploadUrl) {
        setUploadMsg('Cloudinary belum dikonfigurasi (mock). Set CLOUDINARY_* di backend.');
        return;
      }
      const fd = new FormData();
      fd.append('file', file);
      fd.append('api_key', sig.apiKey);
      fd.append('timestamp', String(sig.timestamp));
      fd.append('folder', sig.folder);
      fd.append('signature', sig.signature);
      const up = await fetch(sig.uploadUrl, { method: 'POST', body: fd });
      const data = await up.json();
      if (!up.ok) throw new Error(data.error?.message || 'Upload gagal');
      await api('/media/assets', {
        method: 'POST',
        body: {
          organizationId,
          publicId: data.public_id,
          url: data.secure_url,
          folder: sig.folder,
        },
      });
      if (sectionIndex != null) {
        updateSection(sectionIndex, {
          ...sections[sectionIndex].content,
          imageUrl: data.secure_url,
        });
      }
      setUploadMsg(`OK: ${data.secure_url}`);
    } catch (err: any) {
      setUploadMsg(err.message || 'Gagal upload');
    }
    e.target.value = '';
  }

  return (
    <div className="animate-float-up" data-ace="1">
      <h1 className="text-2xl font-bold">Homepage builder</h1>
      {!organizationId && <p className="mt-4 text-[var(--muted)]">Pilih tenant di dashboard dulu.</p>}

      <form className="rounded-2xl border border-[#e8e4de] bg-white p-4 shadow-sm mt-6 max-w-md space-y-2" onSubmit={createPage}>
        <h2 className="font-semibold">Halaman baru</h2>
        <input
          className="input"
          placeholder="slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
        />
        <input
          className="input"
          placeholder="Judul"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button className="inline-flex items-center justify-center rounded-xl bg-[#1a1a1a] px-4 py-2.5 text-sm font-semibold text-white" type="submit" disabled={!organizationId}>
          Buat
        </button>
      </form>

      <div className="mt-6 max-w-md">
        <label className="label">Pilih halaman</label>
        <select className="input" value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="">—</option>
          {pages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.slug} {p.publishedVersionId ? '(published)' : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-2xl border border-[#e8e4de] bg-white p-4 shadow-sm mt-4 max-w-xl space-y-2">
        <h2 className="font-semibold">Desain & SEO</h2>
        <div className="grid grid-cols-2 gap-2">
          <input
            className="input"
            type="color"
            value={design.primaryColor}
            onChange={(e) => setDesign({ ...design, primaryColor: e.target.value })}
          />
          <input
            className="input"
            type="color"
            value={design.secondaryColor}
            onChange={(e) => setDesign({ ...design, secondaryColor: e.target.value })}
          />
        </div>
        <input
          className="input"
          placeholder="SEO title"
          value={seo.title}
          onChange={(e) => setSeo({ ...seo, title: e.target.value })}
        />
        <input
          className="input"
          placeholder="SEO description"
          value={seo.description}
          onChange={(e) => setSeo({ ...seo, description: e.target.value })}
        />
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <select
            className="input max-w-xs"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) {
                addSection(e.target.value);
                e.target.value = '';
              }
            }}
          >
            <option value="">+ Section</option>
            {SECTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {sections.map((s, i) => (
          <div key={i} className="rounded-2xl border border-[#e8e4de] bg-white p-4 shadow-sm max-w-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{s.type}</span>
              <div className="flex gap-1">
                <button type="button" className="inline-flex items-center justify-center rounded-xl border border-[#d4d0c8] px-4 py-2.5 text-sm font-semibold !py-1 text-xs" onClick={() => moveSection(i, -1)}>
                  ↑
                </button>
                <button type="button" className="inline-flex items-center justify-center rounded-xl border border-[#d4d0c8] px-4 py-2.5 text-sm font-semibold !py-1 text-xs" onClick={() => moveSection(i, 1)}>
                  ↓
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-xl border border-[#d4d0c8] px-4 py-2.5 text-sm font-semibold !py-1 text-xs"
                  onClick={() => setSections((prev) => prev.filter((_, j) => j !== i))}
                >
                  Hapus
                </button>
              </div>
            </div>
            {s.type === 'hero' && (
              <>
                <input
                  className="input"
                  placeholder="Title"
                  value={s.content.title || ''}
                  onChange={(e) => updateSection(i, { ...s.content, title: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="Subtitle"
                  value={s.content.subtitle || ''}
                  onChange={(e) => updateSection(i, { ...s.content, subtitle: e.target.value })}
                />
                <label className="inline-flex items-center justify-center rounded-xl border border-[#d4d0c8] px-4 py-2.5 text-sm font-semibold cursor-pointer text-sm">
                  Upload hero image
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e, i)} />
                </label>
                {s.content.imageUrl && (
                  <img src={s.content.imageUrl} alt="" className="h-24 rounded object-cover" />
                )}
              </>
            )}
            {s.type === 'about' && (
              <textarea
                className="input min-h-24"
                placeholder="About"
                value={s.content.body || ''}
                onChange={(e) => updateSection(i, { ...s.content, body: e.target.value })}
              />
            )}
            {s.type === 'hours' && (
              <input
                className="input"
                value={s.content.text || ''}
                onChange={(e) => updateSection(i, { ...s.content, text: e.target.value })}
              />
            )}
            {s.type === 'location' && (
              <>
                <input
                  className="input"
                  placeholder="Alamat"
                  value={s.content.address || ''}
                  onChange={(e) => updateSection(i, { ...s.content, address: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="Google Maps URL"
                  value={s.content.mapsUrl || ''}
                  onChange={(e) => updateSection(i, { ...s.content, mapsUrl: e.target.value })}
                />
              </>
            )}
            {s.type === 'facilities' && (
              <input
                className="input"
                placeholder="WiFi, AC, …"
                value={s.content.items || ''}
                onChange={(e) => updateSection(i, { ...s.content, items: e.target.value })}
              />
            )}
            {s.type === 'gallery' && (
              <input
                className="input"
                placeholder="URL gambar, pisah koma"
                value={s.content.urls || ''}
                onChange={(e) => updateSection(i, { ...s.content, urls: e.target.value })}
              />
            )}
            {s.type === 'testimonial' && (
              <textarea
                className="input min-h-16"
                placeholder="Kutipan testimonial"
                value={s.content.quote || ''}
                onChange={(e) => updateSection(i, { ...s.content, quote: e.target.value })}
              />
            )}
            {s.type === 'cta' && (
              <>
                <input
                  className="input"
                  placeholder="Label menu"
                  value={s.content.menuLabel || ''}
                  onChange={(e) => updateSection(i, { ...s.content, menuLabel: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="Label reservasi"
                  value={s.content.reservationLabel || ''}
                  onChange={(e) => updateSection(i, { ...s.content, reservationLabel: e.target.value })}
                />
              </>
            )}
            {s.type === 'social' && (
              <>
                <input
                  className="input"
                  placeholder="Instagram URL"
                  value={s.content.instagram || ''}
                  onChange={(e) => updateSection(i, { ...s.content, instagram: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="WhatsApp"
                  value={s.content.whatsapp || ''}
                  onChange={(e) => updateSection(i, { ...s.content, whatsapp: e.target.value })}
                />
              </>
            )}
            {['featured_menu', 'promo'].includes(s.type) && (
              <p className="text-xs text-[var(--muted)]">Ditampilkan dari data menu/promo aktif saat publish.</p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button className="inline-flex items-center justify-center rounded-xl bg-[#c4a574] px-4 py-2.5 text-sm font-semibold text-[#1a1a1a]" type="button" onClick={saveDraft} disabled={!selected}>
          Simpan draft
        </button>
        <button className="inline-flex items-center justify-center rounded-xl bg-[#1a1a1a] px-4 py-2.5 text-sm font-semibold text-white" type="button" onClick={publish} disabled={!selected}>
          Publish
        </button>
        <label className="inline-flex items-center justify-center rounded-xl border border-[#d4d0c8] px-4 py-2.5 text-sm font-semibold cursor-pointer">
          Upload media
          <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e)} />
        </label>
      </div>
      {uploadMsg && <p className="mt-2 break-all text-xs text-[var(--muted)]">{uploadMsg}</p>}

      {selected && (
        <p className="mt-4 text-sm text-[var(--muted)]">
          Public:{' '}
          <a className="underline" href={`/c/${pages.find((p) => p.id === selected)?.slug}`}>
            /c/{pages.find((p) => p.id === selected)?.slug}
          </a>
        </p>
      )}
    </div>
  );
}
