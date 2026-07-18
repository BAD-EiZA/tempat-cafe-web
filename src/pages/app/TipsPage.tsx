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

  async function load() {
    if (!branchId) return;
    setTips(await api<any[]>(`/tips?branchId=${branchId}`));
    if (organizationId) {
      setStaff(await api<any[]>(`/organizations/${organizationId}/members`).catch(() => []));
    }
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
    setMsg('');
    try {
      await api(`/tips/${selected.id}/allocate`, {
        method: 'POST',
        body: { splits: splits.filter((s) => s.userId && s.amount > 0) },
      });
      setMsg('Alokasi tersimpan');
      setSelected(null);
      await load();
    } catch (e: any) {
      setMsg(e.message || 'Gagal');
    }
  }

  if (!branchId) return <p className="text-[var(--muted)]">Pilih branch dulu.</p>;

  return (
    <div className="animate-float-up" data-ace="1">
      <h1 className="text-2xl font-bold">Tip staf</h1>
      <div className="mt-6 space-y-2">
        {tips.map((t) => (
          <div key={t.id} className="rounded-2xl border border-[#e8e4de] bg-white p-4 shadow-sm flex flex-wrap items-center justify-between gap-2 text-sm">
            <div>
              <div className="font-medium">
                {formatIdr(t.amount)} · {t.status} · {t.allocationMode}
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
        {!tips.length && <p className="text-[var(--muted)]">Belum ada tip.</p>}
      </div>

      {selected && (
        <div className="rounded-2xl border border-[#e8e4de] bg-white p-4 shadow-sm mt-6 max-w-lg space-y-2">
          <h2 className="font-semibold">Alokasi {formatIdr(selected.amount)}</h2>
          {splits.map((s, i) => (
            <div key={i} className="flex gap-2">
              <select
                className="input flex-1"
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
            <button className="inline-flex items-center justify-center rounded-xl bg-[#1a1a1a] px-4 py-2.5 text-sm font-semibold text-white" type="button" onClick={allocate}>
              Simpan
            </button>
            <button className="inline-flex items-center justify-center rounded-xl border border-[#d4d0c8] px-4 py-2.5 text-sm font-semibold" type="button" onClick={() => setSelected(null)}>
              Batal
            </button>
          </div>
          {msg && <p className="text-sm">{msg}</p>}
        </div>
      )}
    </div>
  );
}
