import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CaretDown, CaretUp } from '@phosphor-icons/react';
import { api, formatIdr } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { PageShell } from '@/components/ace/PageShell';
import { AceCard } from '@/components/ace/AceCard';
import { AceButton } from '@/components/ace/AceButton';
import { AceInput } from '@/components/ace/AceInput';
import { MultiStepLoader } from '@/components/ui/loader';
import { isMockSnap, loadSnap } from '@/lib/snap';
import { cn } from '@/lib/utils';

const TIP_PRESETS = [0, 2000, 5000, 10000];

function lastCafeBase() {
  try {
    const slug = sessionStorage.getItem('lastCafeSlug') || '';
    const branch = sessionStorage.getItem('lastBranchSlug') || '';
    if (!slug) return '';
    return branch ? `/c/${slug}/${branch}` : `/c/${slug}`;
  } catch {
    return '';
  }
}

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
  const [showVoucher, setShowVoucher] = useState(false);
  const [redeemPoints, setRedeemPoints] = useState(0);
  const [loyalty, setLoyalty] = useState<{ balance: number; discountPerPoint: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  const [err, setErr] = useState('');
  const [loyaltyErr, setLoyaltyErr] = useState('');
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const cafeBase = lastCafeBase();

  const subtotal = useMemo(() => cart.reduce((s, c) => s + c.unitPrice * c.quantity, 0), [cart]);

  useEffect(() => {
    if (!organizationId || !phone || phone.length < 8) {
      setLoyalty(null);
      setLoyaltyErr('');
      return;
    }
    const t = setTimeout(() => {
      api<any>(`/loyalty/lookup?organizationId=${organizationId}&phone=${encodeURIComponent(phone)}`)
        .then((r) => {
          setLoyalty(r);
          setLoyaltyErr('');
        })
        .catch(() => {
          setLoyalty(null);
          setLoyaltyErr('Poin tidak dapat diperiksa. Checkout tetap bisa dilanjutkan.');
        });
    }, 400);
    return () => clearTimeout(t);
  }, [organizationId, phone]);

  const redeemDiscount =
    redeemPoints > 0 && loyalty ? Math.floor(redeemPoints * (loyalty.discountPerPoint || 0)) : 0;
  const payTotal = Math.max(0, subtotal - redeemDiscount + (tip || 0));
  // Voucher applied server-side; total shown is estimate before voucher

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!branchId || !cart.length || busy) return;
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
          idempotencyKey,
          items: cart.map((c) => ({
            menuItemId: c.menuItemId,
            quantity: c.quantity,
            notes: c.notes,
            modifiers: c.modifiers?.map(({ modifierId }) => ({ modifierId })),
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
        setBusy(false);
        return;
      }

      await loadSnap(clientKey);
      // Keep busy while Snap is open to prevent double submit
      window.snap?.pay(snapToken, {
        onSuccess: () => {
          clearCart();
          setBusy(false);
          navigate(`/order/${order.publicToken}`);
        },
        onPending: () => {
          clearCart();
          setBusy(false);
          navigate(`/order/${order.publicToken}`);
        },
        onError: () => {
          setErr('Pembayaran gagal. Coba bayar lagi.');
          setBusy(false);
        },
        onClose: () => {
          setErr('Pembayaran belum selesai. Keranjang tetap tersimpan untuk dicoba lagi.');
          setBusy(false);
        },
      });
    } catch (e: any) {
      setErr(e.message || 'Checkout gagal');
      setBusy(false);
    }
  }

  if (!cart.length) {
    return (
      <PageShell beams={false} maxWidth="max-w-lg">
        <AceCard className="mt-10 text-center">
          <h1 className="font-semibold">Keranjang kosong</h1>
          <p className="mt-1 text-sm text-cafe-muted">Tambahkan item dari menu sebelum checkout.</p>
          <AceButton
            as={Link}
            to={cafeBase ? `${cafeBase}/menu` : '/'}
            variant="primary"
            className="mt-4"
          >
            {cafeBase ? 'Kembali ke menu' : 'Beranda'}
          </AceButton>
        </AceCard>
      </PageShell>
    );
  }

  return (
    <PageShell beams={false} maxWidth="max-w-lg" className="pb-32">
      <button
        type="button"
        className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-cafe-ink"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft weight="bold" className="h-4 w-4" />
        Kembali ke menu
      </button>

      <h1 className="text-2xl font-bold tracking-tight text-cafe-ink">Checkout</h1>
      <p className="mt-1 text-sm text-cafe-muted">{cart.length} baris pesanan</p>

      {!branchId && (
        <p role="alert" className="mt-3 text-sm text-[var(--danger)]">
          Sesi kafe tidak ditemukan. Kembali ke menu lalu coba lagi.
        </p>
      )}

      {busy && (
        <AceCard className="mt-4">
          <MultiStepLoader steps={['Buat order', 'Siapkan pembayaran', 'Selesai']} active={step} />
        </AceCard>
      )}

      <section className="mt-5 rounded-2xl border border-cafe-border bg-cafe-card">
        <ul className="divide-y divide-cafe-border">
          {cart.map((c) => (
            <li key={c.lineId || c.menuItemId} className="flex justify-between gap-3 px-4 py-3 text-sm">
              <span className="min-w-0 text-cafe-ink">
                <span className="font-semibold text-cafe-forest-mid">{c.quantity}x</span>{' '}
                {c.name}
                {c.modifiers?.length ? (
                  <span className="mt-0.5 block text-xs text-cafe-muted">
                    {c.modifiers.map((m) => m.name).join(', ')}
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 font-semibold tabular-nums">{formatIdr(c.unitPrice * c.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="space-y-1 border-t border-cafe-border px-4 py-3 text-sm">
          <div className="flex justify-between">
            <span className="text-cafe-muted">Subtotal</span>
            <span className="tabular-nums">{formatIdr(subtotal)}</span>
          </div>
          {redeemDiscount > 0 && (
            <div className="flex justify-between text-[var(--ok)]">
              <span>Redeem poin</span>
              <span className="tabular-nums">-{formatIdr(redeemDiscount)}</span>
            </div>
          )}
          {tip > 0 && (
            <div className="flex justify-between">
              <span className="text-cafe-muted">Tip</span>
              <span className="tabular-nums">{formatIdr(tip)}</span>
            </div>
          )}
        </div>
      </section>

      <form id="checkout-form" className="mt-6 space-y-4" onSubmit={submit}>
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-cafe-ink">Data pemesan</h2>
          <AceInput label="Nama" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          <AceInput
            label="Telepon (poin member)"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="08…"
            autoComplete="tel"
          />
          {loyalty && loyalty.balance > 0 && (
            <p className="text-xs text-cafe-muted">
              Saldo poin: {loyalty.balance} · ≈ {formatIdr(loyalty.discountPerPoint || 0)}/poin
            </p>
          )}
          {loyaltyErr && (
            <p role="status" className="text-xs text-[var(--danger)]">
              {loyaltyErr}
            </p>
          )}
          <AceInput label="Catatan pesanan" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-semibold text-cafe-muted" id="tip-label">
            Tip
          </span>
          <div className="flex flex-wrap gap-2" role="group" aria-labelledby="tip-label">
            {TIP_PRESETS.map((p) => (
              <AceButton
                key={p}
                type="button"
                variant={tip === p ? 'primary' : 'ghost'}
                className="!text-sm"
                onClick={() => setTip(p)}
                aria-pressed={tip === p}
              >
                {p === 0 ? 'Tanpa tip' : formatIdr(p)}
              </AceButton>
            ))}
          </div>
          <div className="mt-2">
            <AceInput
              label="Nominal tip lain"
              type="number"
              min={0}
              value={tip || ''}
              onChange={(e) => setTip(Number(e.target.value) || 0)}
            />
          </div>
        </div>

        <div>
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-xl border border-cafe-border bg-cafe-card px-3 py-3 text-sm font-semibold text-cafe-ink"
            onClick={() => setShowVoucher((v) => !v)}
            aria-expanded={showVoucher}
          >
            Voucher & poin
            {showVoucher ? (
              <CaretUp weight="bold" className="h-4 w-4 text-cafe-muted" />
            ) : (
              <CaretDown weight="bold" className="h-4 w-4 text-cafe-muted" />
            )}
          </button>
          {showVoucher && (
            <div className="mt-3 space-y-3">
              <AceInput label="Kode voucher" value={voucher} onChange={(e) => setVoucher(e.target.value)} />
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
            </div>
          )}
        </div>

        {err && (
          <p role="alert" className="text-sm text-[var(--danger)]">
            {err}
          </p>
        )}
      </form>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-cafe-border bg-cafe-card/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-cafe-muted">
              Total bayar{voucher ? ' (voucher di server)' : ''}
            </p>
            <p className={cn('text-lg font-bold tabular-nums text-cafe-ink')}>{formatIdr(payTotal)}</p>
          </div>
          <AceButton
            type="submit"
            form="checkout-form"
            variant="primary"
            className="shrink-0 !px-6"
            disabled={busy || !branchId}
          >
            {busy ? 'Memproses…' : 'Bayar & pesan'}
          </AceButton>
        </div>
      </div>
    </PageShell>
  );
}
