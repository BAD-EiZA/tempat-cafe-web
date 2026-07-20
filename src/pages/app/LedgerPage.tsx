import { useEffect, useState } from 'react';
import { EmptyState, StatCard } from '@/components/ace/PageShell';
import { PageHeader } from '@/components/ace/PageHeader';
import { AceButton } from '@/components/ace/AceButton';
import { AceInput } from '@/components/ace/AceInput';
import { useApi } from '../../hooks/useApi';
import { useAppStore } from '../../lib/store';
import { formatIdr } from '../../lib/api';
import { Loader } from '@/components/ui/loader';

export function LedgerPage() {
  const api = useApi();
  const organizationId = useAppStore((s) => s.organizationId);
  const [balance, setBalance] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payoutAmt, setPayoutAmt] = useState(0);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!organizationId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    Promise.all([
      api(`/ledger/balance?organizationId=${organizationId}`),
      api<any[]>(`/ledger?organizationId=${organizationId}`),
    ])
      .then(([b, e]) => {
        setBalance(b);
        setEntries(Array.isArray(e) ? e : []);
      })
      .catch((e: any) => {
        setBalance(null);
        setEntries([]);
        setError(e.message || 'Gagal memuat ledger.');
      })
      .finally(() => setLoading(false));
  }, [api, organizationId]);

  async function requestPayout() {
    if (!organizationId || !payoutAmt) return;
    if (
      !window.confirm(
        `Buat batch payout ${formatIdr(payoutAmt)}? Tindakan ini memerlukan persetujuan platform.`,
      )
    )
      return;
    setMsg('');
    setError('');
    setBusy(true);
    try {
      await api('/platform/payout-batches', {
        method: 'POST',
        body: { organizationId, amount: Number(payoutAmt) },
      });
      setMsg('Payout batch DRAFT dibuat - platform harus submit & approve (dual control)');
    } catch (e: any) {
      setError(e.message || 'Gagal (butuh permission payout.manage)');
    } finally {
      setBusy(false);
    }
  }

  if (!organizationId) {
    return (
      <div className="space-y-4">
        <PageHeader title="Ledger & saldo" />
        <EmptyState title="Pilih tenant dulu" description="Gunakan switcher organisasi di atas." />
      </div>
    );
  }
  if (loading) {
    return (
      <div className="space-y-4">
        <PageHeader title="Ledger & saldo" />
        <Loader label="Memuat ledger…" />
      </div>
    );
  }

  return (
    <div className="animate-float-up space-y-6">
      <PageHeader title="Ledger & saldo" description="Saldo tersedia, pending, dan payout" />
      {error && (
        <p className="text-sm text-[var(--danger)]" role="alert">
          {error}
        </p>
      )}
      {balance && (
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Tersedia" value={formatIdr(Number(balance.available) || 0)} />
          <StatCard label="Pending" value={formatIdr(Number(balance.pending) || 0)} />
          <StatCard label="Tip terutang" value={formatIdr(Number(balance.tipPayable) || 0)} />
        </div>
      )}

      <div className="max-w-md space-y-3 rounded-2xl border border-cafe-border bg-cafe-card p-4 shadow-sm">
        <h2 className="text-sm font-bold text-cafe-ink">Request payout</h2>
        <AceInput
          label="Jumlah (IDR)"
          type="number"
          min={1}
          value={payoutAmt || ''}
          onChange={(e) => setPayoutAmt(Number(e.target.value))}
        />
        <AceButton
          type="button"
          variant="primary"
          onClick={requestPayout}
          disabled={busy || payoutAmt <= 0}
        >
          {busy ? 'Membuat…' : 'Buat batch'}
        </AceButton>
        {msg && (
          <p className="text-sm text-cafe-muted" role="status">
            {msg}
          </p>
        )}
      </div>

      <ul className="divide-y divide-cafe-border overflow-hidden rounded-2xl border border-cafe-border bg-cafe-card">
        {entries.map((e: any) => (
          <li key={e.id} className="flex justify-between gap-3 px-4 py-3 text-sm">
            <div>
              <div className="font-medium text-cafe-ink">{e.entryType}</div>
              <div className="text-cafe-muted">{e.postedAt || e.occurredAt}</div>
            </div>
            <span className="font-semibold tabular-nums text-cafe-ink">
              {e.credit > 0 ? `+${formatIdr(e.credit)}` : `-${formatIdr(e.debit || 0)}`}
            </span>
          </li>
        ))}
      </ul>
      {!entries.length && !error && <EmptyState title="Belum ada entri" />}
    </div>
  );
}
