import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { PageShell } from '@/components/ace/PageShell';
import { AceCard } from '@/components/ace/AceCard';
import { AceButton } from '@/components/ace/AceButton';
import { AceInput } from '@/components/ace/AceInput';
import { MovingBorderButton } from '@/components/ui/moving-border';
import { AceBadge } from '@/components/ace/PageShell';

export function ReservationPage() {
  const { cafeSlug } = useParams();
  const [branchId, setBranchId] = useState('');
  const [form, setForm] = useState({
    guestName: '',
    guestPhone: '',
    guestCount: 2,
    startAt: '',
    notes: '',
  });
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState('');
  const [avail, setAvail] = useState<any>(null);

  useEffect(() => {
    if (!cafeSlug) return;
    api<any>(`/public/cafes/${cafeSlug}/menu`).then((m) => {
      if (m.branch?.id) setBranchId(m.branch.id);
    });
  }, [cafeSlug]);

  async function checkAvail() {
    if (!branchId || !form.startAt) return;
    setAvail(
      await api('/public/reservations/availability', {
        method: 'POST',
        body: { branchId, startAt: form.startAt, guestCount: form.guestCount },
      }),
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    try {
      const r = await api('/public/reservations', {
        method: 'POST',
        body: { ...form, branchId, startAt: new Date(form.startAt).toISOString() },
      });
      setResult(r);
    } catch (e: any) {
      setErr(e.message || 'Gagal reservasi');
    }
  }

  return (
    <PageShell beams maxWidth="max-w-lg" className="pb-10">
      <h1 className="text-2xl font-bold">Reservasi</h1>
      <p className="text-sm text-[#6b6b6b]">Booking meja · {cafeSlug}</p>

      <AceCard className="mt-6" glare>
        <form className="space-y-3" onSubmit={submit}>
          <AceInput
            label="Nama"
            required
            value={form.guestName}
            onChange={(e) => setForm({ ...form, guestName: e.target.value })}
          />
          <AceInput
            label="Telepon"
            required
            value={form.guestPhone}
            onChange={(e) => setForm({ ...form, guestPhone: e.target.value })}
          />
          <AceInput
            label="Jumlah tamu"
            type="number"
            min={1}
            value={form.guestCount}
            onChange={(e) => setForm({ ...form, guestCount: Number(e.target.value) || 1 })}
          />
          <AceInput
            label="Waktu"
            type="datetime-local"
            required
            value={form.startAt}
            onChange={(e) => setForm({ ...form, startAt: e.target.value })}
          />
          <AceInput
            label="Catatan"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <AceButton type="button" variant="ghost" className="w-full" onClick={checkAvail} disabled={!branchId}>
            Cek ketersediaan
          </AceButton>
          {avail && (
            <p className="text-sm">
              {avail.available ? (
                <AceBadge tone="ok">Tersedia · {avail.tables?.length || 0} meja</AceBadge>
              ) : (
                <AceBadge tone="danger">Tidak tersedia</AceBadge>
              )}
            </p>
          )}
          {err && <p className="text-sm text-[var(--danger)]">{err}</p>}
          <MovingBorderButton type="submit" disabled={!branchId} containerClassName="w-full" className="w-full">
            Kirim reservasi
          </MovingBorderButton>
        </form>
      </AceCard>

      {result && (
        <AceCard className="mt-4">
          <p className="font-semibold text-[var(--ok)]">Reservasi dibuat</p>
          <p className="text-sm">Kode: {result.code}</p>
          <p className="text-sm text-[#6b6b6b]">Status: {result.status}</p>
        </AceCard>
      )}

      <AceButton as={Link} to={`/c/${cafeSlug}`} variant="ghost" className="mt-6 w-full">
        Kembali ke homepage
      </AceButton>
    </PageShell>
  );
}
