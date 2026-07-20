import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '@/hooks/useApi';
import { useRealtime } from '@/hooks/useRealtime';
import { useAppStore } from '@/lib/store';
import { TenantSwitcher } from '@/components/TenantSwitcher';
import { OpsShell } from '@/components/ace/OpsShell';
import { AceButton } from '@/components/ace/AceButton';
import { AceSelect } from '@/components/ace/AceInput';
import { ActionError, ConnectionStatus, statusLabel } from '@/components/ace/OpsFeedback';
import { cn } from '@/lib/utils';

type KitchenStatus = 'QUEUED' | 'ACKNOWLEDGED' | 'PREPARING' | 'READY' | 'SERVED';

const NEXT: Partial<Record<KitchenStatus, KitchenStatus>> = {
  QUEUED: 'ACKNOWLEDGED',
  ACKNOWLEDGED: 'PREPARING',
  PREPARING: 'READY',
  READY: 'SERVED',
};

const COLUMNS: KitchenStatus[] = ['QUEUED', 'ACKNOWLEDGED', 'PREPARING', 'READY'];

const COL_ACCENT: Record<KitchenStatus, string> = {
  QUEUED: 'border-l-white/30',
  ACKNOWLEDGED: 'border-l-sky-400',
  PREPARING: 'border-l-amber-400',
  READY: 'border-l-emerald-400',
  SERVED: 'border-l-emerald-600',
};

export function KdsPage() {
  const api = useApi();
  const branchId = useAppStore((s) => s.branchId);
  const setTenant = useAppStore((s) => s.setTenant);
  const [tickets, setTickets] = useState<any[]>([]);
  const [prevCount, setPrevCount] = useState(0);
  const [stationFilter, setStationFilter] = useState('');
  const [stations, setStations] = useState<any[]>([]);
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

  useEffect(() => {
    if (!branchId) return;
    api<any[]>(`/stations?branchId=${branchId}`)
      .then(setStations)
      .catch(() => setStations([]));
  }, [api, branchId]);

  const load = useCallback(async () => {
    if (!branchId) return;
    const q = stationFilter ? `&stationId=${stationFilter}` : '';
    try {
      const list = await api<any[]>(`/kitchen/tickets?branchId=${branchId}${q}`);
      setTickets((prev) => {
        const prevIds = new Set(prev.map((t) => t.id));
        const hasNew =
          prev.length > 0 && list.some((t) => t.id && !prevIds.has(t.id));
        if (hasNew) {
          try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.connect(g);
            g.connect(ctx.destination);
            o.frequency.value = 880;
            g.gain.value = 0.05;
            o.start();
            setTimeout(() => o.stop(), 180);
          } catch {
            /* ignore */
          }
        }
        return list;
      });
      setPrevCount(list.length);
      setLastSync(new Date());
      setLoadError('');
    } catch (e: any) {
      setLoadError(e.message || 'Data dapur gagal dimuat');
    }
  }, [api, branchId, stationFilter]);

  useEffect(() => {
    load().catch(() => undefined);
    const t = setInterval(() => load().catch(() => undefined), 6000);
    return () => clearInterval(t);
  }, [load]);

  const { connected } = useRealtime(branchId, () => {
    load().catch(() => undefined);
  });

  async function advance(id: string, status: KitchenStatus) {
    const next = NEXT[status];
    if (!next || busyId) return;
    setBusyId(id);
    setActionError('');
    try {
      await api(`/kitchen/tickets/${id}/status`, { method: 'PATCH', body: { status: next } });
      await load();
    } catch (e: any) {
      setActionError(e.message || 'Status tiket gagal diubah');
    } finally {
      setBusyId('');
    }
  }

  return (
    <OpsShell>
      <div className="flex min-h-[100dvh] flex-col p-3 sm:p-4">
        <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold tracking-tight">KDS</h1>
            <p className="text-xs ops-muted">Kitchen display · {prevCount} ticket</p>
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

        <AceSelect
          className="mb-3 max-w-xs"
          value={stationFilter}
          onChange={(e) => setStationFilter(e.target.value)}
          aria-label="Filter station"
        >
          <option value="">Semua station</option>
          {stations.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </AceSelect>

        <div className="-mx-1 flex flex-1 gap-3 overflow-x-auto px-1 pb-2">
          {COLUMNS.map((col) => {
            const colTickets = tickets.filter((t) => t.status === col);
            return (
              <section
                key={col}
                className="flex min-h-[50vh] w-[min(100%,240px)] shrink-0 flex-col sm:min-w-[220px] md:w-auto md:min-w-0 md:flex-1"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-white/50">
                    {statusLabel(col)}
                  </h2>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold tabular-nums">
                    {colTickets.length}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-2 overflow-y-auto pr-0.5">
                  {colTickets.map((t) => (
                    <article
                      key={t.id}
                      className={cn(
                        'ops-panel border-l-4 p-3',
                        COL_ACCENT[col],
                      )}
                    >
                      <div className="flex justify-between gap-2 text-sm">
                        <span className="font-bold">
                          {t.order?.orderNumber || t.orderId?.slice(0, 6)}
                        </span>
                        <span className="ops-muted text-xs">
                          {t.station?.name || '-'}
                        </span>
                      </div>
                      <ul className="mt-2 space-y-1 text-sm">
                        {(t.items || t.lines || []).map((i: any) => (
                          <li key={i.id || i.menuItemId}>
                            <span className="font-bold text-[var(--ops-accent)]">
                              {i.quantity || 1}x
                            </span>{' '}
                            {i.name || i.menuItem?.name}
                          </li>
                        ))}
                      </ul>
                      {NEXT[t.status as KitchenStatus] && (
                        <AceButton
                          variant="accent"
                          className="mt-3 w-full !text-sm"
                          disabled={!!busyId}
                          onClick={() => advance(t.id, t.status as KitchenStatus)}
                        >
                          {busyId === t.id
                            ? 'Memproses...'
                            : `Tandai ${statusLabel(NEXT[t.status as KitchenStatus])}`}
                        </AceButton>
                      )}
                    </article>
                  ))}
                  {!colTickets.length && (
                    <div className="ops-empty py-8">Kosong</div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </OpsShell>
  );
}
