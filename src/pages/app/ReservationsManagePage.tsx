import { useEffect, useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { useAppStore } from '@/lib/store';
import { AceCard } from '@/components/ace/AceCard';
import { AceButton } from '@/components/ace/AceButton';
import { EmptyState, AceBadge } from '@/components/ace/PageShell';
import { formatIdr } from '@/lib/api';

export function ReservationsManagePage() {
  const api = useApi();
  const branchId = useAppStore((s) => s.branchId);
  const [rows, setRows] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  async function load() {
    if (!branchId) { setLoading(false); return; }
    setError('');
    try { setRows(await api<any[]>(`/reservations?branchId=${branchId}`)); }
    catch (e: any) { setError(e.message || 'Gagal memuat reservasi.'); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    load().catch(() => undefined);
    const t = setInterval(() => load().catch(() => undefined), 10000);
    return () => clearInterval(t);
  }, [api, branchId]);

  async function setStatus(id: string, status: string) {
    if (status === 'CANCELLED' && !window.confirm('Batalkan reservasi ini?')) return;
    setBusyId(id); setError('');
    try { await api(`/reservations/${id}/status`, { method: 'PATCH', body: { status } }); await load(); }
    catch (e: any) { setError(e.message || 'Gagal mengubah status reservasi.'); }
    finally { setBusyId(''); }
  }

  async function confirmDeposit(id: string) {
    const row = rows.find((r) => r.id === id);
    if (!window.confirm(`Konfirmasi deposit ${formatIdr(row?.depositAmount || 0)} sudah diterima?`)) return;
    setBusyId(id); setError('');
    try { await api(`/reservations/${id}/confirm-deposit`, { method: 'POST' }); setMsg('Deposit dikonfirmasi'); await load(); }
    catch (e: any) { setError(e.message || 'Gagal mengonfirmasi deposit.'); }
    finally { setBusyId(''); }
  }

  async function noShow(id: string) {
    if (!window.confirm('Tandai reservasi ini sebagai no-show?')) return;
    setBusyId(id); setError('');
    try { await api(`/reservations/${id}/no-show`, { method: 'POST' }); await load(); }
    catch (e: any) { setError(e.message || 'Gagal menandai no-show.'); }
    finally { setBusyId(''); }
  }

  if (!branchId) return <p className="text-[#6b6b6b]">Pilih branch dulu.</p>;

  return (
    <div className="animate-float-up" data-ace="1">
      <h1 className="text-2xl font-bold">Reservasi</h1>
      {loading && <p className="mt-2 text-sm text-[#6b6b6b]" role="status">Memuat reservasi…</p>}
      {msg && <p className="mt-2 text-sm text-[#6b6b6b]" role="status">{msg}</p>}
      {error && <p className="mt-2 text-sm text-red-700" role="alert">{error}</p>}
      <div className="mt-6 space-y-2">
        {rows.map((r) => (
          <AceCard key={r.id} className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-medium">
                {r.code} · {r.customerName}
              </div>
              <div className="text-sm text-[#6b6b6b]">
                {r.guestCount} tamu · {new Date(r.startAt).toLocaleString('id-ID')} ·{' '}
                <AceBadge tone={r.status === 'CONFIRMED' ? 'ok' : 'default'}>{r.status}</AceBadge>
              </div>
              {(r.depositAmount > 0 || r.depositPaid) && (
                <p className="mt-1 text-xs text-[#6b6b6b]">
                  Deposit {formatIdr(r.depositAmount || 0)} · {r.depositPaid ? 'lunas' : 'belum'}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {r.status === 'PENDING_PAYMENT' && (
                <AceButton variant="accent" className="!text-sm" disabled={busyId === r.id} onClick={() => confirmDeposit(r.id)}>
                  Confirm deposit
                </AceButton>
              )}
              {r.status === 'CONFIRMED' && (
                <AceButton variant="accent" className="!text-sm" disabled={busyId === r.id} onClick={() => setStatus(r.id, 'CHECKED_IN')}>
                  Check-in
                </AceButton>
              )}
              {r.status === 'CHECKED_IN' && (
                <AceButton variant="primary" className="!text-sm" disabled={busyId === r.id} onClick={() => setStatus(r.id, 'SEATED')}>
                  Seated
                </AceButton>
              )}
              {['CONFIRMED', 'PENDING_PAYMENT'].includes(r.status) && (
                <AceButton variant="ghost" className="!text-sm" disabled={busyId === r.id} onClick={() => noShow(r.id)}>
                  No-show
                </AceButton>
              )}
              {!['CANCELLED', 'NO_SHOW', 'COMPLETED'].includes(r.status) && (
                <AceButton variant="danger" className="!text-sm" disabled={busyId === r.id} onClick={() => setStatus(r.id, 'CANCELLED')}>
                  Cancel
                </AceButton>
              )}
            </div>
          </AceCard>
        ))}
        {!loading && !rows.length && !error && <EmptyState title="Belum ada reservasi." />}
      </div>
    </div>
  );
}
