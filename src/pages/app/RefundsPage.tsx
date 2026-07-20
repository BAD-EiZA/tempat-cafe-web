import { useEffect, useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { useAppStore } from '@/lib/store';
import { formatIdr } from '@/lib/api';
import { AceCard } from '@/components/ace/AceCard';
import { AceButton } from '@/components/ace/AceButton';
import { AceInput } from '@/components/ace/AceInput';
import { EmptyState } from '@/components/ace/PageShell';
import { PageHeader } from '@/components/ace/PageHeader';
import { AnimatedModal } from '@/components/ui/animated-modal';
import { Loader } from '@/components/ui/loader';

export function RefundsPage() {
  const api = useApi();
  const branchId = useAppStore((s) => s.branchId);
  const [orders, setOrders] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [target, setTarget] = useState<any | null>(null);
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState('merchant refund');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    if (!branchId) { setLoading(false); return; }
    setLoading(true); setError('');
    try { const list = await api<any[]>(`/orders?branchId=${branchId}`);
      setOrders(
      list.filter(
        (o) =>
          o.payments?.some((p: any) => p.status === 'PAID') ||
          ['NEW', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED'].includes(o.status),
      ),
      );
    } catch (e: any) { setError(e.message || 'Gagal memuat order.'); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, [api, branchId]);

  function openRefund(order: any) {
    const payment = (order.payments || []).find((p: any) => p.status === 'PAID') || order.payments?.[0];
    if (!payment) {
      setMsg('Tidak ada payment');
      return;
    }
    setTarget({ order, payment });
    setAmount(payment.amount || order.grandTotal || 0);
    setReason('merchant refund');
    setMsg('');
  }

  async function submitRefund() {
    if (!target || !amount) return;
    const max = target.payment.amount || target.order.grandTotal;
    if (amount > max) { setError(`Jumlah refund maksimal ${formatIdr(max)}.`); return; }
    if (!window.confirm(`Ajukan refund ${formatIdr(amount)} untuk order ${target.order.orderNumber}?`)) return;
    setBusy(true);
    setMsg(''); setError('');
    try {
      await api(`/payments/${target.payment.id}/refunds`, {
        method: 'POST',
        body: {
          amount: Number(amount),
          reason: reason || 'merchant refund',
          idempotencyKey: crypto.randomUUID(),
        },
      });
      setMsg(`Refund ${formatIdr(Number(amount))} diajukan`);
      setTarget(null);
      await load();
    } catch (e: any) {
      setError(e.message || 'Gagal refund');
    } finally {
      setBusy(false);
    }
  }

  if (!branchId) {
    return (
      <div className="space-y-4">
        <PageHeader title="Refund" />
        <EmptyState title="Pilih branch dulu" description="Gunakan switcher cabang di atas." />
      </div>
    );
  }

  return (
    <div className="animate-float-up space-y-6">
      <PageHeader title="Refund" description="Ajukan refund pembayaran order" />
      {loading && <Loader label="Memuat order…" />}
      {msg && (
        <p className="text-sm text-cafe-muted" role="status">
          {msg}
        </p>
      )}
      {error && (
        <p className="text-sm text-[var(--danger)]" role="alert">
          {error}
        </p>
      )}
      <div className="space-y-2">
        {orders.map((o) => (
          <AceCard key={o.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <div>
              <div className="font-medium">
                {o.orderNumber} · {o.status}
              </div>
              <div className="text-cafe-muted">{formatIdr(o.grandTotal ?? 0)}</div>
            </div>
            <AceButton variant="ghost" className="!text-sm" disabled={busy} onClick={() => openRefund(o)}>
              Refund
            </AceButton>
          </AceCard>
        ))}
        {!loading && !orders.length && !error && <EmptyState title="Belum ada order." />}
      </div>

      <AnimatedModal open={!!target} onClose={() => { if (!busy) setTarget(null); }} title="Ajukan refund">
        {target && (
          <div className="space-y-3">
            <p className="text-sm text-cafe-muted">
              Order {target.order.orderNumber} · max {formatIdr(target.payment.amount || target.order.grandTotal)}
            </p>
            <AceInput
              label="Jumlah IDR"
              type="number"
              min={1}
              max={target.payment.amount || target.order.grandTotal}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
            />
            <AceInput label="Alasan" value={reason} onChange={(e) => setReason(e.target.value)} />
            <div className="flex gap-2">
              <AceButton variant="danger" disabled={busy || !amount} onClick={submitRefund}>
                {busy ? '…' : 'Submit refund'}
              </AceButton>
              <AceButton variant="ghost" disabled={busy} onClick={() => setTarget(null)}>
                Batal
              </AceButton>
            </div>
          </div>
        )}
      </AnimatedModal>
    </div>
  );
}
