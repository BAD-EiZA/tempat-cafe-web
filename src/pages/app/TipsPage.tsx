import { useEffect, useState } from 'react';
import { AceButton } from '@/components/ace/AceButton';
import { AceInput, AceSelect } from '@/components/ace/AceInput';
import { AceBadge, EmptyState } from '@/components/ace/PageShell';
import { PageHeader } from '@/components/ace/PageHeader';
import { useApi } from '../../hooks/useApi';
import { useAppStore } from '../../lib/store';
import { formatIdr } from '../../lib/api';
import { Loader } from '@/components/ui/loader';

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
    if (!branchId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      setTips(await api<any[]>(`/tips?branchId=${branchId}`));
      if (organizationId) setStaff(await api<any[]>(`/organizations/${organizationId}/members`));
    } catch (e: any) {
      setError(e.message || 'Gagal memuat tip.');
    } finally {
      setLoading(false);
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
      const rest = t.amount - each * members.length;
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
    if (total !== selected.amount) {
      setError('Total split harus sama dengan jumlah tip.');
      return;
    }
    if (!window.confirm(`Alokasikan tip ${formatIdr(selected.amount)}?`)) return;
    setMsg('');
    setError('');
    setBusy(true);
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
    } finally {
      setBusy(false);
    }
  }

  if (!branchId) {
    return (
      <div className="space-y-4">
        <PageHeader title="Tip staf" />
        <EmptyState title="Pilih branch dulu" description="Gunakan switcher cabang di atas." />
      </div>
    );
  }

  return (
    <div className="animate-float-up space-y-6">
      <PageHeader title="Tip staf" description="Alokasi tip ke anggota shift" />
      {loading && <Loader label="Memuat tip…" />}
      {error && (
        <p className="text-sm text-[var(--danger)]" role="alert">
          {error}
        </p>
      )}
      <ul className="divide-y divide-cafe-border overflow-hidden rounded-2xl border border-cafe-border bg-cafe-card">
        {tips.map((t) => (
          <li
            key={t.id}
            className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2 font-medium text-cafe-ink">
                {formatIdr(t.amount)}
                <AceBadge tone={t.status === 'ALLOCATED' ? 'ok' : 'warn'}>{t.status}</AceBadge>
                <span className="text-cafe-muted">{t.allocationMode}</span>
              </div>
              <div className="mt-0.5 text-cafe-muted">
                Order {t.order?.orderNumber || t.orderId?.slice?.(0, 8)} ·{' '}
                {t.createdAt ? new Date(t.createdAt).toLocaleString('id-ID') : ''}
              </div>
            </div>
            {t.status !== 'ALLOCATED' && (
              <AceButton variant="accent" className="!text-sm" onClick={() => openAlloc(t)}>
                Alokasi
              </AceButton>
            )}
          </li>
        ))}
      </ul>
      {!loading && !tips.length && !error && <EmptyState title="Belum ada tip" />}

      {selected && (
        <div className="max-w-lg space-y-3 rounded-2xl border border-cafe-border bg-cafe-card p-4 shadow-sm">
          <h2 className="text-sm font-bold text-cafe-ink">
            Alokasi {formatIdr(selected.amount)}
          </h2>
          {splits.map((s, i) => (
            <div key={i} className="flex flex-wrap gap-2">
              <AceSelect
                containerClassName="min-w-0 flex-1"
                label={i === 0 ? 'Staf' : undefined}
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
              </AceSelect>
              <AceInput
                containerClassName="w-28"
                label={i === 0 ? 'Jumlah' : undefined}
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
          <AceButton
            type="button"
            variant="ghost"
            className="!text-sm"
            onClick={() => setSplits([...splits, { userId: '', amount: 0 }])}
          >
            + baris
          </AceButton>
          <p className="text-xs text-cafe-muted">
            Total split: {formatIdr(splits.reduce((a, x) => a + x.amount, 0))} (harus ={' '}
            {formatIdr(selected.amount)})
          </p>
          <div className="flex gap-2">
            <AceButton type="button" variant="primary" disabled={busy} onClick={allocate}>
              {busy ? 'Menyimpan…' : 'Simpan'}
            </AceButton>
            <AceButton
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => setSelected(null)}
            >
              Batal
            </AceButton>
          </div>
          {msg && (
            <p className="text-sm text-cafe-muted" role="status">
              {msg}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
