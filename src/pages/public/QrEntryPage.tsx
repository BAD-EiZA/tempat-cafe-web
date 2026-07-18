import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { PageShell } from '@/components/ace/PageShell';
import { AceCard } from '@/components/ace/AceCard';
import { Loader } from '@/components/ui/loader';

export function QrEntryPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const setTenant = useAppStore((s) => s.setTenant);
  const setSession = useAppStore((s) => s.setSession);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!token) return;
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
  }, [token, navigate, setTenant, setSession]);

  return (
    <PageShell beams spotlight maxWidth="max-w-md">
      <AceCard className="mt-20 text-center" glare>
        {err ? (
          <p className="text-[var(--danger)]">{err}</p>
        ) : (
          <Loader label="Membuka meja…" />
        )}
      </AceCard>
    </PageShell>
  );
}
