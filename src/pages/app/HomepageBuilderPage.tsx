import { useEffect, useState } from 'react';
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

const DEFAULT_DESIGN = {
  primaryColor: '#1a1a1a',
  secondaryColor: '#c4a574',
  font: 'Inter',
};

const DEFAULT_SECTIONS = [
  { type: 'hero', content: { title: '', subtitle: '', imageUrl: '' } },
  { type: 'about', content: { body: '' } },
  { type: 'hours', content: { text: 'Sen-Min 08:00-22:00' } },
  { type: 'location', content: { address: '', mapsUrl: '' } },
  { type: 'facilities', content: { items: 'WiFi, AC, Outdoor' } },
  { type: 'gallery', content: { urls: '' } },
  { type: 'cta', content: { menuLabel: 'Lihat Menu', reservationLabel: 'Reservasi' } },
  { type: 'social', content: { instagram: '', whatsapp: '' } },
];

export function HomepageBuilderPage() {
  const api = useApi();
  const organizationId = useAppStore((s) => s.organizationId);
  const [pages, setPages] = useState<any[]>([]);
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [selected, setSelected] = useState('');
  const [design, setDesign] = useState(DEFAULT_DESIGN);
  const [seo, setSeo] = useState({ title: '', description: '' });
  const [sections, setSections] = useState<any[]>(DEFAULT_SECTIONS);
  const [uploadMsg, setUploadMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [previewMobile, setPreviewMobile] = useState(false);

  async function load() {
    if (!organizationId) return;
    setLoading(true);
    try {
      const list = await api<any[]>(`/homepage?organizationId=${organizationId}`);
      setPages(list);
      setSelected((current) => (list.some((page) => page.id === current) ? current : list[0]?.id || ''));
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Gagal memuat homepage.' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [api, organizationId]);

  useEffect(() => {
    const page = pages.find((item) => item.id === selected);
    if (!page) return;
    const version = page.versions?.[0];
    const savedDesign = version?.design || {};
    setDesign({ ...DEFAULT_DESIGN, ...savedDesign });
    setSeo({
      title: page.seoTitle || savedDesign.seo?.title || '',
      description: page.seoDescription || savedDesign.seo?.description || '',
    });
    setSections(version?.sections?.length ? version.sections : DEFAULT_SECTIONS);
    setDirty(false);
    setMessage(null);
  }, [pages, selected]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function edit(action: () => void) {
    action();
    setDirty(true);
    setMessage(null);
  }

  async function createPage(e: React.FormEvent) {
    e.preventDefault();
    setBusy('create');
    setMessage(null);
    try {
      const created = await api<any>('/homepage', {
        method: 'POST',
        body: { organizationId, slug, title },
      });
      setSlug('');
      setTitle('');
      setSelected(created.id);
      await load();
      setMessage({ type: 'success', text: 'Halaman dibuat.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Gagal membuat halaman.' });
    } finally {
      setBusy('');
    }
  }

  async function saveDraft(showSuccess = true) {
    if (!selected) return false;
    setBusy('save');
    setMessage(null);
    try {
      await api(`/homepage/${selected}/draft`, {
      method: 'POST',
      body: {
        design,
        seo,
        sections: sections.map((s) => ({
          type: s.type,
          content: s.content,
          visible: s.visible !== false,
        })),
      },
      });
      setDirty(false);
      await load();
      if (showSuccess) setMessage({ type: 'success', text: 'Draft tersimpan.' });
      return true;
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Gagal menyimpan draft.' });
      return false;
    } finally {
      setBusy('');
    }
  }

  async function publish() {
    if (!selected) return;
    if (dirty && !(await saveDraft(false))) return;
    setBusy('publish');
    setMessage(null);
    try {
      await api(`/homepage/${selected}/publish`, { method: 'POST' });
      await load();
      setMessage({ type: 'success', text: 'Homepage dipublikasikan.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Gagal publish.' });
    } finally {
      setBusy('');
    }
  }

  function updateSection(i: number, content: any) {
    edit(() => setSections((prev) => prev.map((s, idx) => (idx === i ? { ...s, content } : s))));
  }

  function addSection(type: string) {
    edit(() => setSections((prev) => [...prev, { type, content: {} }]));
  }

  function moveSection(i: number, dir: -1 | 1) {
    edit(() => setSections((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    }));
  }

  function selectPage(id: string) {
    if (dirty && !window.confirm('Perubahan belum disimpan. Ganti halaman dan buang perubahan?')) return;
    setSelected(id);
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
      {message && (
        <p role="status" className={`mt-4 rounded-xl border px-4 py-3 text-sm ${message.type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>
          {message.text}
        </p>
      )}

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
        <button className="inline-flex items-center justify-center rounded-xl bg-[#1a1a1a] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50" type="submit" disabled={!organizationId || !!busy}>
          {busy === 'create' ? 'Membuat...' : 'Buat'}
        </button>
      </form>

      <div className="mt-6 max-w-md">
        <label className="label">Pilih halaman</label>
        <select className="input" value={selected} onChange={(e) => selectPage(e.target.value)} disabled={loading || !!busy}>
          <option value="">—</option>
          {pages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.slug} {p.publishedVersionId ? '(published)' : ''}
            </option>
          ))}
        </select>
        {loading && <p className="mt-2 text-sm text-[var(--muted)]">Memuat homepage...</p>}
      </div>

      <div className="rounded-2xl border border-[#e8e4de] bg-white p-4 shadow-sm mt-4 max-w-xl space-y-2">
        <h2 className="font-semibold">Desain & SEO</h2>
        <div className="grid grid-cols-2 gap-2">
          <input
            className="input"
            type="color"
            value={design.primaryColor}
            onChange={(e) => edit(() => setDesign({ ...design, primaryColor: e.target.value }))}
          />
          <input
            className="input"
            type="color"
            value={design.secondaryColor}
            onChange={(e) => edit(() => setDesign({ ...design, secondaryColor: e.target.value }))}
          />
        </div>
        <input
          className="input"
          placeholder="SEO title"
          value={seo.title}
          onChange={(e) => edit(() => setSeo({ ...seo, title: e.target.value }))}
        />
        <input
          className="input"
          placeholder="SEO description"
          value={seo.description}
          onChange={(e) => edit(() => setSeo({ ...seo, description: e.target.value }))}
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
                  onClick={() => edit(() => setSections((prev) => prev.filter((_, j) => j !== i)))}
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
        <button className="inline-flex items-center justify-center rounded-xl bg-[#c4a574] px-4 py-2.5 text-sm font-semibold text-[#1a1a1a] disabled:opacity-50" type="button" onClick={() => void saveDraft()} disabled={!selected || !!busy}>
          {busy === 'save' ? 'Menyimpan...' : dirty ? 'Simpan draft *' : 'Simpan draft'}
        </button>
        <button className="inline-flex items-center justify-center rounded-xl bg-[#1a1a1a] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50" type="button" onClick={publish} disabled={!selected || !!busy}>
          {busy === 'publish' ? 'Publishing...' : 'Publish'}
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

      {selected && (
        <section className="mt-6 max-w-3xl" aria-label="Preview draft">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold">Preview draft</h2>
            <button type="button" className="rounded-lg border border-[#d4d0c8] px-3 py-1 text-xs font-semibold" onClick={() => setPreviewMobile((value) => !value)}>
              {previewMobile ? 'Desktop' : 'Mobile'}
            </button>
          </div>
          <div className={`mx-auto overflow-hidden rounded-2xl border border-[#d4d0c8] bg-[#f8f6f2] shadow-sm ${previewMobile ? 'max-w-[390px]' : 'max-w-full'}`} style={{ fontFamily: design.font, color: design.primaryColor }}>
            <div className="border-b bg-white px-4 py-3 text-sm font-bold">
              {pages.find((page) => page.id === selected)?.title || 'Homepage'}
            </div>
            <div className="space-y-3 p-3">
              {sections.filter((section) => section.visible !== false).map((section, index) => {
                const content = section.content || {};
                if (section.type === 'hero') return (
                  <div key={index} className="rounded-xl bg-white bg-cover bg-center p-6" style={content.imageUrl ? { backgroundImage: `linear-gradient(#0008,#0008),url(${content.imageUrl})`, color: '#fff' } : undefined}>
                    <h3 className="text-xl font-bold">{content.title || 'Hero title'}</h3>
                    <p className="text-sm opacity-80">{content.subtitle}</p>
                  </div>
                );
                const text = content.body || content.text || content.address || content.quote || content.items;
                return <div key={index} className="rounded-xl bg-white p-4"><strong className="capitalize">{section.type.replace('_', ' ')}</strong>{text && <p className="mt-1 whitespace-pre-wrap text-sm opacity-70">{text}</p>}</div>;
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
