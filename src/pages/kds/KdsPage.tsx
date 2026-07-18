import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '@/hooks/useApi';
import { useRealtime } from '@/hooks/useRealtime';
import { useAppStore } from '@/lib/store';
import { TenantSwitcher } from '@/components/TenantSwitcher';
import { OpsShell } from '@/components/ace/OpsShell';
import { AceButton } from '@/components/ace/AceButton';
import { AceSelect } from '@/components/ace/AceInput';
import { GlareCard } from '@/components/ui/glare-card';
import { ActionError, ConnectionStatus, statusLabel } from '@/components/ace/OpsFeedback';

type KitchenStatus = 'QUEUED' | 'ACKNOWLEDGED' | 'PREPARING' | 'READY' | 'SERVED';

const NEXT: Partial<Record<KitchenStatus, KitchenStatus>> = {
  QUEUED: 'ACKNOWLEDGED',
  ACKNOWLEDGED: 'PREPARING',
  PREPARING: 'READY',
  READY: 'SERVED',
};

const COLUMNS: KitchenStatus[] = ['QUEUED', 'ACKNOWLEDGED', 'PREPARING', 'READY'];

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
      if (list.length > prev.length && prev.length > 0) {
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
      <div className="p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-bold">KDS</h1>
          <div className="flex items-center gap-2 text-black">
            <TenantSwitcher />
            <AceButton as={Link} to="/app" variant="ghost" className="!border-white/20 !text-white !text-sm">
              Merchant
            </AceButton>
          </div>
        </div>
        <ConnectionStatus connected={connected} lastSync={lastSync} error={loadError} onRetry={() => load()} />
        <ActionError message={actionError} />
        <AceSelect
          className="mb-3 max-w-xs !bg-white/5 !text-white !border-white/20"
          value={stationFilter}
          onChange={(e) => setStationFilter(e.target.value)}
        >
          <option value="">Semua station</option>
          {stations.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </AceSelect>
        <div className="grid gap-3 md:grid-cols-4">
          {COLUMNS.map((col) => (
            <div key={col}>
              <h2 className="mb-2 text-sm font-bold tracking-wide text-white/50">{statusLabel(col)}</h2>
              <div className="space-y-2">
                {tickets
                  .filter((t) => t.status === col)
                  .map((t) => (
                    <GlareCard
                      key={t.id}
                      className="w-full !border-white/10 !bg-white/5 !text-white"
                    >
                      <div className="flex justify-between text-sm">
                        <span className="font-bold">{t.order?.orderNumber || t.orderId?.slice(0, 6)}</span>
                        <span className="text-white/50">{t.station?.name || '—'}</span>
                      </div>
                      <ul className="mt-2 space-y-1 text-sm">
                        {(t.items || t.lines || []).map((i: any) => (
                          <li key={i.id || i.menuItemId}>
                            {i.quantity || 1}× {i.name || i.menuItem?.name}
                          </li>
                        ))}
                      </ul>
                      <AceButton
                        variant="accent"
                        className="mt-3 w-full"
                        disabled={!!busyId}
                        onClick={() => advance(t.id, t.status as KitchenStatus)}
                      >
                        {busyId === t.id ? 'Memproses...' : `Tandai ${statusLabel(NEXT[t.status as KitchenStatus])}`}
                      </AceButton>
                    </GlareCard>
                  ))}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-white/30">Tickets: {prevCount}</p>
      </div>
    </OpsShell>
  );
}
