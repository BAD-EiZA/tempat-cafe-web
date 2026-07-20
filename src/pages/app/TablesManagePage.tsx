import { useEffect, useRef, useState } from 'react';
import { AceButton } from '@/components/ace/AceButton';
import { AceInput, AceSelect } from '@/components/ace/AceInput';
import { EmptyState } from '@/components/ace/PageShell';
import { PageHeader } from '@/components/ace/PageHeader';
import { useApi } from '../../hooks/useApi';
import { useAppStore } from '../../lib/store';
import { Loader } from '@/components/ui/loader';
import { cn } from '@/lib/utils';

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
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  async function load() {
    if (!branchId) {
      setAreas([]);
      setTables([]);
      setFloor([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
    const [a, t, f] = await Promise.all([
      api<any[]>(`/areas?branchId=${branchId}`),
      api<any[]>(`/tables?branchId=${branchId}`),
      api<any[]>(`/tables/floor-map?branchId=${branchId}`).catch(() => []),
    ]);
    setAreas(a);
    setTables(t);
    setFloor(f.length ? f : t);
    } catch (e: any) {
      setError(e.message || 'Gagal memuat meja.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [api, branchId]);

  async function addArea(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy('area');
    setError('');
    try {
      await api('/areas', { method: 'POST', body: { branchId, name: areaName } });
      setAreaName('');
      await load();
    } catch (e: any) {
      setError(e.message || 'Gagal menambah area.');
    } finally {
      setBusy('');
    }
  }

  async function addTable(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy('table');
    setError('');
    try {
      await api('/tables', { method: 'POST', body: { ...tableForm, branchId, capacity: Number(tableForm.capacity) } });
      setTableForm({ ...tableForm, name: '' });
      await load();
    } catch (e: any) {
      setError(e.message || 'Gagal menambah meja.');
    } finally {
      setBusy('');
    }
  }

  async function rotateQr(id: string) {
    if (busy || !window.confirm('QR lama akan langsung tidak berlaku. Rotate QR meja ini?')) return;
    setBusy(id);
    setError('');
    try {
      const qr = await api<any>(`/tables/${id}/rotate-qr`, { method: 'POST' });
      await load();
      const url = `${window.location.origin}/qr/${qr.token}`;
      await navigator.clipboard?.writeText(url);
      window.open(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`, '_blank');
    } catch (e: any) {
      setError(e.message || 'Gagal merotasi QR.');
    } finally {
      setBusy('');
    }
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
    if (!dragId || !mapRef.current || busy) {
      setDragId(null);
      return;
    }
    const rect = mapRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    const posX = Math.max(0, Math.min(100, x));
    const posY = Math.max(0, Math.min(100, y));
    setFloor((prev) => prev.map((t) => (t.id === dragId ? { ...t, posX, posY } : t)));
    setBusy('position');
    setError('');
    try {
      await api(`/tables/${dragId}/position`, { method: 'PATCH', body: { posX, posY } });
    } catch (e: any) {
      setError(e.message || 'Gagal menyimpan posisi meja.');
      await load();
    } finally {
      setDragId(null);
      setBusy('');
    }
  }

  return (
    <div className="animate-float-up space-y-6">
      <PageHeader title="Meja & QR" description="Area, meja, QR token, dan floor map" />
      {!branchId && (
        <EmptyState title="Pilih tenant dulu" description="Gunakan switcher organisasi & cabang di atas." />
      )}
      {loading && <Loader label="Memuat meja…" />}
      {error && (
        <p role="alert" className="text-sm text-[var(--danger)]">
          {error}
        </p>
      )}

      {branchId && (
        <>
          <div className="flex flex-wrap gap-2">
            <AceButton
              variant={tab === 'list' ? 'primary' : 'ghost'}
              className="!text-sm"
              onClick={() => setTab('list')}
            >
              Daftar
            </AceButton>
            <AceButton
              variant={tab === 'map' ? 'primary' : 'ghost'}
              className="!text-sm"
              onClick={() => setTab('map')}
            >
              Floor map
            </AceButton>
          </div>

          {tab === 'list' && (
            <>
              <div className="grid gap-4 lg:grid-cols-2">
                <form className="space-y-3 rounded-2xl border border-cafe-border bg-cafe-card p-4 shadow-sm" onSubmit={addArea}>
                  <h2 className="text-sm font-bold text-cafe-ink">Area</h2>
                  <AceInput
                    label="Nama area"
                    value={areaName}
                    onChange={(e) => setAreaName(e.target.value)}
                    required
                  />
                  <AceButton type="submit" variant="accent" disabled={!branchId || !!busy}>
                    {busy === 'area' ? 'Menambah…' : 'Tambah area'}
                  </AceButton>
                  {areas.length > 0 && (
                    <ul className="divide-y divide-cafe-border text-sm text-cafe-muted">
                      {areas.map((a) => (
                        <li key={a.id} className="py-1.5">
                          {a.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </form>

                <form className="space-y-3 rounded-2xl border border-cafe-border bg-cafe-card p-4 shadow-sm" onSubmit={addTable}>
                  <h2 className="text-sm font-bold text-cafe-ink">Meja</h2>
                  <AceSelect
                    label="Area"
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
                  </AceSelect>
                  <AceInput
                    label="Nama meja"
                    value={tableForm.name}
                    onChange={(e) => setTableForm({ ...tableForm, name: e.target.value })}
                    required
                  />
                  <AceInput
                    label="Kapasitas"
                    type="number"
                    min={1}
                    value={tableForm.capacity}
                    onChange={(e) => setTableForm({ ...tableForm, capacity: Number(e.target.value) })}
                  />
                  <AceButton type="submit" variant="accent" disabled={!branchId || !!busy}>
                    {busy === 'table' ? 'Menambah…' : 'Tambah meja'}
                  </AceButton>
                </form>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {!loading &&
                  tables.map((t) => {
                    const tok = t.qrTokens?.[0]?.token;
                    return (
                      <div
                        key={t.id}
                        className="flex flex-col items-center gap-2 rounded-2xl border border-cafe-border bg-cafe-card p-4 text-center shadow-sm"
                      >
                        <div className="font-medium text-cafe-ink">{t.name}</div>
                        <div className="text-sm text-cafe-muted">
                          {t.area?.name || t.areaId} · cap {t.capacity} · {t.status}
                        </div>
                        {tok && (
                          <>
                            <img src={qrImg(tok)} alt={`QR ${t.name}`} className="h-36 w-36" />
                            <a
                              className="break-all text-xs text-cafe-muted underline"
                              href={qrUrl(tok)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {qrUrl(tok)}
                            </a>
                          </>
                        )}
                        <AceButton
                          variant="primary"
                          className="w-full !text-sm"
                          disabled={!!busy}
                          onClick={() => rotateQr(t.id)}
                        >
                          {busy === t.id ? 'Memutar…' : 'Rotate QR'}
                        </AceButton>
                      </div>
                    );
                  })}
                {!loading && !error && branchId && !tables.length && (
                  <EmptyState title="Belum ada meja" description="Tambahkan area, lalu meja." />
                )}
              </div>
            </>
          )}

          {tab === 'map' && (
            <div>
              <p className="mb-2 text-sm text-cafe-muted">
                Drag meja untuk simpan posisi (%). {busy === 'position' && 'Menyimpan…'}
              </p>
              <div
                ref={mapRef}
                className="relative h-[420px] w-full max-w-3xl rounded-xl border border-cafe-border bg-cafe-card"
                onPointerUp={onMapPointerUp}
              >
                {floor.map((t, i) => {
                  const x = t.posX ?? (i % 5) * 18 + 5;
                  const y = t.posY ?? Math.floor(i / 5) * 22 + 5;
                  const isBusy = t.sessions?.length > 0 || t.status === 'OCCUPIED';
                  return (
                    <button
                      key={t.id}
                      type="button"
                      className={cn(
                        'absolute flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 cursor-grab flex-col items-center justify-center rounded-full border text-xs font-medium active:cursor-grabbing',
                        isBusy
                          ? 'border-amber-500 bg-amber-100 text-amber-900'
                          : 'border-cafe-accent bg-cafe-card text-cafe-ink',
                      )}
                      style={{ left: `${x}%`, top: `${y}%` }}
                      onPointerDown={(e) => onMapPointerDown(t.id, e)}
                      disabled={!!busy}
                      title={t.area?.name || ''}
                    >
                      <span>{t.name}</span>
                      <span className="text-[10px] opacity-60">{t.capacity}</span>
                    </button>
                  );
                })}
                {!loading && !error && !floor.length && (
                  <div className="p-6 text-sm text-cafe-muted">Belum ada meja untuk floor map.</div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
