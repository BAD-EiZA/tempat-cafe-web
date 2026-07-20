import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '@/hooks/useApi';
import { useRealtime } from '@/hooks/useRealtime';
import { useAppStore } from '@/lib/store';
import { formatIdr } from '@/lib/api';
import { TenantSwitcher } from '@/components/TenantSwitcher';
import { OpsShell } from '@/components/ace/OpsShell';
import { AceButton } from '@/components/ace/AceButton';
import { ActionError, ConnectionStatus, statusLabel } from '@/components/ace/OpsFeedback';
import { cn } from '@/lib/utils';

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
    setActionError('');
    try {
      const orders = await api<any[]>(`/orders?branchId=${branchId}`);
      setDetail(orders.filter((o) => o.tableId === t.id).slice(0, 10));
    } catch (e: any) {
      setDetail([]);
      setActionError(e.message || 'Order meja gagal dimuat');
    }
  }

  return (
    <OpsShell>
      <div className="p-3 sm:p-4">
        <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Waiter</h1>
            <p className="text-xs ops-muted">
              {ready.length} siap diantar · {tables.length} meja
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <TenantSwitcher />
            <AceButton as={Link} to="/app" variant="ghost" className="!border-white/15 !text-white !text-sm">
              Merchant
            </AceButton>
          </div>
        </header>

        <ConnectionStatus
          connected={connected}
          lastSync={lastSync}
          error={loadError}
          onRetry={() => load()}
        />
        <ActionError message={actionError} />

        <section className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold">Siap diantar</h2>
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-200">
              {ready.length}
            </span>
          </div>
          <div className="space-y-2">
            {ready.map((o) => (
              <div
                key={o.id}
                className="ops-panel flex flex-wrap items-center justify-between gap-3 border-l-4 border-l-emerald-400 p-4"
              >
                <div>
                  <div className="text-lg font-bold">{o.orderNumber}</div>
                  <div className="text-sm ops-muted">{formatIdr(o.grandTotal)}</div>
                  {o.table?.name && (
                    <div className="mt-0.5 text-xs text-amber-200/90">Meja {o.table.name}</div>
                  )}
                </div>
                <AceButton
                  variant="accent"
                  className="!min-h-12 !px-5"
                  disabled={!!busyId}
                  onClick={() => serve(o.id)}
                >
                  {busyId === o.id ? 'Memproses...' : 'Sudah diantar'}
                </AceButton>
              </div>
            ))}
            {!ready.length && (
              <div className="ops-empty">Tidak ada order siap. Tunggu dapur.</div>
            )}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="mb-2 text-sm font-bold">Meja</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {tables.map((t) => {
              const occupied = t.status === 'OCCUPIED';
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => openTable(t)}
                  className={cn(
                    'ops-tile min-h-[4.5rem] text-center',
                    occupied && '!border-amber-400/40 !bg-amber-500/10',
                    selected?.id === t.id && 'ring-2 ring-[var(--ops-accent)]',
                  )}
                >
                  <div className="font-bold">{t.name}</div>
                  <div className="mt-1 text-xs ops-muted">{statusLabel(t.status)}</div>
                </button>
              );
            })}
          </div>
          {!tables.length && <div className="ops-empty mt-2">Belum ada meja.</div>}
        </section>

        {selected && (
          <section className="ops-panel mt-4 p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold">Meja {selected.name}</h3>
              <button
                type="button"
                className="text-sm font-medium text-white/60 underline-offset-2 hover:underline"
                onClick={() => setSelected(null)}
              >
                Tutup
              </button>
            </div>
            <ul className="mt-3 divide-y divide-white/10 text-sm">
              {detail.map((o) => (
                <li key={o.id} className="flex justify-between gap-2 py-2 first:pt-0">
                  <span>
                    {o.orderNumber}{' '}
                    <span className="ops-muted">· {statusLabel(o.status)}</span>
                  </span>
                  <span className="tabular-nums font-medium">{formatIdr(o.grandTotal)}</span>
                </li>
              ))}
              {!detail.length && (
                <li className="py-2 ops-muted">Tidak ada order meja ini.</li>
              )}
            </ul>
          </section>
        )}
      </div>
    </OpsShell>
  );
}
