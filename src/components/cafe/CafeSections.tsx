import { Link } from 'react-router-dom';
import { Clock, MapPin, InstagramLogo, WhatsappLogo } from '@phosphor-icons/react';
import { formatIdr } from '@/lib/api';
import { AceButton } from '@/components/ace/AceButton';
import { AceBadge } from '@/components/ace/PageShell';
import { assets } from '@/lib/assets';
import { SECTION_LABELS } from '@/lib/homepageDefaults';
import { cn } from '@/lib/utils';

export type CafeSection = {
  type: string;
  content?: Record<string, any>;
  visible?: boolean;
};

export type FeaturedItem = {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  photoUrl?: string;
  image?: string;
};

export type ActivePromo = {
  id: string;
  name: string;
  discountType?: string;
};

export type CafeSectionsProps = {
  sections: CafeSection[];
  brandName?: string;
  pageTitle?: string;
  /** Live public path; omit for draft preview (non-navigating CTAs). */
  cafeSlug?: string;
  /** Multi-branch public path segment */
  branchSlug?: string;
  featuredItems?: FeaturedItem[];
  activePromos?: ActivePromo[];
  primaryColor?: string;
  accentColor?: string;
  mode?: 'live' | 'preview';
  className?: string;
  /** Compact spacing for builder preview frame. */
  compact?: boolean;
};

function cafeBasePath(cafeSlug?: string, branchSlug?: string) {
  if (!cafeSlug) return '';
  return branchSlug ? `/c/${cafeSlug}/${branchSlug}` : `/c/${cafeSlug}`;
}

function sectionLabel(type: string) {
  return SECTION_LABELS[type] || type.replace(/_/g, ' ');
}

export function CafeSections({
  sections,
  brandName,
  pageTitle,
  cafeSlug,
  branchSlug,
  featuredItems = [],
  activePromos = [],
  primaryColor,
  accentColor,
  mode = 'live',
  className,
  compact = false,
}: CafeSectionsProps) {
  const preview = mode === 'preview';
  const base = cafeBasePath(cafeSlug, branchSlug);
  const menuHref = base ? `${base}/menu` : undefined;
  const reservationHref = base ? `${base}/reservation` : undefined;
  const primary = primaryColor || undefined;
  const accent = accentColor || '#d97706';
  const visible = sections.filter((s) => s.visible !== false);
  const hasCta = visible.some((s) => s.type === 'cta');

  const styleVars =
    primary || accentColor
      ? ({
          ...(primary
            ? {
                ['--ink' as string]: primary,
                ['--forest' as string]: primary,
                ['--color-cafe-forest' as string]: primary,
                ['--color-cafe-forest-mid' as string]: primary,
              }
            : {}),
          ...(accentColor
            ? {
                ['--accent' as string]: accentColor,
                ['--color-cafe-accent' as string]: accentColor,
              }
            : {}),
        } as React.CSSProperties)
      : undefined;

  function renderSection(sec: CafeSection, idx: number) {
    const c = sec.content || {};

    if (sec.type === 'hero') {
      const heroImg = c.imageUrl || assets.heroInterior;
      return (
        <section
          key={idx}
          className={cn(
            'relative overflow-hidden rounded-2xl border border-cafe-border shadow-md',
            compact && 'shadow-sm',
          )}
        >
          <div
            className={cn(
              'relative px-6 py-14 sm:px-10 sm:py-16',
              compact ? 'min-h-[180px] py-10' : 'min-h-[280px] sm:min-h-[320px]',
            )}
            style={{
              backgroundImage: `linear-gradient(to top, rgba(20,32,26,.88), rgba(20,32,26,.35)),url(${heroImg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              color: '#fffefb',
            }}
          >
            <div className="relative z-10 max-w-lg text-cafe-card">
              {(brandName || pageTitle) && (
                <p className={cn('font-medium opacity-80', compact ? 'text-xs' : 'text-sm')}>
                  {brandName || pageTitle}
                </p>
              )}
              <h1
                className={cn(
                  'mt-2 font-bold tracking-tight leading-[1.15]',
                  compact ? 'text-xl' : 'text-3xl sm:text-4xl',
                )}
              >
                {c.title || pageTitle || (preview ? 'Judul hero' : 'Welcome')}
              </h1>
              {c.subtitle && (
                <p
                  className={cn(
                    'mt-3 max-w-[40ch] opacity-90',
                    compact ? 'text-sm' : 'text-sm sm:text-base',
                  )}
                >
                  {c.subtitle}
                </p>
              )}
              <div className={cn('flex flex-wrap gap-3', compact ? 'mt-4' : 'mt-6')}>
                {menuHref ? (
                  <AceButton as={Link} to={menuHref} variant="accent" className={compact ? '!text-xs' : undefined}>
                    Lihat menu
                  </AceButton>
                ) : (
                  <span
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold"
                    style={{ background: accent, color: '#14201a' }}
                  >
                    Lihat menu
                  </span>
                )}
                {reservationHref ? (
                  <AceButton
                    as={Link}
                    to={reservationHref}
                    variant="ghost"
                    className="!border-cafe-card/30 !text-cafe-card hover:!bg-white/10"
                  >
                    Reservasi
                  </AceButton>
                ) : (
                  <span className="rounded-lg border border-white/30 px-3 py-1.5 text-xs font-semibold">
                    Reservasi
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>
      );
    }

    if (sec.type === 'about') {
      if (!c.body && !preview) return null;
      return (
        <section key={idx} className="max-w-[55ch]">
          <h2
            className={cn('font-bold tracking-tight text-cafe-ink', compact ? 'text-sm' : 'text-xl')}
            style={primary ? { color: primary } : undefined}
          >
            Tentang
          </h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-cafe-muted">
            {c.body || (preview ? 'Isi teks tentang kafe…' : '')}
          </p>
        </section>
      );
    }

    if (sec.type === 'hours') {
      if (!c.text && !preview) return null;
      return (
        <section
          key={idx}
          className={cn(
            'flex gap-3 rounded-2xl border border-cafe-border bg-cafe-card',
            compact ? 'p-3 text-sm' : 'p-4',
          )}
        >
          {!compact && (
            <Clock weight="duotone" className="mt-0.5 h-6 w-6 shrink-0 text-cafe-forest-mid" />
          )}
          <div>
            <h2
              className="font-semibold text-cafe-ink"
              style={primary ? { color: primary } : undefined}
            >
              Jam operasional
            </h2>
            <p className="mt-1 text-sm text-cafe-muted">{c.text || (preview ? 'Belum diisi' : '')}</p>
          </div>
        </section>
      );
    }

    if (sec.type === 'location') {
      if (!c.address && !c.mapsUrl && !preview) return null;
      return (
        <section
          key={idx}
          className={cn(
            'flex gap-3 rounded-2xl border border-cafe-border bg-cafe-card',
            compact ? 'p-3 text-sm' : 'p-4',
          )}
        >
          {!compact && (
            <MapPin weight="duotone" className="mt-0.5 h-6 w-6 shrink-0 text-cafe-forest-mid" />
          )}
          <div>
            <h2
              className="font-semibold text-cafe-ink"
              style={primary ? { color: primary } : undefined}
            >
              Lokasi
            </h2>
            {c.address ? (
              <p className="mt-1 text-sm text-cafe-muted">{c.address}</p>
            ) : preview ? (
              <p className="mt-1 text-sm text-cafe-muted">Alamat belum diisi</p>
            ) : null}
            {c.mapsUrl &&
              (preview ? (
                <p className="mt-1 text-xs font-semibold text-cafe-forest-mid">Link peta tersimpan</p>
              ) : (
                <a
                  className="mt-2 inline-block text-sm font-semibold text-cafe-forest-mid underline-offset-2 hover:underline"
                  href={c.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Buka peta
                </a>
              ))}
          </div>
        </section>
      );
    }

    if (sec.type === 'facilities') {
      const items = String(c.items || '')
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean);
      if (!items.length && !preview) return null;
      const chips = items.length ? items : preview ? ['Contoh'] : [];
      return (
        <section key={idx}>
          <h2
            className="font-semibold text-cafe-ink"
            style={primary ? { color: primary } : undefined}
          >
            Fasilitas
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {chips.map((x) => (
              <AceBadge key={x}>{x}</AceBadge>
            ))}
          </div>
        </section>
      );
    }

    if (sec.type === 'gallery') {
      const urls = String(c.urls || '')
        .split(',')
        .map((u) => u.trim())
        .filter(Boolean);
      if (!urls.length) {
        return preview ? (
          <section key={idx}>
            <h2
              className="mb-2 text-sm font-semibold text-cafe-ink"
              style={primary ? { color: primary } : undefined}
            >
              Galeri
            </h2>
            <p className="text-xs text-cafe-muted">Tambah URL gambar (pisah koma).</p>
          </section>
        ) : null;
      }
      return (
        <section key={idx}>
          <h2 className="mb-3 font-semibold text-cafe-ink" style={primary ? { color: primary } : undefined}>
            Galeri
          </h2>
          <div
            className={cn(
              'grid gap-2',
              compact ? 'grid-cols-3 gap-1.5' : 'grid-cols-2 sm:grid-cols-3',
            )}
          >
            {(compact ? urls.slice(0, 6) : urls).map((u, i) => (
              <img
                key={u}
                src={u}
                alt={compact ? '' : `Galeri ${brandName || pageTitle || 'kafe'} ${i + 1}`}
                className={
                  compact
                    ? 'aspect-square rounded-lg object-cover'
                    : `w-full rounded-2xl object-cover shadow-sm ${
                        i === 0
                          ? 'col-span-2 h-44 sm:col-span-1 sm:row-span-2 sm:h-full sm:min-h-[12rem]'
                          : 'h-28 sm:h-36'
                      }`
                }
                loading="lazy"
              />
            ))}
          </div>
        </section>
      );
    }

    if (sec.type === 'testimonial') {
      if (!c.quote && !preview) return null;
      const quote = String(c.quote || (preview ? 'Kutipan tamu…' : '')).slice(0, 220);
      return (
        <blockquote
          key={idx}
          className={cn(
            'border-l-4 border-cafe-accent pl-4 italic text-cafe-ink',
            compact ? 'pl-3 text-sm' : 'text-base leading-relaxed',
          )}
          style={accentColor ? { borderColor: accent } : undefined}
        >
          “{quote}”
          {c.author && (
            <footer className="mt-2 text-sm not-italic text-cafe-muted">- {c.author}</footer>
          )}
        </blockquote>
      );
    }

    if (sec.type === 'featured_menu') {
      return (
        <section key={idx}>
          <div className="mb-3 flex items-end justify-between gap-3">
            <h2
              className={cn('font-bold tracking-tight text-cafe-ink', compact ? 'text-sm' : 'text-xl')}
              style={primary ? { color: primary } : undefined}
            >
              Menu unggulan
            </h2>
            {menuHref && !compact && (
              <Link
                to={menuHref}
                className="text-sm font-semibold text-cafe-forest-mid underline-offset-2 hover:underline"
              >
                Semua
              </Link>
            )}
          </div>
          {featuredItems.length ? (
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 snap-x snap-mandatory">
              {featuredItems.map((it) => {
                const img = it.imageUrl || it.photoUrl || it.image || assets.menuItem;
                const card = (
                  <>
                    <div className="aspect-square bg-cafe-hover">
                      <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" />
                    </div>
                    <div className="p-3">
                      <p className="line-clamp-2 text-sm font-medium text-cafe-ink">{it.name}</p>
                      <p className="mt-1 text-sm font-semibold text-cafe-accent">
                        {formatIdr(it.price)}
                      </p>
                    </div>
                  </>
                );
                const cls =
                  'w-40 shrink-0 snap-start overflow-hidden rounded-2xl border border-cafe-border bg-cafe-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md';
                return menuHref ? (
                  <Link key={it.id} to={menuHref} className={cls}>
                    {card}
                  </Link>
                ) : (
                  <div key={it.id} className={cls}>
                    {card}
                  </div>
                );
              })}
            </div>
          ) : preview ? (
            <>
              <div className="flex gap-2 overflow-hidden">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="w-28 shrink-0 rounded-xl border border-cafe-border bg-cafe-card p-2"
                  >
                    <img
                      src={assets.menuItem}
                      alt=""
                      className="aspect-square w-full rounded-lg object-cover"
                    />
                    <p className="mt-1.5 line-clamp-2 text-xs font-medium">Item aktif {n}</p>
                    <p className="text-xs font-semibold" style={{ color: accent }}>
                      Saat publish
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-1 text-[11px] text-cafe-muted">
                Diisi otomatis dari menu aktif saat publish.
              </p>
            </>
          ) : (
            <p className="text-sm text-cafe-muted">Belum ada item - isi menu dulu.</p>
          )}
        </section>
      );
    }

    if (sec.type === 'promo') {
      return (
        <section
          key={idx}
          className="rounded-2xl border border-cafe-accent/30 bg-cafe-accent/10 px-5 py-5"
          style={
            accentColor
              ? {
                  borderColor: `${accent}55`,
                  background: `${accent}18`,
                }
              : undefined
          }
        >
          <h2
            className="font-semibold text-cafe-ink"
            style={primary ? { color: primary } : undefined}
          >
            Promo aktif
          </h2>
          {activePromos.length ? (
            <ul className="mt-3 space-y-2 text-sm">
              {activePromos.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2">
                  <span className="text-cafe-ink">{p.name}</span>
                  <AceBadge tone="ok">{p.discountType || 'PROMO'}</AceBadge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-cafe-muted">
              {preview
                ? 'Daftar promo live muncul di halaman publik.'
                : 'Tidak ada promo saat ini.'}
            </p>
          )}
        </section>
      );
    }

    if (sec.type === 'cta') {
      return (
        <section
          key={idx}
          className={cn(
            'rounded-2xl bg-cafe-forest text-center text-cafe-card',
            compact ? 'px-4 py-6 text-sm' : 'px-6 py-10',
          )}
          style={primary ? { background: primary } : undefined}
        >
          <h2 className={cn('font-bold tracking-tight', compact ? 'text-base' : 'text-xl')}>
            Siap pesan?
          </h2>
          {!compact && (
            <p className="mx-auto mt-2 max-w-[36ch] text-sm text-cafe-card/80">
              Buka menu digital atau booking meja sekarang.
            </p>
          )}
          <div className={cn('flex flex-wrap justify-center gap-3', compact ? 'mt-3' : 'mt-6')}>
            {menuHref ? (
              <AceButton as={Link} to={menuHref} variant="accent">
                {c.menuLabel || 'Lihat Menu'}
              </AceButton>
            ) : (
              <span
                className="rounded-lg px-3 py-1.5 text-xs font-semibold"
                style={{ background: accent, color: '#14201a' }}
              >
                {c.menuLabel || 'Lihat Menu'}
              </span>
            )}
            {reservationHref ? (
              <AceButton
                as={Link}
                to={reservationHref}
                variant="ghost"
                className="!border-cafe-card/30 !text-cafe-card hover:!bg-white/10"
              >
                {c.reservationLabel || 'Reservasi'}
              </AceButton>
            ) : (
              <span className="rounded-lg border border-white/30 px-3 py-1.5 text-xs font-semibold">
                {c.reservationLabel || 'Reservasi'}
              </span>
            )}
          </div>
        </section>
      );
    }

    if (sec.type === 'social') {
      if (!c.instagram && !c.whatsapp && !preview) return null;
      return (
        <section
          key={idx}
          className={cn('flex flex-wrap gap-4 text-sm', compact && 'gap-3 text-xs font-medium')}
          style={primary ? { color: primary } : undefined}
        >
          {c.instagram ? (
            preview ? (
              <span>Instagram</span>
            ) : (
              <a
                className="inline-flex items-center gap-2 font-medium text-cafe-forest-mid underline-offset-2 hover:underline"
                href={c.instagram}
                target="_blank"
                rel="noreferrer"
              >
                <InstagramLogo weight="duotone" className="h-5 w-5" />
                Instagram
              </a>
            )
          ) : preview ? (
            <span className="text-cafe-muted">IG -</span>
          ) : null}
          {c.whatsapp ? (
            preview ? (
              <span>WA {c.whatsapp}</span>
            ) : (
              <a
                className="inline-flex items-center gap-2 font-medium text-cafe-forest-mid underline-offset-2 hover:underline"
                href={
                  String(c.whatsapp).startsWith('http')
                    ? c.whatsapp
                    : `https://wa.me/${String(c.whatsapp).replace(/\D/g, '')}`
                }
                target="_blank"
                rel="noreferrer"
              >
                <WhatsappLogo weight="duotone" className="h-5 w-5" />
                {c.whatsapp}
              </a>
            )
          ) : preview ? (
            <span className="text-cafe-muted">WA -</span>
          ) : null}
        </section>
      );
    }

    return preview ? (
      <div key={idx} className="rounded-xl border border-cafe-border bg-cafe-card p-3 text-sm">
        <strong>{sectionLabel(sec.type)}</strong>
      </div>
    ) : null;
  }

  return (
    <div className={cn(compact ? 'space-y-6' : 'space-y-10', className)} style={styleVars}>
      {visible.map((sec, idx) => renderSection(sec, idx))}

      {!hasCta && !preview && menuHref && reservationHref && (
        <section className="rounded-2xl bg-cafe-forest px-6 py-10 text-center text-cafe-card">
          <h2 className="text-xl font-bold tracking-tight">Siap pesan?</h2>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <AceButton as={Link} to={menuHref} variant="accent">
              Lihat Menu
            </AceButton>
            <AceButton
              as={Link}
              to={reservationHref}
              variant="ghost"
              className="!border-cafe-card/30 !text-cafe-card hover:!bg-white/10"
            >
              Reservasi
            </AceButton>
          </div>
        </section>
      )}
    </div>
  );
}
