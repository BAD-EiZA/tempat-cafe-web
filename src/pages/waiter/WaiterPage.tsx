import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '@/hooks/useApi';
import { useRealtime } from '@/hooks/useRealtime';
import { useAppStore } from '@/lib/store';
import { formatIdr } from '@/lib/api';
import { TenantSwitcher } from '@/components/TenantSwitcher';
import { OpsShell } from '@/components/ace/OpsShell';
import { AceCard } from '@/components/ace/AceCard';
import { AceButton } from '@/components/ace/AceButton';
import { GlareCard } from '@/components/ui/glare-card';
import { EmptyState } from '@/components/ace/PageShell';
import { ActionError, ConnectionStatus, statusLabel } from '@/components/ace/OpsFeedback';

export function WaiterPage() {
  const api = useApi();
  const branchId = useAppStore((s) => s.branchId);
  const setTenant = useAppStore((s) => s.setTenant);
  const [tables, setTables] = useState<any[]>([]);
  const [ready, setReady] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [detail, setDetail] = useState<any[]>([]);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busyId, setBusyId] = useState('');

  useEffect(() => {
    if (branchId) return;
    api<any>('/auth/me')
      .then((me) => {
        const orgId = me.memberships?.[0]?.organizationId;
        if (!orgId) return;
        api<any[]>(`/branches?organizationId=${orgId}`).then((b) => {
          if (b[0]) setTenant(orgId, b[0].id);
        });
      })
      .catch(() => undefined);
  }, [api, branchId, setTenant]);

  const load = useCallback(async () => {
    if (!branchId) return;
    try {
      const [t, orders] = await Promise.all([
        api<any[]>(`/tables?branchId=${branchId}`),
        api<any[]>(`/pos/active-orders?branchId=${branchId}`),
      ]);
      setTables(t);
      setReady(orders.filter((o) => o.status === 'READY' || o.status === 'PARTIALLY_READY'));
      setLastSync(new Date());
      setLoadError('');
    } catch (e: any) {
      setLoadError(e.message || 'Data pelayan gagal dimuat');
    }
  }, [api, branchId]);

  useEffect(() => {
    load().catch(() => undefined);
    const i = setInterval(() => load().catch(() => undefined), 8000);
    return () => clearInterval(i);
  }, [load]);

  const { connected } = useRealtime(branchId, () => {
    load().catch(() => undefined);
  });

  async function serve(id: string) {
    if (busyId || !window.confirm('Konfirmasi pesanan sudah diantar?')) return;
    setBusyId(id);
    setActionError('');
    try {
      await api(`/orders/${id}/status`, { method: 'PATCH', body: { status: 'SERVED' } });
      await load();
    } catch (e: any) {
      setActionError(e.message || 'Pesanan gagal ditandai diantar');
    } finally {
      setBusyId('');
    }
  }

  async function openTable(t: any) {
    setSelected(t);
    const orders = await api<any[]>(`/orders?branchId=${branchId}`);
    setDetail(orders.filter((o) => o.tableId === t.id).slice(0, 10));
  }

  return (
    <OpsShell>
      <div className="p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-bold">Waiter</h1>
          <div className="flex items-center gap-2 text-black">
            <TenantSwitcher />
            <AceButton as={Link} to="/app" variant="ghost" className="!border-white/20 !text-white !text-sm">
              Merchant
            </AceButton>
          </div>
        </div>
        <ConnectionStatus connected={connected} lastSync={lastSync} error={loadError} onRetry={() => load()} />
        <ActionError message={actionError} />
        <h2 className="font-semibold">Siap diantar</h2>
        <div className="mt-2 space-y-2">
          {ready.map((o) => (
            <AceCard
              key={o.id}
              className="flex items-center justify-between !border-white/10 !bg-white/5 !text-white"
            >
              <div>
                <div className="font-bold">{o.orderNumber}</div>
                <div className="text-sm text-white/50">{formatIdr(o.grandTotal)}</div>
              </div>
              <AceButton variant="accent" className="text-sm" disabled={!!busyId} onClick={() => serve(o.id)}>
                {busyId === o.id ? 'Memproses...' : 'Sudah diantar'}
              </AceButton>
            </AceCard>
          ))}
          {!ready.length && <EmptyState title="Tidak ada order ready." />}
        </div>
        <h2 className="mt-8 font-semibold">Meja</h2>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {tables.map((t) => (
            <GlareCard
              key={t.id}
              className={`text-center !border-white/10 !bg-white/5 !text-white ${
                t.status === 'OCCUPIED' ? '!border-amber-400/50 !bg-amber-500/10' : ''
              }`}
              onClick={() => openTable(t)}
            >
              <div className="font-bold">{t.name}</div>
               <div className="text-xs text-white/50">{statusLabel(t.status)}</div>
            </GlareCard>
          ))}
        </div>
        {selected && (
          <AceCard className="mt-4 !border-white/10 !bg-white/5 !text-white">
            <div className="flex justify-between">
              <h3 className="font-semibold">Meja {selected.name}</h3>
              <button className="text-sm underline text-white/60" onClick={() => setSelected(null)}>
                Tutup
              </button>
            </div>
            <ul className="mt-2 space-y-1 text-sm">
              {detail.map((o) => (
                <li key={o.id} className="flex justify-between">
                  <span>
                     {o.orderNumber} · {statusLabel(o.status)}
                  </span>
                  <span>{formatIdr(o.grandTotal)}</span>
                </li>
              ))}
              {!detail.length && <li className="text-white/50">Tidak ada order meja ini.</li>}
            </ul>
          </AceCard>
        )}
      </div>
    </OpsShell>
  );
}
