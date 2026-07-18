import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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
        navigate(`/c/${slug}/menu`, { replace: true });
      })
      .catch((e) => setErr(e.message || 'QR tidak valid'));
  }, [token, navigate, setTenant, setSession, retry]);

  return (
    <PageShell beams spotlight maxWidth="max-w-md">
      <AceCard className="mt-20 text-center" glare>
        {err ? (
          <div role="alert">
            <h1 className="font-semibold">QR tidak dapat dibuka</h1>
            <p className="mt-2 text-sm text-[var(--danger)]">{err}</p>
            <div className="mt-4 flex justify-center gap-2">
              <AceButton onClick={() => setRetry((n) => n + 1)}>Coba lagi</AceButton>
              <AceButton as={Link} to="/" variant="ghost">Beranda</AceButton>
            </div>
          </div>
        ) : (
          <Loader label="Membuka meja…" />
        )}
      </AceCard>
    </PageShell>
  );
}
