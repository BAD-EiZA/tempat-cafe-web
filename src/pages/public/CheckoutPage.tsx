import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, formatIdr } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { PageShell } from '@/components/ace/PageShell';
import { AceCard } from '@/components/ace/AceCard';
import { AceButton } from '@/components/ace/AceButton';
import { AceInput } from '@/components/ace/AceInput';
import { AceTabs } from '@/components/ui/tabs';
import { MultiStepLoader } from '@/components/ui/loader';
import { MovingBorderButton } from '@/components/ui/moving-border';
import { isMockSnap, loadSnap } from '@/lib/snap';

const TIP_PRESETS = [0, 2000, 5000, 10000];

export function CheckoutPage() {
  const navigate = useNavigate();
  const cart = useAppStore((s) => s.cart);
  const clearCart = useAppStore((s) => s.clearCart);
  const branchId = useAppStore((s) => s.branchId);
  const tableSessionId = useAppStore((s) => s.tableSessionId);
  const tableId = useAppStore((s) => s.tableId);
  const organizationId = useAppStore((s) => s.organizationId);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [tip, setTip] = useState(0);
  const [voucher, setVoucher] = useState('');
  const [redeemPoints, setRedeemPoints] = useState(0);
  const [loyalty, setLoyalty] = useState<{ balance: number; discountPerPoint: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  const [err, setErr] = useState('');

  const subtotal = useMemo(() => cart.reduce((s, c) => s + c.unitPrice * c.quantity, 0), [cart]);

  useEffect(() => {
    if (!organizationId || !phone || phone.length < 8) {
      setLoyalty(null);
      return;
    }
    const t = setTimeout(() => {
      api<any>(`/loyalty/lookup?organizationId=${organizationId}&phone=${encodeURIComponent(phone)}`)
        .then((r) => setLoyalty(r))
        .catch(() => setLoyalty(null));
    }, 400);
    return () => clearTimeout(t);
  }, [organizationId, phone]);

  const redeemDiscount =
    redeemPoints > 0 && loyalty ? Math.floor(redeemPoints * (loyalty.discountPerPoint || 0)) : 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!branchId || !cart.length) return;
    setBusy(true);
    setErr('');
    setStep(1);
    try {
      const order = await api<any>('/public/orders/checkout', {
        method: 'POST',
        body: {
          branchId,
          tableSessionId: tableSessionId || undefined,
          tableId: tableId || undefined,
          customerName: name || undefined,
          customerPhone: phone || undefined,
          notes: notes || undefined,
          tipAmount: tip || 0,
          voucherCode: voucher || undefined,
          redeemPoints: redeemPoints || undefined,
          organizationId: organizationId || undefined,
          idempotencyKey: crypto.randomUUID(),
          items: cart.map((c) => ({
            menuItemId: c.menuItemId,
            quantity: c.quantity,
            notes: c.notes,
            modifiers: c.modifiers,
          })),
        },
      });

      setStep(2);
      let paymentId = order.payments?.[0]?.id;
      let snapToken = order.snapToken;
      let clientKey = order.clientKey;
      let isMock = order.mock;
      const pub = order.publicToken;

      if (!paymentId || !snapToken) {
        const snap = await api<any>(`/payments/${order.id}/snap-token`, {
          method: 'POST',
          body: { publicToken: pub },
        });
        paymentId = snap.payment?.id;
        snapToken = snap.snapToken;
        clientKey = snap.clientKey;
        isMock = snap.mock;
      }

      if (isMockSnap(snapToken, clientKey, isMock)) {
        if (paymentId) {
          await api(`/payments/${paymentId}/mock-pay`, {
            method: 'POST',
            body: { publicToken: pub },
          });
        }
        setStep(3);
        clearCart();
        navigate(`/order/${order.publicToken}`);
        return;
      }

      await loadSnap(clientKey);
      window.snap?.pay(snapToken, {
        onSuccess: () => {
          clearCart();
          navigate(`/order/${order.publicToken}`);
        },
        onPending: () => {
          clearCart();
          navigate(`/order/${order.publicToken}`);
        },
        onError: () => setErr('Pembayaran gagal'),
        onClose: () => {
          clearCart();
          navigate(`/order/${order.publicToken}`);
        },
      });
    } catch (e: any) {
      setErr(e.message || 'Checkout gagal');
    } finally {
      setBusy(false);
    }
  }

  if (!cart.length) {
    return (
      <PageShell maxWidth="max-w-lg">
        <AceCard className="mt-10 text-center">
          <p>Keranjang kosong</p>
          <AceButton as={Link} to="/" variant="primary" className="mt-4">
            Kembali
          </AceButton>
        </AceCard>
      </PageShell>
    );
  }

  return (
    <PageShell beams maxWidth="max-w-lg" className="pb-10">
      <h1 className="text-2xl font-bold">Checkout</h1>
      {busy && (
        <AceCard className="mt-4">
          <MultiStepLoader
            steps={['Buat order', 'Siapkan pembayaran', 'Selesai']}
            active={step}
          />
        </AceCard>
      )}
      <ul className="mt-4 space-y-2">
        {cart.map((c) => (
          <AceCard key={c.menuItemId} className="flex justify-between text-sm !py-3">
            <span>
              {c.quantity}× {c.name}
            </span>
            <span className="font-semibold">{formatIdr(c.unitPrice * c.quantity)}</span>
          </AceCard>
        ))}
      </ul>
      <p className="mt-3 text-right font-bold">Subtotal {formatIdr(subtotal)}</p>
      {redeemDiscount > 0 && (
        <p className="text-right text-sm text-[var(--ok)]">− Redeem poin {formatIdr(redeemDiscount)}</p>
      )}

      <form className="mt-6 space-y-3" onSubmit={submit}>
        <AceInput label="Nama" value={name} onChange={(e) => setName(e.target.value)} />
        <AceInput
          label="Telepon (poin member)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="08…"
        />
        {loyalty && loyalty.balance > 0 && (
          <p className="text-xs text-[#6b6b6b]">
            Saldo poin: {loyalty.balance} · ≈ {formatIdr(loyalty.discountPerPoint || 0)}/poin
          </p>
        )}
        <AceInput label="Catatan" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-[#6b6b6b]">Tip</label>
          <div className="mb-2 flex flex-wrap gap-2">
            {TIP_PRESETS.map((p) => (
              <AceButton
                key={p}
                type="button"
                variant={tip === p ? 'primary' : 'ghost'}
                className="!text-sm"
                onClick={() => setTip(p)}
              >
                {p === 0 ? 'Tanpa tip' : formatIdr(p)}
              </AceButton>
            ))}
          </div>
          <AceInput type="number" min={0} value={tip} onChange={(e) => setTip(Number(e.target.value) || 0)} />
        </div>
        <AceInput label="Voucher" value={voucher} onChange={(e) => setVoucher(e.target.value)} />
        {loyalty && loyalty.balance > 0 && (
          <AceInput
            label={`Tukar poin (max ${loyalty.balance})`}
            type="number"
            min={0}
            max={loyalty.balance}
            value={redeemPoints || ''}
            onChange={(e) =>
              setRedeemPoints(Math.min(loyalty.balance, Math.max(0, Number(e.target.value) || 0)))
            }
          />
        )}
        {err && <p className="text-sm text-[var(--danger)]">{err}</p>}
        <MovingBorderButton type="submit" disabled={busy || !branchId} containerClassName="w-full" className="w-full">
          {busy ? 'Memproses…' : 'Bayar & pesan'}
        </MovingBorderButton>
      </form>
    </PageShell>
  );
}
