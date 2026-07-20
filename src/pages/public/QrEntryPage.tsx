import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { QrCode } from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { PageShell } from '@/components/ace/PageShell';
import { AceCard } from '@/components/ace/AceCard';
import { Loader } from '@/components/ui/loader';
import { AceButton } from '@/components/ace/AceButton';

export function QrEntryPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const setTenant = useAppStore((s) => s.setTenant);
  const setSession = useAppStore((s) => s.setSession);
  const [err, setErr] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!token) return;
    setErr('');
    api<any>(`/public/qr/${token}`)
      .then((res) => {
        const orgId = res.organizationId || res.branch?.organizationId;
        const branchId = res.branchId || res.branch?.id;
        const tableId = res.tableId || res.table?.id;
        const sessionId = res.sessionId || res.session?.id || res.tableSessionId;
        if (orgId && branchId) setTenant(orgId, branchId);
        if (sessionId && tableId) setSession(sessionId, tableId);
        const slug = res.brandSlug || res.branch?.brand?.slug || res.cafeSlug || 'demo-cafe';
        const branchSlug = res.branchSlug || res.branch?.slug;
        try {
          sessionStorage.setItem('lastCafeSlug', slug);
          if (branchSlug) sessionStorage.setItem('lastBranchSlug', branchSlug);
          else sessionStorage.removeItem('lastBranchSlug');
        } catch {
          /* ignore */
        }
        const menuPath = branchSlug ? `/c/${slug}/${branchSlug}/menu` : `/c/${slug}/menu`;
        navigate(menuPath, { replace: true });
      })
      .catch((e) => setErr(e.message || 'QR tidak valid'));
  }, [token, navigate, setTenant, setSession, retry]);

  return (
    <PageShell beams={false} maxWidth="max-w-md">
      <AceCard className="mt-20 text-center">
        {err ? (
          <div role="alert">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-[var(--danger)]">
              <QrCode weight="duotone" className="h-7 w-7" />
            </div>
            <h1 className="mt-4 font-semibold text-cafe-ink">QR tidak dapat dibuka</h1>
            <p className="mt-2 text-sm text-[var(--danger)]">{err}</p>
            <div className="mt-4 flex justify-center gap-2">
              <AceButton onClick={() => setRetry((n) => n + 1)}>Coba lagi</AceButton>
              <AceButton as={Link} to="/" variant="ghost">
                Beranda
              </AceButton>
            </div>
          </div>
        ) : (
          <div>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cafe-forest text-cafe-card">
              <QrCode weight="duotone" className="h-7 w-7" />
            </div>
            <p className="mt-4 text-sm font-medium text-cafe-ink">Membuka meja…</p>
            <Loader className="!p-4" label="Menyiapkan sesi pesanan" />
          </div>
        )}
      </AceCard>
    </PageShell>
  );
}
