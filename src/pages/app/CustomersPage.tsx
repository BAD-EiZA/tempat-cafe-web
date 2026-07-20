import { useEffect, useState } from 'react';
import { EmptyState } from '@/components/ace/PageShell';
import { PageHeader } from '@/components/ace/PageHeader';
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
    <div className="animate-float-up space-y-6">
      <PageHeader title="Pelanggan" description="Daftar customer & poin loyalty" />
      {!organizationId && (
        <EmptyState title="Pilih tenant dulu" description="Gunakan switcher organisasi di atas." />
      )}
      {loading && <Loader label="Memuat pelanggan…" />}
      {error && (
        <p role="alert" className="text-sm text-[var(--danger)]">
          {error}
        </p>
      )}
      <ul className="divide-y divide-cafe-border overflow-hidden rounded-2xl border border-cafe-border bg-cafe-card">
        {!loading &&
          !error &&
          rows.map((c) => (
            <li key={c.id} className="flex flex-wrap justify-between gap-3 px-4 py-3 text-sm">
              <div>
                <div className="font-medium text-cafe-ink">{c.name || c.email || c.phone || c.id}</div>
                <div className="text-cafe-muted">{[c.email, c.phone].filter(Boolean).join(' · ')}</div>
              </div>
              <div className="text-right text-cafe-muted">
                {(c.customer?.loyaltyAccounts?.[0] || c.loyaltyAccounts?.[0]) && (
                  <div>
                    {(c.customer?.loyaltyAccounts?.[0] || c.loyaltyAccounts?.[0]).balance ??
                      (c.customer?.loyaltyAccounts?.[0] || c.loyaltyAccounts?.[0]).points ??
                      0}{' '}
                    pts
                  </div>
                )}
                <div className="font-medium text-cafe-ink">{c.customer?.name || c.name || c.customerId}</div>
              </div>
            </li>
          ))}
      </ul>
      {!loading && !error && !rows.length && organizationId && (
        <EmptyState title="Belum ada pelanggan" />
      )}
    </div>
  );
}
