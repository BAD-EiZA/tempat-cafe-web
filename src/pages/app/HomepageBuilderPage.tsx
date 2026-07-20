import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AceButton } from '@/components/ace/AceButton';
import { AceInput, AceSelect, AceTextarea } from '@/components/ace/AceInput';
import { EmptyState, AceBadge } from '@/components/ace/PageShell';
import { PageHeader } from '@/components/ace/PageHeader';
import { Loader } from '@/components/ui/loader';
import { useApi } from '../../hooks/useApi';
import { useAppStore } from '../../lib/store';
import {
  DEFAULT_DESIGN,
  DEFAULT_SECTIONS,
  SECTION_LABELS,
  SECTION_TYPES,
  emptySectionContent,
} from '@/lib/homepageDefaults';
import { CafeSections } from '@/components/cafe/CafeSections';
import { cn } from '@/lib/utils';

function sectionLabel(type: string) {
  return SECTION_LABELS[type] || type.replace(/_/g, ' ');
}

function DraftPreview({
  title,
  design,
  sections,
  mobile,
}: {
  title: string;
  design: typeof DEFAULT_DESIGN;
  sections: any[];
  mobile: boolean;
}) {
  const primary = design.primaryColor || '#1b4332';

  return (
    <div
      className={cn(
        'mx-auto overflow-hidden rounded-2xl border border-cafe-border bg-cafe-bg shadow-sm',
        mobile ? 'max-w-[390px]' : 'max-w-full',
      )}
      style={{ fontFamily: design.font || 'inherit' }}
    >
      <div
        className="border-b border-cafe-border bg-cafe-card px-4 py-3 text-sm font-bold"
        style={{ color: primary }}
      >
        {title || 'Homepage'}
      </div>
      <div className="p-4">
        <CafeSections
          mode="preview"
          compact
          sections={sections}
          pageTitle={title}
          brandName={title}
          primaryColor={design.primaryColor}
          accentColor={design.secondaryColor}
        />
      </div>
    </div>
  );
}

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
    edit(() => setSections((prev) => [...prev, { type, content: emptySectionContent(type) }]));
  }

  function moveSection(i: number, dir: -1 | 1) {
    edit(() =>
      setSections((prev) => {
        const j = i + dir;
        if (j < 0 || j >= prev.length) return prev;
        const next = [...prev];
        [next[i], next[j]] = [next[j], next[i]];
        return next;
      }),
    );
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
        edit(() =>
          setSections((prev) =>
            prev.map((s, idx) =>
              idx === sectionIndex
                ? { ...s, content: { ...(s.content || {}), imageUrl: data.secure_url } }
                : s,
            ),
          ),
        );
      }
      setUploadMsg(`OK: ${data.secure_url}`);
    } catch (err: any) {
      setUploadMsg(err.message || 'Gagal upload');
    }
    e.target.value = '';
  }

  const selectedPage = pages.find((p) => p.id === selected);
  const publicSlug = selectedPage?.slug;

  return (
    <div className="animate-float-up space-y-6">
      <PageHeader
        title="Homepage builder"
        description="Susun halaman publik kafe. Preview mengikuti tampilan tamu."
        actions={
          selected ? (
            <>
              <AceButton
                variant="accent"
                className="!text-sm"
                disabled={!!busy}
                onClick={() => void saveDraft()}
              >
                {busy === 'save' ? 'Menyimpan…' : dirty ? 'Simpan draft *' : 'Simpan draft'}
              </AceButton>
              <AceButton
                variant="primary"
                className="!text-sm"
                disabled={!!busy}
                onClick={() => void publish()}
              >
                {busy === 'publish' ? 'Publishing…' : 'Publish'}
              </AceButton>
            </>
          ) : undefined
        }
      />

      {!organizationId && (
        <EmptyState title="Pilih tenant dulu" description="Gunakan switcher organisasi di atas." />
      )}

      {message && (
        <p
          role="status"
          className={cn(
            'rounded-xl border px-4 py-3 text-sm',
            message.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-green-200 bg-green-50 text-green-800',
          )}
        >
          {message.text}
        </p>
      )}

      {organizationId && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
          {/* Editor column */}
          <div className="min-w-0 space-y-4">
            <form
              className="max-w-md space-y-3 rounded-2xl border border-cafe-border bg-cafe-card p-4 shadow-sm"
              onSubmit={createPage}
            >
              <h2 className="text-sm font-bold text-cafe-ink">Halaman baru</h2>
              <AceInput
                label="Slug"
                placeholder="demo-cafe"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
              />
              <AceInput
                label="Judul"
                placeholder="Nama di builder"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <AceButton type="submit" variant="primary" disabled={!organizationId || !!busy}>
                {busy === 'create' ? 'Membuat…' : 'Buat halaman'}
              </AceButton>
            </form>

            <div className="max-w-md space-y-2">
              <AceSelect
                label="Pilih halaman"
                value={selected}
                onChange={(e) => selectPage(e.target.value)}
                disabled={loading || !!busy}
              >
                <option value="">-</option>
                {pages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.slug} {p.publishedVersionId ? '(published)' : ''}
                  </option>
                ))}
              </AceSelect>
              {loading && <Loader label="Memuat homepage…" />}
              {publicSlug && (
                <p className="text-sm text-cafe-muted">
                  Publik:{' '}
                  <Link className="font-semibold text-cafe-forest-mid underline" to={`/c/${publicSlug}`}>
                    /c/{publicSlug}
                  </Link>
                </p>
              )}
            </div>

            {selected && (
              <>
                <div className="max-w-xl space-y-3 rounded-2xl border border-cafe-border bg-cafe-card p-4 shadow-sm">
                  <h2 className="text-sm font-bold text-cafe-ink">Desain & SEO</h2>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-cafe-muted">
                        Warna utama
                      </label>
                      <input
                        className="h-11 w-full cursor-pointer rounded-xl border border-cafe-border bg-cafe-card"
                        type="color"
                        value={design.primaryColor}
                        onChange={(e) =>
                          edit(() => setDesign({ ...design, primaryColor: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-cafe-muted">
                        Aksen
                      </label>
                      <input
                        className="h-11 w-full cursor-pointer rounded-xl border border-cafe-border bg-cafe-card"
                        type="color"
                        value={design.secondaryColor}
                        onChange={(e) =>
                          edit(() => setDesign({ ...design, secondaryColor: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <AceInput
                    label="SEO title"
                    value={seo.title}
                    onChange={(e) => edit(() => setSeo({ ...seo, title: e.target.value }))}
                  />
                  <AceInput
                    label="SEO description"
                    value={seo.description}
                    onChange={(e) => edit(() => setSeo({ ...seo, description: e.target.value }))}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex flex-wrap items-end gap-2">
                    <AceSelect
                      label="Tambah section"
                      containerClassName="min-w-[12rem]"
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) {
                          addSection(e.target.value);
                          e.target.value = '';
                        }
                      }}
                    >
                      <option value="">Pilih tipe…</option>
                      {SECTION_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {sectionLabel(t)}
                        </option>
                      ))}
                    </AceSelect>
                  </div>

                  {sections.map((s, i) => (
                    <div
                      key={i}
                      className="max-w-xl space-y-3 rounded-2xl border border-cafe-border bg-cafe-card p-4 shadow-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <AceBadge>{sectionLabel(s.type)}</AceBadge>
                        <div className="flex gap-1">
                          <AceButton
                            type="button"
                            variant="ghost"
                            className="!min-h-9 !px-2.5 !py-1 !text-xs"
                            onClick={() => moveSection(i, -1)}
                          >
                            ↑
                          </AceButton>
                          <AceButton
                            type="button"
                            variant="ghost"
                            className="!min-h-9 !px-2.5 !py-1 !text-xs"
                            onClick={() => moveSection(i, 1)}
                          >
                            ↓
                          </AceButton>
                          <AceButton
                            type="button"
                            variant="ghost"
                            className="!min-h-9 !px-2.5 !py-1 !text-xs"
                            onClick={() =>
                              edit(() => setSections((prev) => prev.filter((_, j) => j !== i)))
                            }
                          >
                            Hapus
                          </AceButton>
                        </div>
                      </div>

                      {s.type === 'hero' && (
                        <>
                          <AceInput
                            label="Judul"
                            value={s.content.title || ''}
                            onChange={(e) => updateSection(i, { ...s.content, title: e.target.value })}
                          />
                          <AceInput
                            label="Subjudul"
                            value={s.content.subtitle || ''}
                            onChange={(e) =>
                              updateSection(i, { ...s.content, subtitle: e.target.value })
                            }
                          />
                          <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-cafe-border px-4 py-2.5 text-sm font-semibold">
                            Upload gambar hero
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => onFile(e, i)}
                            />
                          </label>
                          {s.content.imageUrl && (
                            <img
                              src={s.content.imageUrl}
                              alt=""
                              className="h-24 rounded-xl object-cover"
                            />
                          )}
                        </>
                      )}
                      {s.type === 'about' && (
                        <AceTextarea
                          label="Tentang"
                          className="min-h-24"
                          value={s.content.body || ''}
                          onChange={(e) => updateSection(i, { ...s.content, body: e.target.value })}
                        />
                      )}
                      {s.type === 'hours' && (
                        <AceInput
                          label="Jam"
                          value={s.content.text || ''}
                          onChange={(e) => updateSection(i, { ...s.content, text: e.target.value })}
                        />
                      )}
                      {s.type === 'location' && (
                        <>
                          <AceInput
                            label="Alamat"
                            value={s.content.address || ''}
                            onChange={(e) =>
                              updateSection(i, { ...s.content, address: e.target.value })
                            }
                          />
                          <AceInput
                            label="Google Maps URL"
                            value={s.content.mapsUrl || ''}
                            onChange={(e) =>
                              updateSection(i, { ...s.content, mapsUrl: e.target.value })
                            }
                          />
                        </>
                      )}
                      {s.type === 'facilities' && (
                        <AceInput
                          label="Fasilitas (pisah koma)"
                          placeholder="WiFi, AC, Outdoor"
                          value={s.content.items || ''}
                          onChange={(e) => updateSection(i, { ...s.content, items: e.target.value })}
                        />
                      )}
                      {s.type === 'gallery' && (
                        <AceInput
                          label="URL gambar (pisah koma)"
                          value={s.content.urls || ''}
                          onChange={(e) => updateSection(i, { ...s.content, urls: e.target.value })}
                        />
                      )}
                      {s.type === 'testimonial' && (
                        <>
                          <AceTextarea
                            label="Kutipan"
                            className="min-h-16"
                            value={s.content.quote || ''}
                            onChange={(e) =>
                              updateSection(i, { ...s.content, quote: e.target.value })
                            }
                          />
                          <AceInput
                            label="Nama (opsional)"
                            value={s.content.author || ''}
                            onChange={(e) =>
                              updateSection(i, { ...s.content, author: e.target.value })
                            }
                          />
                        </>
                      )}
                      {s.type === 'cta' && (
                        <>
                          <AceInput
                            label="Label menu"
                            value={s.content.menuLabel || ''}
                            onChange={(e) =>
                              updateSection(i, { ...s.content, menuLabel: e.target.value })
                            }
                          />
                          <AceInput
                            label="Label reservasi"
                            value={s.content.reservationLabel || ''}
                            onChange={(e) =>
                              updateSection(i, { ...s.content, reservationLabel: e.target.value })
                            }
                          />
                        </>
                      )}
                      {s.type === 'social' && (
                        <>
                          <AceInput
                            label="Instagram URL"
                            value={s.content.instagram || ''}
                            onChange={(e) =>
                              updateSection(i, { ...s.content, instagram: e.target.value })
                            }
                          />
                          <AceInput
                            label="WhatsApp"
                            value={s.content.whatsapp || ''}
                            onChange={(e) =>
                              updateSection(i, { ...s.content, whatsapp: e.target.value })
                            }
                          />
                        </>
                      )}
                      {['featured_menu', 'promo'].includes(s.type) && (
                        <p className="text-xs text-cafe-muted">
                          Ditampilkan dari data menu/promo aktif saat publish.
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-cafe-border px-4 py-2.5 text-sm font-semibold">
                    Upload media
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e)} />
                  </label>
                </div>
                {uploadMsg && (
                  <p className="break-all text-xs text-cafe-muted">{uploadMsg}</p>
                )}
              </>
            )}
          </div>

          {/* Preview column */}
          {selected && (
            <aside className="xl:sticky xl:top-24 xl:self-start">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-cafe-ink">Preview draft</h2>
                <AceButton
                  type="button"
                  variant="ghost"
                  className="!min-h-9 !py-1 !text-xs"
                  onClick={() => setPreviewMobile((v) => !v)}
                >
                  {previewMobile ? 'Desktop' : 'Mobile'}
                </AceButton>
              </div>
              <DraftPreview
                title={selectedPage?.title || selectedPage?.slug || 'Homepage'}
                design={design}
                sections={sections}
                mobile={previewMobile}
              />
              <p className="mt-2 text-[11px] text-cafe-muted">
                Preview mendekati halaman publik. Menu unggulan & promo live diisi saat publish.
              </p>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
