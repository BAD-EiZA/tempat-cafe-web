import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { PageShell } from '@/components/ace/PageShell';
import { AceCard } from '@/components/ace/AceCard';
import { AceButton } from '@/components/ace/AceButton';
import { AceInput } from '@/components/ace/AceInput';
import { AceBadge } from '@/components/ace/PageShell';
import { Loader } from '@/components/ui/loader';

export function ReservationPage() {
  const { cafeSlug, branchSlug } = useParams();
  const cafeBase = branchSlug ? `/c/${cafeSlug}/${branchSlug}` : `/c/${cafeSlug}`;
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
    try {
      sessionStorage.setItem('lastCafeSlug', cafeSlug);
      if (branchSlug) sessionStorage.setItem('lastBranchSlug', branchSlug);
      else sessionStorage.removeItem('lastBranchSlug');
    } catch {
      /* ignore */
    }
    setLoadingBranch(true);
    setErr('');
    const path = branchSlug
      ? `/public/cafes/${cafeSlug}/${branchSlug}/menu`
      : `/public/cafes/${cafeSlug}/menu`;
    api<any>(path)
      .then((m) => {
        if (m.branch?.id) setBranchId(m.branch.id);
        else setErr('Cabang tidak ditemukan');
      })
      .catch((e) => setErr(e.message || 'Gagal memuat cabang'))
      .finally(() => setLoadingBranch(false));
  }, [cafeSlug, branchSlug, retry]);

  async function checkAvail() {
    if (!branchId || !form.startAt) throw new Error('Pilih waktu reservasi');
    setBusy('check');
    setErr('');
    try {
      const available = await api<any>('/public/reservations/availability', {
        method: 'POST',
        body: {
          branchId,
          startAt: new Date(form.startAt).toISOString(),
          guestCount: form.guestCount,
        },
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
    <PageShell beams={false} maxWidth="max-w-lg" className="pb-10">
      <Link
        to={cafeBase}
        className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-cafe-ink"
      >
        <ArrowLeft weight="bold" className="h-4 w-4" />
        Kembali ke kafe
      </Link>

      <h1 className="text-2xl font-bold tracking-tight text-cafe-ink">Reservasi</h1>
      <p className="mt-1 text-sm text-cafe-muted">Booking meja di {cafeSlug}</p>

      {loadingBranch && <Loader label="Memuat informasi kafe…" />}

      {!loadingBranch && !branchId && (
        <AceCard className="mt-6 text-center" role="alert">
          <p className="font-semibold">Informasi kafe tidak dapat dimuat</p>
          <p className="mt-1 text-sm text-[var(--danger)]">{err}</p>
          <AceButton className="mt-4" onClick={() => setRetry((n) => n + 1)}>
            Coba lagi
          </AceButton>
        </AceCard>
      )}

      {result ? (
        <AceCard className="mt-6" role="status" aria-live="polite">
          <div className="flex items-start gap-3">
            <CheckCircle weight="fill" className="h-8 w-8 shrink-0 text-[var(--ok)]" />
            <div>
              <p className="font-semibold text-cafe-ink">Reservasi dibuat</p>
              <p className="mt-1 text-sm text-cafe-muted">Kode: {result.code}</p>
            </div>
          </div>
          <dl className="mt-4 space-y-2 border-t border-cafe-border pt-4 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-cafe-muted">Status</dt>
              <dd>
                <AceBadge tone="ok">{result.status}</AceBadge>
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-cafe-muted">Nama</dt>
              <dd className="font-medium text-cafe-ink">
                {result.customerName || result.guestName || form.guestName}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-cafe-muted">Tamu</dt>
              <dd className="font-medium text-cafe-ink">
                {result.guestCount ?? form.guestCount} orang
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-cafe-muted">Waktu</dt>
              <dd className="text-right font-medium text-cafe-ink">
                {new Date(result.startAt || form.startAt).toLocaleString('id-ID')}
              </dd>
            </div>
            {(result.customerPhone || result.guestPhone || form.guestPhone) && (
              <div className="flex justify-between gap-3">
                <dt className="text-cafe-muted">Telepon</dt>
                <dd className="font-medium text-cafe-ink">
                  {result.customerPhone || result.guestPhone || form.guestPhone}
                </dd>
              </div>
            )}
          </dl>
          {result.paymentRequired && (
            <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Deposit{' '}
              {new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                maximumFractionDigits: 0,
              }).format(result.depositAmount)}{' '}
              belum dibayar. Konfirmasi ke kafe sebelum{' '}
              {new Date(result.paymentExpiresAt).toLocaleString('id-ID')} atau reservasi kedaluwarsa.
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            <AceButton as={Link} to={`${cafeBase}/menu`} variant="primary">
              Lihat menu
            </AceButton>
            <AceButton as={Link} to={cafeBase} variant="ghost">
              Ke homepage
            </AceButton>
          </div>
        </AceCard>
      ) : (
        branchId && (
          <form className="mt-6 space-y-6" onSubmit={submit}>
            <section className="space-y-3 rounded-2xl border border-cafe-border bg-cafe-card p-4">
              <h2 className="text-sm font-bold text-cafe-ink">Siapa yang datang?</h2>
              <AceInput
                label="Nama"
                required
                value={form.guestName}
                onChange={(e) => setForm({ ...form, guestName: e.target.value })}
                autoComplete="name"
              />
              <AceInput
                label="Telepon"
                type="tel"
                inputMode="tel"
                required
                value={form.guestPhone}
                onChange={(e) => setForm({ ...form, guestPhone: e.target.value })}
                autoComplete="tel"
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
            </section>

            <section className="space-y-3 rounded-2xl border border-cafe-border bg-cafe-card p-4">
              <h2 className="text-sm font-bold text-cafe-ink">Kapan?</h2>
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
            </section>

            <AceButton
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => void checkAvail().catch(() => undefined)}
              disabled={!branchId || !!busy}
            >
              {busy === 'check' ? 'Mengecek...' : 'Cek ketersediaan'}
            </AceButton>

            {avail && (
              <div
                role="status"
                aria-live="polite"
                className={
                  avail.available
                    ? 'rounded-xl bg-green-50 px-4 py-3 text-sm text-green-900'
                    : 'rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800'
                }
              >
                {avail.available
                  ? `Tersedia - ${avail.tables?.length || 0} meja cocok untuk ${form.guestCount} tamu.`
                  : 'Tidak tersedia untuk waktu itu. Coba slot lain.'}
              </div>
            )}

            {err && (
              <p role="alert" className="text-sm text-[var(--danger)]">
                {err}
              </p>
            )}

            <AceButton
              type="submit"
              variant="primary"
              className="w-full"
              disabled={!branchId || !avail?.available || !!busy}
            >
              {busy === 'submit' ? 'Mengirim...' : 'Kirim reservasi'}
            </AceButton>
          </form>
        )
      )}
    </PageShell>
  );
}
