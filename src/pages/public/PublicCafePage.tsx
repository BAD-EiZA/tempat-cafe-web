import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { PageShell } from '@/components/ace/PageShell';
import { AceCard } from '@/components/ace/AceCard';
import { AceButton } from '@/components/ace/AceButton';
import { FloatingNavbar } from '@/components/ui/floating-navbar';
import { Loader } from '@/components/ui/loader';
import { CafeSections } from '@/components/cafe/CafeSections';
import { useAppStore } from '@/lib/store';

export function PublicCafePage() {
  const { cafeSlug, branchSlug } = useParams();
  const setCafeSlug = useAppStore((s) => s.setCafeSlug);
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!cafeSlug) return;
    setCafeSlug(cafeSlug);
    try {
      sessionStorage.setItem('lastCafeSlug', cafeSlug);
      if (branchSlug) sessionStorage.setItem('lastBranchSlug', branchSlug);
      else sessionStorage.removeItem('lastBranchSlug');
    } catch {
      /* ignore */
    }
    const path = branchSlug
      ? `/public/cafes/${cafeSlug}/${branchSlug}`
      : `/public/cafes/${cafeSlug}`;
    setErr('');
    setData(null);
    api(path)
      .then(setData)
      .catch((e) => setErr(e.message || 'Tidak ditemukan'));
  }, [cafeSlug, branchSlug, retry, setCafeSlug]);

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
      <PageShell beams={false}>
        <AceCard className="mt-20 text-center" role="alert">
          <h1 className="font-semibold">Kafe tidak dapat dimuat</h1>
          <p className="mt-2 text-sm text-[var(--danger)]">{err}</p>
          <div className="mt-4 flex justify-center gap-2">
            <AceButton onClick={() => setRetry((n) => n + 1)}>Coba lagi</AceButton>
            <AceButton as={Link} to="/" variant="ghost">
              Beranda
            </AceButton>
          </div>
        </AceCard>
      </PageShell>
    );
  }
  if (!data) {
    return (
      <PageShell beams={false}>
        <Loader className="pt-20" label="Memuat halaman kafe…" />
      </PageShell>
    );
  }

  if (data.published === false) {
    return (
      <PageShell beams={false}>
        <AceCard className="mt-20 text-center" role="status">
          <h1 className="font-semibold">Halaman belum dipublikasikan</h1>
          <p className="mt-2 text-sm text-cafe-muted">Kafe ini belum publish homepage-nya.</p>
          <AceButton as={Link} to="/" variant="ghost" className="mt-4">
            Beranda
          </AceButton>
        </AceCard>
      </PageShell>
    );
  }

  const design = (data.design as any) || {};
  const sections = data.sections || [];
  const brandName = data.page?.brand?.name || data.brand?.name;
  const title = data.page?.title || data.title;
  const featuredItems = data.featuredItems || [];
  const activePromos = data.activePromos || [];
  const primary = design.primaryColor || undefined;
  const accent = design.secondaryColor || undefined;
  const base = branchSlug ? `/c/${cafeSlug}/${branchSlug}` : `/c/${cafeSlug}`;

  return (
    <PageShell beams spotlight maxWidth="max-w-3xl" className="pb-16">
      <FloatingNavbar
        brand={brandName || title || 'Cafe'}
        navItems={[
          { name: 'Menu', link: `${base}/menu` },
          { name: 'Reservasi', link: `${base}/reservation` },
        ]}
        right={
          <AceButton as={Link} to={`${base}/menu`} variant="primary" className="!py-1.5 !text-xs">
            Order
          </AceButton>
        }
      />
      <div className="pt-20">
        <CafeSections
          mode="live"
          cafeSlug={cafeSlug}
          branchSlug={branchSlug}
          sections={sections}
          brandName={brandName}
          pageTitle={title}
          featuredItems={featuredItems}
          activePromos={activePromos}
          primaryColor={primary}
          accentColor={accent}
        />
      </div>
    </PageShell>
  );
}
