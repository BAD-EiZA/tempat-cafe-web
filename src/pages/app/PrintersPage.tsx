import { useEffect, useState } from 'react';
import { AceCard } from '@/components/ace/AceCard';
import { AceButton } from '@/components/ace/AceButton';
import { AceBadge, EmptyState, StatCard } from '@/components/ace/PageShell';
import { useApi } from '../../hooks/useApi';
import { useAppStore } from '../../lib/store';

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

  async function load() {
    if (!branchId) return;
    setLoading(true);
    try {
      const [d, a, s] = await Promise.all([
        api<any[]>(`/printers?branchId=${branchId}`),
        api<any[]>(`/printers/agents?branchId=${branchId}`),
        api<any[]>(`/stations?branchId=${branchId}`).catch(() => []),
      ]);
      setDevices(d);
      setAgents(a);
      setStations(s);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, [api, branchId]);

  async function addPrinter(e: React.FormEvent) {
    e.preventDefault();
    await api('/printers', {
      method: 'POST',
      body: { branchId, name, connectionType: 'AGENT', type: 'KITCHEN' },
    });
    setName('Kitchen Printer');
    await load();
  }

  async function registerAgent(e: React.FormEvent) {
    e.preventDefault();
    const res = await api<any>('/printers/agents/register', {
      method: 'POST',
      body: { branchId, name: agentName },
    });
    setToken(res.deviceToken || res.token || '');
    await load();
  }

  async function mapStation(e: React.FormEvent) {
    e.preventDefault();
    await api('/printers/map-station', { method: 'POST', body: map });
    await load();
  }

  if (!branchId) return <p className="text-[var(--muted)]">Pilih branch dulu.</p>;

  return (
    <div className="animate-float-up" data-ace="1">
      <h1 className="text-2xl font-bold">Printer & agent</h1>
      {loading && <p className="mt-2 text-sm text-[var(--muted)]">Memuat…</p>}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <form className="rounded-2xl border border-[#e8e4de] bg-white p-4 shadow-sm space-y-2" onSubmit={addPrinter}>
          <h2 className="font-semibold">Device</h2>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          <button className="inline-flex items-center justify-center rounded-xl bg-[#c4a574] px-4 py-2.5 text-sm font-semibold text-[#1a1a1a]" type="submit">
            Tambah printer
          </button>
          <ul className="text-sm">
            {devices.map((d) => (
              <li key={d.id}>
                {d.name} · {d.id.slice(0, 8)}
              </li>
            ))}
            {!devices.length && <li className="text-[var(--muted)]">Belum ada printer</li>}
          </ul>
        </form>

        <form className="rounded-2xl border border-[#e8e4de] bg-white p-4 shadow-sm space-y-2" onSubmit={registerAgent}>
          <h2 className="font-semibold">Print agent</h2>
          <input
            className="input"
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            required
          />
          <button className="inline-flex items-center justify-center rounded-xl bg-[#c4a574] px-4 py-2.5 text-sm font-semibold text-[#1a1a1a]" type="submit">
            Register agent
          </button>
          {token && (
            <p className="break-all text-xs">
              Device token: <code>{token}</code>
            </p>
          )}
          <ul className="text-sm">
            {agents.map((a) => (
              <li key={a.id}>
                {a.name} · {a.lastHeartbeat || a.lastSeenAt || '—'}
              </li>
            ))}
          </ul>
        </form>
      </div>

      <form className="rounded-2xl border border-[#e8e4de] bg-white p-4 shadow-sm mt-4 max-w-md space-y-2" onSubmit={mapStation}>
        <h2 className="font-semibold">Map station → printer</h2>
        <select
          className="input"
          value={map.printerId}
          onChange={(e) => setMap({ ...map, printerId: e.target.value })}
          required
        >
          <option value="">Printer</option>
          {devices.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <select
          className="input"
          value={map.stationId}
          onChange={(e) => setMap({ ...map, stationId: e.target.value })}
          required
        >
          <option value="">Station</option>
          {stations.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.code})
            </option>
          ))}
        </select>
        <button className="inline-flex items-center justify-center rounded-xl bg-[#1a1a1a] px-4 py-2.5 text-sm font-semibold text-white" type="submit">
          Map
        </button>
      </form>
    </div>
  );
}
