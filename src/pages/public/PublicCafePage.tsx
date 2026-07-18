import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, formatIdr } from '@/lib/api';
import { PageShell } from '@/components/ace/PageShell';
import { AceCard } from '@/components/ace/AceCard';
import { AceButton } from '@/components/ace/AceButton';
import { FloatingNavbar } from '@/components/ui/floating-navbar';
import { Loader } from '@/components/ui/loader';
import { AceBadge } from '@/components/ace/PageShell';

export function PublicCafePage() {
  const { cafeSlug, branchSlug } = useParams();
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!cafeSlug) return;
    const path = branchSlug
      ? `/public/cafes/${cafeSlug}/${branchSlug}`
      : `/public/cafes/${cafeSlug}`;
    setErr('');
    api(path)
      .then(setData)
      .catch((e) => setErr(e.message || 'Tidak ditemukan'));
  }, [cafeSlug, branchSlug, retry]);

  useEffect(() => {
    if (!data?.published) return;
    const previousTitle = document.title;
    const title = data.page?.seoTitle || data.page?.title || data.page?.brand?.name;
    if (title) document.title = title;
    let description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const previousDescription = description?.content;
    if (data.page?.seoDescription) {
      if (!description) {
        description = document.createElement('meta');
        description.name = 'description';
        document.head.appendChild(description);
      }
      description.content = data.page.seoDescription;
    }
    return () => {
      document.title = previousTitle;
      if (description && previousDescription !== undefined) description.content = previousDescription;
      else if (description) description.remove();
    };
  }, [data]);

  if (err) {
    return (
      <PageShell>
        <AceCard className="mt-20 text-center" role="alert">
          <h1 className="font-semibold">Kafe tidak dapat dimuat</h1>
          <p className="mt-2 text-sm text-[var(--danger)]">{err}</p>
          <div className="mt-4 flex justify-center gap-2">
            <AceButton onClick={() => setRetry((n) => n + 1)}>Coba lagi</AceButton>
            <AceButton as={Link} to="/" variant="ghost">Beranda</AceButton>
          </div>
        </AceCard>
      </PageShell>
    );
  }
  if (!data) {
    return (
      <PageShell>
        <Loader className="pt-20" label="Memuat halaman kafe…" />
      </PageShell>
    );
  }

  const design = (data.design as any) || {};
  const sections = data.sections || [];
  const brandName = data.page?.brand?.name || data.brand?.name;
  const title = data.page?.title || data.title;
  const featuredItems = data.featuredItems || [];
  const activePromos = data.activePromos || [];

  return (
    <PageShell beams spotlight maxWidth="max-w-3xl" className="pb-16">
      <FloatingNavbar
        brand={brandName || title || 'Cafe'}
        navItems={[
          { name: 'Menu', link: `/c/${cafeSlug}/menu` },
          { name: 'Reservasi', link: `/c/${cafeSlug}/reservation` },
        ]}
        right={
          <AceButton as={Link} to={`/c/${cafeSlug}/menu`} variant="accent" className="!py-1.5 !text-xs">
            Order
          </AceButton>
        }
      />
      <div className="space-y-4 pt-20" style={{ ['--ink' as string]: design.primaryColor || undefined }}>
        {sections.map((sec: any, idx: number) => {
          const c = sec.content || {};
          if (sec.type === 'hero') {
            return (
              <AceCard
                key={idx}
                className="overflow-hidden !p-0"
                glare
              >
                <div
                  className="px-6 py-12"
                  style={
                    c.imageUrl
                      ? {
                          backgroundImage: `linear-gradient(rgba(0,0,0,.5),rgba(0,0,0,.5)),url(${c.imageUrl})`,
                          backgroundSize: 'cover',
                          color: '#fff',
                        }
                      : undefined
                  }
                >
                  <p className="text-sm opacity-80">{brandName || title}</p>
                  <h1 className="mt-1 text-3xl font-bold">{c.title || title || 'Welcome'}</h1>
                  {c.subtitle && <p className="mt-2 opacity-90">{c.subtitle}</p>}
                </div>
              </AceCard>
            );
          }
          if (sec.type === 'about' && c.body) {
            return (
              <AceCard key={idx}>
                <h2 className="font-semibold">Tentang</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm text-[#6b6b6b]">{c.body}</p>
              </AceCard>
            );
          }
          if (sec.type === 'hours' && c.text) {
            return (
              <AceCard key={idx}>
                <h2 className="font-semibold">Jam operasional</h2>
                <p className="mt-1 text-sm text-[#6b6b6b]">{c.text}</p>
              </AceCard>
            );
          }
          if (sec.type === 'location' && (c.address || c.mapsUrl)) {
            return (
              <AceCard key={idx}>
                <h2 className="font-semibold">Lokasi</h2>
                {c.address && <p className="mt-1 text-sm text-[#6b6b6b]">{c.address}</p>}
                {c.mapsUrl && (
                  <a className="mt-2 inline-block text-sm underline" href={c.mapsUrl} target="_blank" rel="noreferrer">
                    Buka peta
                  </a>
                )}
              </AceCard>
            );
          }
          if (sec.type === 'facilities' && c.items) {
            return (
              <AceCard key={idx}>
                <h2 className="font-semibold">Fasilitas</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {String(c.items)
                    .split(',')
                    .map((x: string) => x.trim())
                    .filter(Boolean)
                    .map((x: string) => (
                      <AceBadge key={x}>{x}</AceBadge>
                    ))}
                </div>
              </AceCard>
            );
          }
          if (sec.type === 'gallery' && c.urls) {
            const urls = String(c.urls)
              .split(',')
              .map((u: string) => u.trim())
              .filter(Boolean);
            return (
              <div key={idx} className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {urls.map((u: string) => (
                  <img key={u} src={u} alt={`Galeri ${brandName || title || 'kafe'}`} className="h-28 w-full rounded-2xl object-cover shadow-sm" />
                ))}
              </div>
            );
          }
          if (sec.type === 'testimonial' && c.quote) {
            return (
              <AceCard key={idx}>
                <blockquote className="text-sm italic text-[#6b6b6b]">“{c.quote}”</blockquote>
              </AceCard>
            );
          }
          if (sec.type === 'featured_menu') {
            return (
              <AceCard key={idx}>
                <h2 className="font-semibold">Menu unggulan</h2>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {featuredItems.map((it: any) => (
                    <div key={it.id} className="rounded-xl border border-[#e8e4de] p-3 text-sm">
                      <div className="font-medium">{it.name}</div>
                      <div className="text-[#c4a574]">{formatIdr(it.price)}</div>
                    </div>
                  ))}
                  {!featuredItems.length && (
                    <p className="text-sm text-[#6b6b6b]">Belum ada item — isi menu dulu.</p>
                  )}
                </div>
                <AceButton as={Link} to={`/c/${cafeSlug}/menu`} variant="ghost" className="mt-3 !text-sm">
                  Lihat semua
                </AceButton>
              </AceCard>
            );
          }
          if (sec.type === 'promo') {
            return (
              <AceCard key={idx}>
                <h2 className="font-semibold">Promo aktif</h2>
                <ul className="mt-2 space-y-1 text-sm">
                  {activePromos.map((p: any) => (
                    <li key={p.id} className="flex justify-between gap-2">
                      <span>{p.name}</span>
                      <AceBadge tone="ok">{p.discountType || 'PROMO'}</AceBadge>
                    </li>
                  ))}
                  {!activePromos.length && <li className="text-[#6b6b6b]">Tidak ada promo saat ini.</li>}
                </ul>
              </AceCard>
            );
          }
          if (sec.type === 'cta') {
            return (
              <div key={idx} className="flex flex-wrap gap-3 py-2">
                <AceButton as={Link} to={`/c/${cafeSlug}/menu`} variant="border">
                  {c.menuLabel || 'Lihat Menu'}
                </AceButton>
                <AceButton as={Link} to={`/c/${cafeSlug}/reservation`} variant="accent">
                  {c.reservationLabel || 'Reservasi'}
                </AceButton>
              </div>
            );
          }
          if (sec.type === 'social' && (c.instagram || c.whatsapp)) {
            return (
              <div key={idx} className="text-sm">
                {c.instagram && (
                  <a className="mr-4 underline" href={c.instagram} target="_blank" rel="noreferrer">
                    Instagram
                  </a>
                )}
                {c.whatsapp && <span>WA: {c.whatsapp}</span>}
              </div>
            );
          }
          return null;
        })}
        {!sections.some((s: any) => s.type === 'cta') && (
          <div className="flex flex-wrap gap-3 py-6">
            <AceButton as={Link} to={`/c/${cafeSlug}/menu`} variant="border">
              Lihat Menu
            </AceButton>
            <AceButton as={Link} to={`/c/${cafeSlug}/reservation`} variant="accent">
              Reservasi
            </AceButton>
          </div>
        )}
      </div>
    </PageShell>
  );
}
