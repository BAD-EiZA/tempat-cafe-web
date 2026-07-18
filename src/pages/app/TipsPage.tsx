import { useEffect, useState } from 'react';
import { AceCard } from '@/components/ace/AceCard';
import { AceButton } from '@/components/ace/AceButton';
import { AceBadge, EmptyState, StatCard } from '@/components/ace/PageShell';
import { useApi } from '../../hooks/useApi';
import { useAppStore } from '../../lib/store';
import { formatIdr } from '../../lib/api';

export function TipsPage() {
  const api = useApi();
  const branchId = useAppStore((s) => s.branchId);
  const organizationId = useAppStore((s) => s.organizationId);
  const [tips, setTips] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [splits, setSplits] = useState<{ userId: string; amount: number }[]>([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    if (!branchId) { setLoading(false); return; }
    setLoading(true); setError('');
    try {
      setTips(await api<any[]>(`/tips?branchId=${branchId}`));
      if (organizationId) setStaff(await api<any[]>(`/organizations/${organizationId}/members`));
    } catch (e: any) { setError(e.message || 'Gagal memuat tip.'); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, [api, branchId, organizationId]);

  function openAlloc(t: any) {
    setSelected(t);
    setMsg('');
    const members = staff.filter((m) => m.userId || m.user?.id);
    if (members.length) {
      const each = Math.floor(t.amount / members.length);
      let rest = t.amount - each * members.length;
      setSplits(
        members.map((m, i) => ({
          userId: m.userId || m.user?.id,
          amount: each + (i === 0 ? rest : 0),
        })),
      );
    } else {
      setSplits([{ userId: '', amount: t.amount }]);
    }
  }

  async function allocate() {
    if (!selected) return;
    const total = splits.reduce((sum, split) => sum + split.amount, 0);
    if (total !== selected.amount) { setError('Total split harus sama dengan jumlah tip.'); return; }
    if (!window.confirm(`Alokasikan tip ${formatIdr(selected.amount)}?`)) return;
    setMsg('');
    setError(''); setBusy(true);
    try {
      await api(`/tips/${selected.id}/allocate`, {
        method: 'POST',
        body: { splits: splits.filter((s) => s.userId && s.amount > 0) },
      });
      setMsg('Alokasi tersimpan');
      setSelected(null);
      await load();
    } catch (e: any) {
      setError(e.message || 'Gagal mengalokasikan tip.');
    } finally { setBusy(false); }
  }

  if (!branchId) return <p className="text-[var(--muted)]">Pilih branch dulu.</p>;

  return (
    <div className="animate-float-up" data-ace="1">
      <h1 className="text-2xl font-bold">Tip staf</h1>
      {loading && <p className="mt-4 text-[var(--muted)]" role="status">Memuat tip…</p>}
      {error && <p className="mt-4 text-sm text-red-700" role="alert">{error}</p>}
      <div className="mt-6 space-y-2">
        {tips.map((t) => (
          <div key={t.id} className="rounded-2xl border border-[#e8e4de] bg-white p-4 shadow-sm flex flex-wrap items-center justify-between gap-2 text-sm">
            <div>
              <div className="font-medium">
                {formatIdr(t.amount)} · <AceBadge tone={t.status === 'ALLOCATED' ? 'ok' : 'warn'}>{t.status}</AceBadge> · {t.allocationMode}
              </div>
              <div className="text-[var(--muted)]">
                Order {t.order?.orderNumber || t.orderId?.slice?.(0, 8)} ·{' '}
                {t.createdAt ? new Date(t.createdAt).toLocaleString('id-ID') : ''}
              </div>
            </div>
            {t.status !== 'ALLOCATED' && (
              <button className="inline-flex items-center justify-center rounded-xl bg-[#c4a574] px-4 py-2.5 text-sm font-semibold text-[#1a1a1a] text-sm" onClick={() => openAlloc(t)}>
                Alokasi
              </button>
            )}
          </div>
        ))}
        {!loading && !tips.length && !error && <EmptyState title="Belum ada tip." />}
      </div>

      {selected && (
        <div className="rounded-2xl border border-[#e8e4de] bg-white p-4 shadow-sm mt-6 max-w-lg space-y-2">
          <h2 className="font-semibold">Alokasi {formatIdr(selected.amount)}</h2>
          {splits.map((s, i) => (
            <div key={i} className="flex gap-2">
              <select
                className="input flex-1"
                aria-label={`Staf untuk split ${i + 1}`}
                value={s.userId}
                onChange={(e) => {
                  const next = [...splits];
                  next[i] = { ...next[i], userId: e.target.value };
                  setSplits(next);
                }}
              >
                <option value="">Pilih staf</option>
                {staff.map((m) => {
                  const id = m.userId || m.user?.id;
                  return (
                    <option key={id} value={id}>
                      {m.user?.name || m.user?.email || id}
                    </option>
                  );
                })}
              </select>
              <input
                className="input w-28"
                type="number"
                aria-label={`Jumlah split ${i + 1} dalam IDR`}
                min={0}
                value={s.amount}
                onChange={(e) => {
                  const next = [...splits];
                  next[i] = { ...next[i], amount: Number(e.target.value) || 0 };
                  setSplits(next);
                }}
              />
            </div>
          ))}
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-xl border border-[#d4d0c8] px-4 py-2.5 text-sm font-semibold text-sm"
            onClick={() => setSplits([...splits, { userId: '', amount: 0 }])}
          >
            + baris
          </button>
          <p className="text-xs text-[var(--muted)]">
            Total split: {formatIdr(splits.reduce((a, x) => a + x.amount, 0))} (harus ={' '}
            {formatIdr(selected.amount)})
          </p>
          <div className="flex gap-2">
            <button className="inline-flex items-center justify-center rounded-xl bg-[#1a1a1a] px-4 py-2.5 text-sm font-semibold text-white" type="button" disabled={busy} onClick={allocate}>
              {busy ? 'Menyimpan…' : 'Simpan'}
            </button>
            <button className="inline-flex items-center justify-center rounded-xl border border-[#d4d0c8] px-4 py-2.5 text-sm font-semibold" type="button" disabled={busy} onClick={() => setSelected(null)}>
              Batal
            </button>
          </div>
          {msg && <p className="text-sm" role="status">{msg}</p>}
        </div>
      )}
    </div>
  );
}
