import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { PageShell } from '@/components/ace/PageShell';
import { AceCard } from '@/components/ace/AceCard';
import { AceButton } from '@/components/ace/AceButton';
import { AceInput } from '@/components/ace/AceInput';
import { MovingBorderButton } from '@/components/ui/moving-border';
import { AceBadge } from '@/components/ace/PageShell';
import { Loader } from '@/components/ui/loader';

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
  const [busy, setBusy] = useState<'check' | 'submit' | ''>('');
  const [loadingBranch, setLoadingBranch] = useState(true);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!cafeSlug) return;
    setLoadingBranch(true);
    setErr('');
    api<any>(`/public/cafes/${cafeSlug}/menu`)
      .then((m) => {
        if (m.branch?.id) setBranchId(m.branch.id);
        else setErr('Cabang tidak ditemukan');
      })
      .catch((e) => setErr(e.message || 'Gagal memuat cabang'))
      .finally(() => setLoadingBranch(false));
  }, [cafeSlug, retry]);

  async function checkAvail() {
    if (!branchId || !form.startAt) throw new Error('Pilih waktu reservasi');
    setBusy('check');
    setErr('');
    try {
      const available = await api<any>('/public/reservations/availability', {
        method: 'POST',
        body: { branchId, startAt: new Date(form.startAt).toISOString(), guestCount: form.guestCount },
      });
      setAvail(available);
      return available;
    } catch (e: any) {
      setAvail(null);
      setErr(e.message || 'Gagal mengecek ketersediaan');
      throw e;
    } finally {
      setBusy('');
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setBusy('submit');
    try {
      const latest = await checkAvail();
      setBusy('submit');
      if (!latest.available) throw new Error('Meja tidak tersedia untuk pilihan ini');
      const r = await api('/public/reservations', {
        method: 'POST',
        body: { ...form, branchId, startAt: new Date(form.startAt).toISOString() },
      });
      setResult(r);
    } catch (e: any) {
      setErr(e.message || 'Gagal reservasi');
    } finally {
      setBusy('');
    }
  }

  return (
    <PageShell beams maxWidth="max-w-lg" className="pb-10">
      <h1 className="text-2xl font-bold">Reservasi</h1>
      <p className="text-sm text-[#6b6b6b]">Booking meja · {cafeSlug}</p>
      {loadingBranch && <Loader label="Memuat informasi kafe…" />}
      {!loadingBranch && !branchId && (
        <AceCard className="mt-6 text-center" role="alert">
          <p className="font-semibold">Informasi kafe tidak dapat dimuat</p>
          <p className="mt-1 text-sm text-[var(--danger)]">{err}</p>
          <AceButton className="mt-4" onClick={() => setRetry((n) => n + 1)}>Coba lagi</AceButton>
        </AceCard>
      )}

      {branchId && <AceCard className="mt-6" glare>
        <form className="space-y-3" onSubmit={submit}>
          <AceInput
            label="Nama"
            required
            value={form.guestName}
            onChange={(e) => setForm({ ...form, guestName: e.target.value })}
          />
          <AceInput
            label="Telepon"
            type="tel"
            inputMode="tel"
            required
            value={form.guestPhone}
            onChange={(e) => setForm({ ...form, guestPhone: e.target.value })}
          />
          <AceInput
            label="Jumlah tamu"
            type="number"
            min={1}
            value={form.guestCount}
            onChange={(e) => {
              setForm({ ...form, guestCount: Number(e.target.value) || 1 });
              setAvail(null);
            }}
          />
          <AceInput
            label="Waktu"
            type="datetime-local"
            required
            value={form.startAt}
            onChange={(e) => {
              setForm({ ...form, startAt: e.target.value });
              setAvail(null);
            }}
          />
          <AceInput
            label="Catatan"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <AceButton type="button" variant="ghost" className="w-full" onClick={() => void checkAvail().catch(() => undefined)} disabled={!branchId || !!busy}>
            {busy === 'check' ? 'Mengecek...' : 'Cek ketersediaan'}
          </AceButton>
          {avail && (
            <p className="text-sm" role="status" aria-live="polite">
              {avail.available ? (
                <AceBadge tone="ok">Tersedia · {avail.tables?.length || 0} meja</AceBadge>
              ) : (
                <AceBadge tone="danger">Tidak tersedia</AceBadge>
              )}
            </p>
          )}
          {err && <p role="alert" className="text-sm text-[var(--danger)]">{err}</p>}
          <MovingBorderButton type="submit" disabled={!branchId || !avail?.available || !!busy} containerClassName="w-full" className="w-full">
            {busy === 'submit' ? 'Mengirim...' : 'Kirim reservasi'}
          </MovingBorderButton>
        </form>
      </AceCard>}

      {result && (
        <AceCard className="mt-4" role="status" aria-live="polite">
          <p className="font-semibold text-[var(--ok)]">Reservasi dibuat</p>
          <p className="text-sm">Kode: {result.code}</p>
          <p className="text-sm text-[#6b6b6b]">Status: {result.status}</p>
          <p className="text-sm">{result.customerName} · {result.guestCount} tamu</p>
          <p className="text-sm">{new Date(result.startAt).toLocaleString('id-ID')}</p>
          {result.customerPhone && <p className="text-sm">Telepon: {result.customerPhone}</p>}
          {result.paymentRequired && (
            <p className="mt-2 text-sm text-[var(--danger)]">
              Deposit {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(result.depositAmount)} belum dibayar. Konfirmasi ke kafe sebelum {new Date(result.paymentExpiresAt).toLocaleString('id-ID')} atau reservasi kedaluwarsa.
            </p>
          )}
        </AceCard>
      )}

      <AceButton as={Link} to={`/c/${cafeSlug}`} variant="ghost" className="mt-6 w-full">
        Kembali ke homepage
      </AceButton>
    </PageShell>
  );
}
