import { useEffect, useState } from 'react';
import { AceButton } from '@/components/ace/AceButton';
import { AceInput, AceSelect } from '@/components/ace/AceInput';
import { EmptyState } from '@/components/ace/PageShell';
import { PageHeader } from '@/components/ace/PageHeader';
import { useApi } from '../../hooks/useApi';
import { useAppStore } from '../../lib/store';
import { Loader } from '@/components/ui/loader';

export function PrintersPage() {
  const api = useApi();
  const branchId = useAppStore((s) => s.branchId);
  const [devices, setDevices] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [name, setName] = useState('Kitchen Printer');
  const [agentName, setAgentName] = useState('Local Agent');
  const [map, setMap] = useState({ printerId: '', stationId: '' });
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    if (!branchId) return;
    setLoading(true);
    setError('');
    try {
      const [d, a, s] = await Promise.all([
        api<any[]>(`/printers?branchId=${branchId}`),
        api<any[]>(`/printers/agents?branchId=${branchId}`),
        api<any[]>(`/stations?branchId=${branchId}`).catch(() => []),
      ]);
      setDevices(d);
      setAgents(a);
      setStations(s);
    } catch (e: any) {
      setError(e.message || 'Gagal memuat printer.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, [api, branchId]);

  async function addPrinter(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/printers', {
        method: 'POST',
        body: { branchId, name, connectionType: 'AGENT', type: 'KITCHEN' },
      });
      setName('Kitchen Printer');
      await load();
    } catch (e: any) {
      setError(e.message || 'Gagal menambah printer.');
    } finally {
      setBusy(false);
    }
  }

  async function registerAgent(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await api<any>('/printers/agents/register', {
        method: 'POST',
        body: { branchId, name: agentName },
      });
      setToken(res.deviceToken || res.token || '');
      await load();
    } catch (e: any) {
      setError(e.message || 'Gagal mendaftarkan agent.');
    } finally {
      setBusy(false);
    }
  }

  async function mapStation(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/printers/map-station', { method: 'POST', body: map });
      await load();
    } catch (e: any) {
      setError(e.message || 'Gagal memetakan station.');
    } finally {
      setBusy(false);
    }
  }

  if (!branchId) {
    return (
      <div className="space-y-4">
        <PageHeader title="Printer & agent" />
        <EmptyState title="Pilih branch dulu" description="Gunakan switcher cabang di atas." />
      </div>
    );
  }

  return (
    <div className="animate-float-up space-y-6">
      <PageHeader title="Printer & agent" description="Device, agent, dan mapping station" />
      {loading && <Loader label="Memuat…" />}
      {error && (
        <p className="text-sm text-[var(--danger)]" role="alert">
          {error}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <form
          className="space-y-3 rounded-2xl border border-cafe-border bg-cafe-card p-4 shadow-sm"
          onSubmit={addPrinter}
        >
          <h2 className="text-sm font-bold text-cafe-ink">Device</h2>
          <AceInput
            label="Nama printer"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <AceButton type="submit" variant="accent" disabled={busy}>
            {busy ? 'Menyimpan…' : 'Tambah printer'}
          </AceButton>
          <ul className="divide-y divide-cafe-border text-sm">
            {devices.map((d) => (
              <li key={d.id} className="flex justify-between gap-2 py-1.5">
                <span className="font-medium text-cafe-ink">{d.name}</span>
                <span className="font-mono text-xs text-cafe-muted">{d.id.slice(0, 8)}</span>
              </li>
            ))}
          </ul>
          {!devices.length && <p className="text-sm text-cafe-muted">Belum ada printer</p>}
        </form>

        <form
          className="space-y-3 rounded-2xl border border-cafe-border bg-cafe-card p-4 shadow-sm"
          onSubmit={registerAgent}
        >
          <h2 className="text-sm font-bold text-cafe-ink">Print agent</h2>
          <AceInput
            label="Nama agent"
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            required
          />
          <AceButton type="submit" variant="accent" disabled={busy}>
            {busy ? 'Mendaftarkan…' : 'Register agent'}
          </AceButton>
          {token && (
            <p className="break-all text-xs text-cafe-muted" role="status">
              Device token: <code className="text-cafe-ink">{token}</code>
            </p>
          )}
          <ul className="divide-y divide-cafe-border text-sm">
            {agents.map((a) => (
              <li key={a.id} className="py-1.5">
                <span className="font-medium text-cafe-ink">{a.name}</span>
                <span className="ml-2 text-cafe-muted">
                  · {a.lastHeartbeat || a.lastSeenAt || '-'}
                </span>
              </li>
            ))}
          </ul>
          {!loading && !agents.length && (
            <p className="text-sm text-cafe-muted">Belum ada agent.</p>
          )}
        </form>
      </div>

      <form
        className="max-w-md space-y-3 rounded-2xl border border-cafe-border bg-cafe-card p-4 shadow-sm"
        onSubmit={mapStation}
      >
        <h2 className="text-sm font-bold text-cafe-ink">Map station → printer</h2>
        <AceSelect
          label="Printer"
          value={map.printerId}
          onChange={(e) => setMap({ ...map, printerId: e.target.value })}
          required
        >
          <option value="">Pilih printer</option>
          {devices.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </AceSelect>
        <AceSelect
          label="Station"
          value={map.stationId}
          onChange={(e) => setMap({ ...map, stationId: e.target.value })}
          required
        >
          <option value="">Pilih station</option>
          {stations.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.code})
            </option>
          ))}
        </AceSelect>
        <AceButton type="submit" variant="primary" disabled={busy}>
          {busy ? 'Menyimpan…' : 'Map'}
        </AceButton>
      </form>
    </div>
  );
}
