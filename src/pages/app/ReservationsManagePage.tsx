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

  async function load() {
    if (!branchId) return;
    setRows(await api<any[]>(`/reservations?branchId=${branchId}`));
  }

  useEffect(() => {
    load().catch(() => undefined);
    const t = setInterval(() => load().catch(() => undefined), 10000);
    return () => clearInterval(t);
  }, [api, branchId]);

  async function setStatus(id: string, status: string) {
    await api(`/reservations/${id}/status`, { method: 'PATCH', body: { status } });
    await load();
  }

  async function confirmDeposit(id: string) {
    await api(`/reservations/${id}/confirm-deposit`, { method: 'POST' });
    setMsg('Deposit dikonfirmasi');
    await load();
  }

  async function noShow(id: string) {
    await api(`/reservations/${id}/no-show`, { method: 'POST' });
    await load();
  }

  if (!branchId) return <p className="text-[#6b6b6b]">Pilih branch dulu.</p>;

  return (
    <div className="animate-float-up" data-ace="1">
      <h1 className="text-2xl font-bold">Reservasi</h1>
      {msg && <p className="mt-2 text-sm text-[#6b6b6b]">{msg}</p>}
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
                <AceButton variant="accent" className="!text-sm" onClick={() => confirmDeposit(r.id)}>
                  Confirm deposit
                </AceButton>
              )}
              {r.status === 'CONFIRMED' && (
                <AceButton variant="accent" className="!text-sm" onClick={() => setStatus(r.id, 'CHECKED_IN')}>
                  Check-in
                </AceButton>
              )}
              {r.status === 'CHECKED_IN' && (
                <AceButton variant="primary" className="!text-sm" onClick={() => setStatus(r.id, 'SEATED')}>
                  Seated
                </AceButton>
              )}
              {['CONFIRMED', 'PENDING_PAYMENT'].includes(r.status) && (
                <AceButton variant="ghost" className="!text-sm" onClick={() => noShow(r.id)}>
                  No-show
                </AceButton>
              )}
              {!['CANCELLED', 'NO_SHOW', 'COMPLETED'].includes(r.status) && (
                <AceButton variant="ghost" className="!text-sm" onClick={() => setStatus(r.id, 'CANCELLED')}>
                  Cancel
                </AceButton>
              )}
            </div>
          </AceCard>
        ))}
        {!rows.length && <EmptyState title="Belum ada reservasi." />}
      </div>
    </div>
  );
}
