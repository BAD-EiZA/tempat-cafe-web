import { useEffect, useRef, useState } from 'react';
import { AceCard } from '@/components/ace/AceCard';
import { AceButton } from '@/components/ace/AceButton';
import { AceBadge, EmptyState, StatCard } from '@/components/ace/PageShell';
import { useApi } from '../../hooks/useApi';
import { useAppStore } from '../../lib/store';

export function TablesManagePage() {
  const api = useApi();
  const branchId = useAppStore((s) => s.branchId);
  const mapRef = useRef<HTMLDivElement>(null);
  const [areas, setAreas] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [floor, setFloor] = useState<any[]>([]);
  const [areaName, setAreaName] = useState('');
  const [tableForm, setTableForm] = useState({ areaId: '', name: '', capacity: 4 });
  const [dragId, setDragId] = useState<string | null>(null);
  const [tab, setTab] = useState<'list' | 'map'>('list');

  async function load() {
    if (!branchId) return;
    const [a, t, f] = await Promise.all([
      api<any[]>(`/areas?branchId=${branchId}`),
      api<any[]>(`/tables?branchId=${branchId}`),
      api<any[]>(`/tables/floor-map?branchId=${branchId}`).catch(() => []),
    ]);
    setAreas(a);
    setTables(t);
    setFloor(f.length ? f : t);
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, [api, branchId]);

  async function addArea(e: React.FormEvent) {
    e.preventDefault();
    await api('/areas', { method: 'POST', body: { branchId, name: areaName } });
    setAreaName('');
    await load();
  }

  async function addTable(e: React.FormEvent) {
    e.preventDefault();
    await api('/tables', {
      method: 'POST',
      body: { ...tableForm, branchId, capacity: Number(tableForm.capacity) },
    });
    setTableForm({ ...tableForm, name: '' });
    await load();
  }

  async function rotateQr(id: string) {
    const qr = await api<any>(`/tables/${id}/rotate-qr`, { method: 'POST' });
    await load();
    const url = `${window.location.origin}/qr/${qr.token}`;
    await navigator.clipboard?.writeText(url);
    window.open(
      `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`,
      '_blank',
    );
  }

  function qrUrl(token: string) {
    return `${window.location.origin}/qr/${token}`;
  }

  function qrImg(token: string) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrUrl(token))}`;
  }

  function onMapPointerDown(id: string, e: React.PointerEvent) {
    e.preventDefault();
    setDragId(id);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  async function onMapPointerUp(e: React.PointerEvent) {
    if (!dragId || !mapRef.current) {
      setDragId(null);
      return;
    }
    const rect = mapRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    const posX = Math.max(0, Math.min(100, x));
    const posY = Math.max(0, Math.min(100, y));
    setFloor((prev) => prev.map((t) => (t.id === dragId ? { ...t, posX, posY } : t)));
    await api(`/tables/${dragId}/position`, { method: 'PATCH', body: { posX, posY } });
    setDragId(null);
  }

  return (
    <div className="animate-float-up" data-ace="1">
      <h1 className="text-2xl font-bold">Meja & QR</h1>
      {!branchId && <p className="mt-4 text-[var(--muted)]">Pilih tenant di dashboard dulu.</p>}

      <div className="mt-4 flex gap-2">
        <button className={`btn text-sm ${tab === 'list' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('list')}>
          List
        </button>
        <button className={`btn text-sm ${tab === 'map' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('map')}>
          Floor map
        </button>
      </div>

      {tab === 'list' && (
        <>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <form className="rounded-2xl border border-[#e8e4de] bg-white p-4 shadow-sm space-y-2" onSubmit={addArea}>
              <h2 className="font-semibold">Area</h2>
              <input
                className="input"
                placeholder="Nama area"
                value={areaName}
                onChange={(e) => setAreaName(e.target.value)}
                required
              />
              <button className="inline-flex items-center justify-center rounded-xl bg-[#c4a574] px-4 py-2.5 text-sm font-semibold text-[#1a1a1a]" type="submit" disabled={!branchId}>
                Tambah area
              </button>
              <ul className="text-sm text-[var(--muted)]">
                {areas.map((a) => (
                  <li key={a.id}>• {a.name}</li>
                ))}
              </ul>
            </form>

            <form className="rounded-2xl border border-[#e8e4de] bg-white p-4 shadow-sm space-y-2" onSubmit={addTable}>
              <h2 className="font-semibold">Meja</h2>
              <select
                className="input"
                value={tableForm.areaId}
                onChange={(e) => setTableForm({ ...tableForm, areaId: e.target.value })}
                required
              >
                <option value="">Pilih area</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              <input
                className="input"
                placeholder="Nama meja"
                value={tableForm.name}
                onChange={(e) => setTableForm({ ...tableForm, name: e.target.value })}
                required
              />
              <input
                className="input"
                type="number"
                min={1}
                value={tableForm.capacity}
                onChange={(e) => setTableForm({ ...tableForm, capacity: Number(e.target.value) })}
              />
              <button className="inline-flex items-center justify-center rounded-xl bg-[#c4a574] px-4 py-2.5 text-sm font-semibold text-[#1a1a1a]" type="submit" disabled={!branchId}>
                Tambah meja
              </button>
            </form>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tables.map((t) => {
              const tok = t.qrTokens?.[0]?.token;
              return (
                <div key={t.id} className="rounded-2xl border border-[#e8e4de] bg-white p-4 shadow-sm flex flex-col items-center gap-2 text-center">
                  <div className="font-medium">{t.name}</div>
                  <div className="text-sm text-[var(--muted)]">
                    {t.area?.name || t.areaId} · cap {t.capacity} · {t.status}
                  </div>
                  {tok && (
                    <>
                      <img src={qrImg(tok)} alt={`QR ${t.name}`} className="h-36 w-36" />
                      <a
                        className="break-all text-xs text-[var(--muted)] underline"
                        href={qrUrl(tok)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {qrUrl(tok)}
                      </a>
                    </>
                  )}
                  <button className="inline-flex items-center justify-center rounded-xl bg-[#1a1a1a] px-4 py-2.5 text-sm font-semibold text-white text-sm" onClick={() => rotateQr(t.id)}>
                    Rotate QR
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === 'map' && (
        <div className="mt-6">
          <p className="mb-2 text-sm text-[var(--muted)]">Drag meja untuk simpan posisi (%).</p>
          <div
            ref={mapRef}
            className="relative h-[420px] w-full max-w-3xl rounded-xl border border-[#e8e4de] bg-[var(--surface)]"
            onPointerUp={onMapPointerUp}
          >
            {floor.map((t, i) => {
              const x = t.posX ?? (i % 5) * 18 + 5;
              const y = t.posY ?? Math.floor(i / 5) * 22 + 5;
              const busy = t.sessions?.length > 0 || t.status === 'OCCUPIED';
              return (
                <button
                  key={t.id}
                  type="button"
                  className={`absolute flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 cursor-grab flex-col items-center justify-center rounded-full border text-xs font-medium active:cursor-grabbing ${
                    busy
                      ? 'border-amber-500 bg-amber-100 text-amber-900'
                      : 'border-[var(--accent)] bg-white'
                  }`}
                  style={{ left: `${x}%`, top: `${y}%` }}
                  onPointerDown={(e) => onMapPointerDown(t.id, e)}
                  title={t.area?.name || ''}
                >
                  <span>{t.name}</span>
                  <span className="text-[10px] opacity-60">{t.capacity}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
