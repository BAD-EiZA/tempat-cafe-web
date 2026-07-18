import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, formatIdr } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { PageShell } from '@/components/ace/PageShell';
import { AceCard } from '@/components/ace/AceCard';
import { AceButton } from '@/components/ace/AceButton';
import { AceInput, AceSelect } from '@/components/ace/AceInput';
import { Timeline } from '@/components/ui/timeline';
import { Loader } from '@/components/ui/loader';
import { AceBadge } from '@/components/ace/PageShell';

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

export function OrderTrackPage() {
  const { publicToken } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [err, setErr] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [fbOk, setFbOk] = useState(false);
  const clearCart = useAppStore((s) => s.clearCart);
  const addToCart = useAppStore((s) => s.addToCart);
  const setTenant = useAppStore((s) => s.setTenant);
  const setSession = useAppStore((s) => s.setSession);

  useEffect(() => {
    if (!publicToken) return;
    let alive = true;
    const load = () =>
      api<any>(`/public/orders/${publicToken}`)
        .then((o) => alive && setOrder(o))
        .catch((e) => alive && setErr(e.message));
    load();
    const t = setInterval(load, 3000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [publicToken]);

  async function reorder() {
    if (!order) return;
    clearCart();
    setTenant(order.organizationId, order.branchId);
    if (order.tableSessionId && order.tableId) {
      setSession(order.tableSessionId, order.tableId);
    }
    for (const i of order.items || []) {
      addToCart({
        menuItemId: i.menuItemId,
        name: i.nameSnapshot || i.name,
        unitPrice: i.unitPrice,
        quantity: i.quantity,
      });
    }
    window.location.href = '/checkout';
  }

  async function sendFeedback(e: React.FormEvent) {
    e.preventDefault();
    if (!publicToken) return;
    await api('/feedback/by-token', {
      method: 'POST',
      body: { publicToken, overallRating: rating, comment },
    });
    setFbOk(true);
  }

  if (err) {
    return (
      <PageShell maxWidth="max-w-lg">
        <p className="pt-10 text-center text-[var(--danger)]">{err}</p>
      </PageShell>
    );
  }
  if (!order) {
    return (
      <PageShell maxWidth="max-w-lg">
        <Loader label="Memuat pesanan…" />
      </PageShell>
    );
  }

  const tax = order.taxTotal ?? order.taxAmount ?? 0;
  const service = order.serviceChargeTotal ?? order.serviceChargeAmount ?? 0;
  const tip = order.tipTotal ?? order.tipAmount ?? 0;
  const total = order.grandTotal ?? order.total ?? 0;
  const statusIdx = FLOW.indexOf(order.status === 'PARTIALLY_READY' ? 'PREPARING' : order.status);

  return (
    <PageShell beams maxWidth="max-w-lg" className="pb-10">
      <p className="text-sm text-[#6b6b6b]">Nomor pesanan</p>
      <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
      <AceBadge tone="ok">{STATUS_LABEL[order.status] || order.status}</AceBadge>

      <AceCard className="mt-6">
        <Timeline
          items={FLOW.map((s, i) => ({
            title: STATUS_LABEL[s] || s,
            active: i === statusIdx,
            done: statusIdx >= 0 && i < statusIdx,
          }))}
        />
      </AceCard>

      <ul className="mt-6 space-y-2">
        {(order.items || []).map((i: any) => (
          <AceCard key={i.id} className="flex justify-between text-sm !py-3">
            <span>
              {i.quantity}× {i.nameSnapshot || i.name}
            </span>
            <span>{formatIdr(i.lineTotal ?? i.unitPrice * i.quantity)}</span>
          </AceCard>
        ))}
      </ul>

      <AceCard className="mt-4 space-y-1 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatIdr(order.subtotal)}</span>
        </div>
        {tax > 0 && (
          <div className="flex justify-between">
            <span>Pajak</span>
            <span>{formatIdr(tax)}</span>
          </div>
        )}
        {service > 0 && (
          <div className="flex justify-between">
            <span>Service</span>
            <span>{formatIdr(service)}</span>
          </div>
        )}
        {tip > 0 && (
          <div className="flex justify-between">
            <span>Tip</span>
            <span>{formatIdr(tip)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-[#e8e4de] pt-2 font-bold">
          <span>Total</span>
          <span>{formatIdr(total)}</span>
        </div>
      </AceCard>

      {order.tableSessionId && (
        <AceButton variant="accent" className="mt-4 w-full" onClick={reorder}>
          Pesan lagi
        </AceButton>
      )}

      {['COMPLETED', 'SERVED', 'READY'].includes(order.status) && !fbOk && (
        <AceCard className="mt-4">
          <form className="space-y-2" onSubmit={sendFeedback}>
            <h2 className="font-semibold">Feedback</h2>
            <AceSelect value={rating} onChange={(e) => setRating(Number(e.target.value))}>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} bintang
                </option>
              ))}
            </AceSelect>
            <AceInput placeholder="Komentar" value={comment} onChange={(e) => setComment(e.target.value)} />
            <AceButton type="submit" variant="primary" className="w-full">
              Kirim
            </AceButton>
          </form>
        </AceCard>
      )}
      {fbOk && <p className="mt-3 text-sm text-[var(--ok)]">Terima kasih atas feedback!</p>}

      <AceButton as={Link} to="/" variant="ghost" className="mt-6 w-full">
        Beranda
      </AceButton>
    </PageShell>
  );
}
