import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Star } from '@phosphor-icons/react';
import { api, formatIdr } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { PageShell } from '@/components/ace/PageShell';
import { AceCard } from '@/components/ace/AceCard';
import { AceButton } from '@/components/ace/AceButton';
import { AceInput } from '@/components/ace/AceInput';
import { Timeline } from '@/components/ui/timeline';
import { Loader } from '@/components/ui/loader';
import { AceBadge } from '@/components/ace/PageShell';
import { cn } from '@/lib/utils';

const FLOW = ['AWAITING_PAYMENT', 'NEW', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED'];

const STATUS_LABEL: Record<string, string> = {
  AWAITING_PAYMENT: 'Menunggu pembayaran',
  NEW: 'Pesanan masuk',
  ACCEPTED: 'Diterima',
  PREPARING: 'Sedang disiapkan',
  PARTIALLY_READY: 'Sebagian siap',
  READY: 'Siap diambil',
  SERVED: 'Disajikan',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
};

function statusTone(status: string): 'default' | 'ok' | 'warn' | 'info' | 'danger' {
  if (status === 'CANCELLED') return 'danger';
  if (status === 'AWAITING_PAYMENT') return 'warn';
  if (['READY', 'SERVED', 'COMPLETED'].includes(status)) return 'ok';
  if (['PREPARING', 'PARTIALLY_READY', 'ACCEPTED'].includes(status)) return 'info';
  return 'default';
}

export function OrderTrackPage() {
  const { publicToken } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [err, setErr] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [fbOk, setFbOk] = useState(false);
  const [fbBusy, setFbBusy] = useState(false);
  const [fbErr, setFbErr] = useState('');
  const [retry, setRetry] = useState(0);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const clearCart = useAppStore((s) => s.clearCart);
  const addToCart = useAppStore((s) => s.addToCart);
  const setTenant = useAppStore((s) => s.setTenant);
  const setSession = useAppStore((s) => s.setSession);

  useEffect(() => {
    if (!publicToken) return;
    let alive = true;
    const load = () =>
      api<any>(`/public/orders/${publicToken}`)
        .then((o) => {
          if (!alive) return;
          setOrder(o);
          setErr('');
          setLastSync(new Date());
        })
        .catch((e) => alive && setErr(e.message || 'Pesanan gagal dimuat'));
    load();
    const t = setInterval(load, 3000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [publicToken, retry]);

  async function reorder() {
    if (!order) return;
    clearCart();
    setTenant(order.organizationId, order.branchId);
    if (order.tableSessionId && order.tableId) {
      setSession(order.tableSessionId, order.tableId);
    }
    for (const i of order.items || []) {
      const modifiers = (i.modifiers || i.orderItemModifiers || [])
        .map((m: any) => ({
          modifierId: m.modifierId || m.id,
          name: m.name || m.nameSnapshot || '',
          priceDelta: Number(m.priceDelta || m.price || 0),
        }))
        .filter((m: any) => m.modifierId);
      addToCart({
        menuItemId: i.menuItemId,
        name: i.nameSnapshot || i.name,
        unitPrice: i.unitPrice,
        quantity: i.quantity,
        notes: i.notes || undefined,
        modifiers: modifiers.length ? modifiers : undefined,
      });
    }
    window.location.href = '/checkout';
  }

  async function sendFeedback(e: React.FormEvent) {
    e.preventDefault();
    if (!publicToken) return;
    setFbBusy(true);
    setFbErr('');
    try {
      await api('/feedback/by-token', {
        method: 'POST',
        body: { publicToken, overallRating: rating, comment },
      });
      setFbOk(true);
    } catch (e: any) {
      setFbErr(e.message || 'Feedback gagal dikirim');
    } finally {
      setFbBusy(false);
    }
  }

  if (err && !order) {
    return (
      <PageShell beams={false} maxWidth="max-w-lg">
        <AceCard className="mt-10 text-center" role="alert">
          <h1 className="font-semibold">Pesanan tidak dapat dimuat</h1>
          <p className="mt-2 text-sm text-[var(--danger)]">{err}</p>
          <div className="mt-4 flex justify-center gap-2">
            <AceButton onClick={() => setRetry((n) => n + 1)}>Coba lagi</AceButton>
            <AceButton as={Link} to="/" variant="ghost">
              Beranda
            </AceButton>
          </div>
        </AceCard>
      </PageShell>
    );
  }
  if (!order) {
    return (
      <PageShell beams={false} maxWidth="max-w-lg">
        <Loader label="Memuat pesanan…" />
      </PageShell>
    );
  }

  const tax = order.taxTotal ?? order.taxAmount ?? 0;
  const service = order.serviceChargeTotal ?? order.serviceChargeAmount ?? 0;
  const tip = order.tipTotal ?? order.tipAmount ?? 0;
  const total = order.grandTotal ?? order.total ?? 0;
  const statusIdx = FLOW.indexOf(order.status === 'PARTIALLY_READY' ? 'PREPARING' : order.status);
  const done = ['COMPLETED', 'SERVED', 'CANCELLED'].includes(order.status);

  return (
    <PageShell beams={false} maxWidth="max-w-lg" className="pb-10">
      <section className="rounded-2xl bg-cafe-forest px-5 py-8 text-cafe-card">
        <p className="text-xs font-medium text-cafe-card/70">Nomor pesanan</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">{order.orderNumber}</h1>
        <div className="mt-4" role="status" aria-live="polite">
          <AceBadge tone={statusTone(order.status)}>
            {STATUS_LABEL[order.status] || order.status}
          </AceBadge>
        </div>
        <p className="mt-3 text-sm text-cafe-card/85">
          {STATUS_LABEL[order.status] || order.status}
          {order.status === 'PREPARING' && ' - dapur sedang mengerjakan'}
          {order.status === 'READY' && ' - silakan ambil atau tunggu waiter'}
        </p>
        {lastSync && !done && (
          <p className="mt-2 text-[11px] text-cafe-card/50">
            Diperbarui {lastSync.toLocaleTimeString('id-ID')}
          </p>
        )}
      </section>

      {err && (
        <p role="status" className="mt-3 text-xs text-[var(--danger)]">
          Pembaruan status terhenti: {err}
        </p>
      )}

      <AceCard className="mt-5">
        <h2 className="mb-3 text-sm font-bold text-cafe-ink">Progres</h2>
        <Timeline
          items={FLOW.map((s, i) => ({
            title: STATUS_LABEL[s] || s,
            active: i === statusIdx,
            done: statusIdx >= 0 && i < statusIdx,
          }))}
        />
      </AceCard>

      <section className="mt-5 rounded-2xl border border-cafe-border bg-cafe-card">
        <h2 className="border-b border-cafe-border px-4 py-3 text-sm font-bold text-cafe-ink">Item</h2>
        <ul className="divide-y divide-cafe-border">
          {(order.items || []).map((i: any) => (
            <li key={i.id} className="flex justify-between gap-3 px-4 py-3 text-sm">
              <span>
                <span className="font-semibold text-cafe-forest-mid">{i.quantity}x</span>{' '}
                {i.nameSnapshot || i.name}
              </span>
              <span className="tabular-nums">{formatIdr(i.lineTotal ?? i.unitPrice * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="space-y-1 border-t border-cafe-border px-4 py-3 text-sm">
          <div className="flex justify-between">
            <span className="text-cafe-muted">Subtotal</span>
            <span className="tabular-nums">{formatIdr(order.subtotal)}</span>
          </div>
          {tax > 0 && (
            <div className="flex justify-between">
              <span className="text-cafe-muted">Pajak</span>
              <span className="tabular-nums">{formatIdr(tax)}</span>
            </div>
          )}
          {service > 0 && (
            <div className="flex justify-between">
              <span className="text-cafe-muted">Service</span>
              <span className="tabular-nums">{formatIdr(service)}</span>
            </div>
          )}
          {tip > 0 && (
            <div className="flex justify-between">
              <span className="text-cafe-muted">Tip</span>
              <span className="tabular-nums">{formatIdr(tip)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-cafe-border pt-2 font-bold">
            <span>Total</span>
            <span className="tabular-nums">{formatIdr(total)}</span>
          </div>
        </div>
      </section>

      {order.tableSessionId && (
        <AceButton variant="accent" className="mt-5 w-full" onClick={reorder}>
          Pesan lagi
        </AceButton>
      )}

      {['COMPLETED', 'SERVED', 'READY'].includes(order.status) && !fbOk && (
        <AceCard className="mt-5">
          <form className="space-y-3" onSubmit={sendFeedback}>
            <h2 className="font-semibold text-cafe-ink">Bagaimana pengalamannya?</h2>
            <div>
              <span className="mb-1.5 block text-sm font-semibold text-cafe-muted">Rating</span>
              <div className="flex gap-1" role="group" aria-label="Rating bintang">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl transition hover:bg-cafe-hover"
                    aria-label={`${n} bintang`}
                    aria-pressed={rating === n}
                  >
                    <Star
                      weight={n <= rating ? 'fill' : 'regular'}
                      className={cn('h-7 w-7', n <= rating ? 'text-cafe-accent' : 'text-cafe-border')}
                    />
                  </button>
                ))}
              </div>
            </div>
            <AceInput
              label="Komentar (opsional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            {fbErr && (
              <p role="alert" className="text-sm text-[var(--danger)]">
                {fbErr}
              </p>
            )}
            <AceButton type="submit" variant="primary" className="w-full" disabled={fbBusy}>
              {fbBusy ? 'Mengirim…' : 'Kirim feedback'}
            </AceButton>
          </form>
        </AceCard>
      )}
      {fbOk && (
        <p role="status" className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-[var(--ok)]">
          Terima kasih atas feedback!
        </p>
      )}

      <AceButton as={Link} to="/" variant="ghost" className="mt-6 w-full">
        Beranda
      </AceButton>
    </PageShell>
  );
}
