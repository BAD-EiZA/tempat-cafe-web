import { useEffect, useState } from 'react';
import { AceCard } from '@/components/ace/AceCard';
import { AceButton } from '@/components/ace/AceButton';
import { AceBadge, EmptyState, StatCard } from '@/components/ace/PageShell';
import { useApi } from '../../hooks/useApi';
import { useAppStore } from '../../lib/store';
import { formatIdr } from '../../lib/api';

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
    if (!window.confirm(`Buat batch payout ${formatIdr(payoutAmt)}? Tindakan ini memerlukan persetujuan platform.`)) return;
    setMsg('');
    setError(''); setBusy(true);
    try {
      // Platform creates batch; merchant request logs via ledger adjust note path — use platform payout when admin
      await api('/platform/payout-batches', {
        method: 'POST',
        body: { organizationId, amount: Number(payoutAmt) },
      });
      setMsg('Payout batch DRAFT dibuat — platform harus submit & approve (dual control)');
    } catch (e: any) {
      setError(e.message || 'Gagal (butuh permission payout.manage)');
    } finally { setBusy(false); }
  }

  if (!organizationId) return <p className="text-[var(--muted)]">Pilih tenant dulu.</p>;
  if (loading) return <p className="text-[var(--muted)]" role="status">Memuat ledger…</p>;

  return (
    <div className="animate-float-up" data-ace="1">
      <h1 className="text-2xl font-bold">Ledger & saldo</h1>
      {error && <p className="mt-2 text-sm text-red-700" role="alert">{error}</p>}
      {balance && (
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            ['Available', balance.available ?? 0],
            ['Pending', balance.pending ?? 0],
            ['Tip payable', balance.tipPayable ?? 0],
          ].map(([k, v]) => (
            <div key={String(k)} className="rounded-2xl border border-[#e8e4de] bg-white p-4 shadow-sm">
              <div className="text-sm text-[var(--muted)]">{k}</div>
              <div className="text-xl font-bold">{formatIdr(Number(v) || 0)}</div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-[#e8e4de] bg-white p-4 shadow-sm mt-4 max-w-md space-y-2">
        <h2 className="font-semibold">Request payout</h2>
        <input
          className="input"
          type="number"
          placeholder="Jumlah IDR"
          aria-label="Jumlah payout dalam IDR"
          min={1}
          value={payoutAmt || ''}
          onChange={(e) => setPayoutAmt(Number(e.target.value))}
        />
        <button className="inline-flex items-center justify-center rounded-xl bg-[#1a1a1a] px-4 py-2.5 text-sm font-semibold text-white" type="button" onClick={requestPayout} disabled={busy || payoutAmt <= 0}>
          {busy ? 'Membuat…' : 'Buat batch'}
        </button>
        {msg && <p className="text-sm text-[var(--muted)]" role="status">{msg}</p>}
      </div>

      <div className="mt-6 space-y-2">
        {entries.map((e: any) => (
          <div key={e.id} className="rounded-2xl border border-[#e8e4de] bg-white p-4 shadow-sm flex justify-between text-sm">
            <div>
              <div className="font-medium">{e.entryType}</div>
              <div className="text-[var(--muted)]">{e.postedAt || e.occurredAt}</div>
            </div>
            <span className="font-semibold">
              {e.credit > 0 ? `+${formatIdr(e.credit)}` : `-${formatIdr(e.debit || 0)}`}
            </span>
          </div>
        ))}
        {!entries.length && !error && <EmptyState title="Belum ada entri." />}
      </div>
    </div>
  );
}
