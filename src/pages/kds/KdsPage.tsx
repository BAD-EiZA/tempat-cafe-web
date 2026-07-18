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

const NEXT: Record<string, string> = {
  QUEUED: 'IN_PROGRESS',
  IN_PROGRESS: 'READY',
  READY: 'BUMPED',
};

export function KdsPage() {
  const api = useApi();
  const branchId = useAppStore((s) => s.branchId);
  const setTenant = useAppStore((s) => s.setTenant);
  const [tickets, setTickets] = useState<any[]>([]);
  const [prevCount, setPrevCount] = useState(0);
  const [stationFilter, setStationFilter] = useState('');
  const [stations, setStations] = useState<any[]>([]);

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
  }, [api, branchId, stationFilter]);

  useEffect(() => {
    load().catch(() => undefined);
    const t = setInterval(() => load().catch(() => undefined), 6000);
    return () => clearInterval(t);
  }, [load]);

  const { connected } = useRealtime(branchId, () => {
    load().catch(() => undefined);
  });

  async function advance(id: string, status: string) {
    const next = NEXT[status];
    if (!next) return;
    await api(`/kitchen/tickets/${id}/status`, { method: 'PATCH', body: { status: next } });
    await load();
  }

  const columns = ['QUEUED', 'IN_PROGRESS', 'READY'];

  return (
    <OpsShell>
      <div className="p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-bold">KDS</h1>
          <div className="flex items-center gap-2 text-black">
            <span className="text-xs text-white/50">SSE {connected ? 'on' : 'off'}</span>
            <TenantSwitcher />
            <AceButton as={Link} to="/app" variant="ghost" className="!border-white/20 !text-white !text-sm">
              Merchant
            </AceButton>
          </div>
        </div>
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
        <div className="grid gap-3 md:grid-cols-3">
          {columns.map((col) => (
            <div key={col}>
              <h2 className="mb-2 text-sm font-bold tracking-wide text-white/50">{col}</h2>
              <div className="space-y-2">
                {tickets
                  .filter((t) => t.status === col)
                  .map((t) => (
                    <GlareCard
                      key={t.id}
                      className="w-full !border-white/10 !bg-white/5 !text-white"
                      onClick={() => advance(t.id, t.status)}
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
                      <p className="mt-2 text-xs text-white/40">Tap → {NEXT[t.status] || 'done'}</p>
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
