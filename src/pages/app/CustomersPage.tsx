import { useEffect, useState } from 'react';
import { AceCard } from '@/components/ace/AceCard';
import { AceButton } from '@/components/ace/AceButton';
import { AceBadge, EmptyState, StatCard } from '@/components/ace/PageShell';
import { useApi } from '../../hooks/useApi';
import { useAppStore } from '../../lib/store';
import { Loader } from '@/components/ui/loader';

export function CustomersPage() {
  const api = useApi();
  const organizationId = useAppStore((s) => s.organizationId);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!organizationId) {
      setRows([]);
      return;
    }
    setLoading(true);
    setError('');
    api<any[]>(`/customers?organizationId=${organizationId}`)
      .then(setRows)
      .catch((e) => {
        setRows([]);
        setError(e.message || 'Gagal memuat pelanggan.');
      })
      .finally(() => setLoading(false));
  }, [api, organizationId]);

  return (
    <div className="animate-float-up" data-ace="1">
      <h1 className="text-2xl font-bold">Pelanggan</h1>
      {!organizationId && <p className="mt-4 text-[var(--muted)]">Pilih tenant di dashboard dulu.</p>}
      {loading && <Loader label="Memuat pelanggan…" />}
      {error && <p role="alert" className="mt-4 text-sm text-[var(--danger)]">{error}</p>}
      <div className="mt-6 space-y-2">
        {!loading && !error && rows.map((c) => (
          <div key={c.id} className="flex flex-wrap justify-between gap-3 rounded-2xl border border-[#e8e4de] bg-white p-4 text-sm shadow-sm">
            <div>
              <div className="font-medium">{c.name || c.email || c.phone || c.id}</div>
              <div className="text-[var(--muted)]">
                {[c.email, c.phone].filter(Boolean).join(' · ')}
              </div>
            </div>
            <div className="text-right text-[var(--muted)]">
              {(c.customer?.loyaltyAccounts?.[0] || c.loyaltyAccounts?.[0]) && (
                <div>
                  {(c.customer?.loyaltyAccounts?.[0] || c.loyaltyAccounts?.[0]).balance ??
                    (c.customer?.loyaltyAccounts?.[0] || c.loyaltyAccounts?.[0]).points ??
                    0}{' '}
                  pts
                </div>
              )}
              <div className="font-medium">{c.customer?.name || c.name || c.customerId}</div>
            </div>
          </div>
        ))}
        {!loading && !error && !rows.length && organizationId && <EmptyState title="Belum ada pelanggan." />}
      </div>
    </div>
  );
}
