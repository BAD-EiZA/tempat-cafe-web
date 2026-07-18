import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '@/hooks/useApi';
import { useRealtime } from '@/hooks/useRealtime';
import { useAppStore } from '@/lib/store';
import { formatIdr } from '@/lib/api';
import { TenantSwitcher } from '@/components/TenantSwitcher';
import { OpsShell } from '@/components/ace/OpsShell';
import { AceCard } from '@/components/ace/AceCard';
import { AceButton } from '@/components/ace/AceButton';
import { AceInput, AceSelect } from '@/components/ace/AceInput';
import { GlareCard } from '@/components/ui/glare-card';
import { AnimatedModal } from '@/components/ui/animated-modal';
import { AceBadge } from '@/components/ace/PageShell';
import { MovingBorderButton } from '@/components/ui/moving-border';
import { isMockSnap, loadSnap } from '@/lib/snap';

export function PosPage() {
  const api = useApi();
  const branchId = useAppStore((s) => s.branchId);
  const setTenant = useAppStore((s) => s.setTenant);
  const [orders, setOrders] = useState<any[]>([]);
  const [menu, setMenu] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [cart, setCart] = useState<{ menuItemId: string; name: string; unitPrice: number; quantity: number }[]>([]);
  const [payMethod, setPayMethod] = useState<'CASH' | 'MIDTRANS'>('CASH');
  const [msg, setMsg] = useState('');
  const [shiftId, setShiftId] = useState<string | null>(() => localStorage.getItem('pos_shift'));
  const [openingCash, setOpeningCash] = useState(0);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [offline, setOffline] = useState(false);
  const [mergeSrc, setMergeSrc] = useState('');
  const [mergeTgt, setMergeTgt] = useState('');
  const [detail, setDetail] = useState<any | null>(null);
  const [closeOpen, setCloseOpen] = useState(false);
  const [actualCash, setActualCash] = useState(0);
  const [voidModal, setVoidModal] = useState<{ orderId: string; itemId: string } | null>(null);
  const [voidReason, setVoidReason] = useState('void');

  useEffect(() => {
    if (branchId) return;
    api<any>('/auth/me')
      .then((me) => {
        const orgId = me.memberships?.[0]?.organizationId;
        if (!orgId) return;
        api<any[]>(`/branches?organizationId=${orgId}`).then((b) => {
          if (b[0]) setTenant(orgId, b[0].id);
        });
      })
      .catch(() => undefined);
  }, [api, branchId, setTenant]);

  const refresh = useCallback(async () => {
    if (!branchId) return;
    try {
      const [o, m, s, t] = await Promise.all([
        api<any[]>(`/pos/active-orders?branchId=${branchId}`),
        api<any>(`/public/branches/${branchId}/menu`),
        api<any[]>(`/pos/sessions?branchId=${branchId}`).catch(() => []),
        api<any[]>(`/tables?branchId=${branchId}`).catch(() => []),
      ]);
      setOrders(o);
      setMenu(m);
      setSessions(s);
      setTables(t);
      setLastSync(new Date());
      setOffline(false);
    } catch {
      setOffline(true);
    }
  }, [api, branchId]);

  useEffect(() => {
    refresh().catch(() => undefined);
    const t = setInterval(() => refresh().catch(() => undefined), 8000);
    return () => clearInterval(t);
  }, [refresh]);

  const { connected } = useRealtime(branchId, () => {
    refresh().catch(() => undefined);
  });

  const total = useMemo(() => cart.reduce((s, c) => s + c.unitPrice * c.quantity, 0), [cart]);

  function addItem(item: any) {
    setCart((prev) => {
      const i = prev.findIndex((x) => x.menuItemId === item.id);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], quantity: next[i].quantity + 1 };
        return next;
      }
      return [...prev, { menuItemId: item.id, name: item.name, unitPrice: item.price, quantity: 1 }];
    });
  }

  async function openShift() {
    if (!branchId) return;
    const s = await api<any>('/pos/shifts/open', {
      method: 'POST',
      body: { branchId, openingCash: Number(openingCash) || 0 },
    });
    setShiftId(s.id);
    localStorage.setItem('pos_shift', s.id);
    setMsg('Shift dibuka');
  }

  async function confirmCloseShift() {
    if (!shiftId) return;
    await api(`/pos/shifts/${shiftId}/close`, {
      method: 'POST',
      body: { actualCash: Number(actualCash) || 0 },
    });
    localStorage.removeItem('pos_shift');
    setShiftId(null);
    setCloseOpen(false);
    setMsg('Shift ditutup');
  }

  async function submitOrder() {
    if (!branchId || !cart.length) return;
    setMsg('');
    try {
      const order = await api<any>('/pos/orders', {
        method: 'POST',
        body: {
          branchId,
          type: 'DINE_IN_POS',
          paymentMethod: payMethod,
          idempotencyKey: crypto.randomUUID(),
          items: cart.map((c) => ({ menuItemId: c.menuItemId, quantity: c.quantity })),
        },
      });
      if (payMethod === 'MIDTRANS') {
        let paymentId = order.payments?.[0]?.id;
        let snapToken = order.snapToken;
        let clientKey = order.clientKey;
        let mock = order.mock;
        if (!paymentId || !snapToken) {
          const snap = await api<any>(`/payments/${order.id}/snap-token`, { method: 'POST' });
          paymentId = snap.payment?.id;
          snapToken = snap.snapToken;
          clientKey = snap.clientKey;
          mock = snap.mock;
        }
        if (isMockSnap(snapToken, clientKey, mock) && paymentId) {
          await api(`/payments/${paymentId}/mock-pay`, { method: 'POST' }).catch(() => undefined);
          setMsg(`Order ${order.orderNumber} dibayar (mock)`);
        } else if (snapToken && clientKey) {
          await loadSnap(clientKey);
          setCart([]);
          window.snap?.pay(snapToken, {
            onSuccess: () => {
              setMsg(`Order ${order.orderNumber} dibayar`);
              refresh();
            },
            onPending: () => {
              setMsg(`Order ${order.orderNumber} pending`);
              refresh();
            },
            onError: () => setMsg('Pembayaran gagal'),
            onClose: () => refresh(),
          });
          await refresh();
          return;
        }
      }
      setCart([]);
      setMsg(`Order ${order.orderNumber} dibuat`);
      await refresh();
    } catch (e: any) {
      setMsg(e.message || 'Gagal');
    }
  }

  async function setStatus(id: string, status: string) {
    await api(`/orders/${id}/status`, { method: 'PATCH', body: { status } });
    await refresh();
  }

  async function openDetail(id: string) {
    setDetail(await api<any>(`/orders/${id}`));
  }

  async function confirmVoid() {
    if (!voidModal) return;
    await api(`/orders/${voidModal.orderId}/void-item`, {
      method: 'POST',
      body: { orderItemId: voidModal.itemId, reason: voidReason || 'void' },
    });
    setVoidModal(null);
    setMsg('Item void');
    await openDetail(voidModal.orderId);
    await refresh();
  }

  async function transferTable(orderId: string, tableId: string) {
    if (!tableId) return;
    await api(`/orders/${orderId}/transfer-table`, { method: 'POST', body: { tableId } });
    setMsg('Transfer meja OK');
    await refresh();
  }

  async function reprint(orderId: string) {
    const r = await api<any>(`/orders/${orderId}/reprint`, { method: 'POST' });
    setMsg(`Reprint: ${r.reprinted || 0} ticket`);
  }

  async function mergeSessions() {
    if (!mergeSrc || !mergeTgt || mergeSrc === mergeTgt) return;
    await api('/pos/sessions/merge', {
      method: 'POST',
      body: { sourceSessionId: mergeSrc, targetSessionId: mergeTgt },
    });
    setMsg('Session digabung');
    setMergeSrc('');
    setMergeTgt('');
    await refresh();
  }

  return (
    <OpsShell>
      <div className="min-h-screen md:flex">
        <div className="flex-1 border-r border-white/10 p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-xl font-bold">POS</h1>
            <div className="flex items-center gap-2 text-black">
              <TenantSwitcher />
              <AceButton as={Link} to="/app" variant="ghost" className="!border-white/20 !text-white !text-sm">
                Merchant
              </AceButton>
            </div>
          </div>
          {offline && (
            <p className="mb-2 rounded-xl bg-amber-500/20 px-3 py-2 text-sm text-amber-100">
              Koneksi gagal — reconnect…
            </p>
          )}
          <p className="mb-2 text-xs text-white/50">
            {lastSync ? `Sync ${lastSync.toLocaleTimeString('id-ID')}` : '—'} · SSE {connected ? 'on' : 'off'}
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(menu?.menus || []).flatMap((m: any) =>
              (m.categories || []).flatMap((c: any) =>
                (c.items || []).map((item: any) => (
                  <GlareCard
                    key={item.id}
                    className="!border-white/10 !bg-white/5 !text-white"
                    onClick={() => addItem(item)}
                  >
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-white/50">{formatIdr(item.price)}</div>
                  </GlareCard>
                )),
              ),
            )}
          </div>

          {sessions.length > 0 && (
            <AceCard className="mt-6 space-y-2 !border-white/10 !bg-white/5 !text-white">
              <h2 className="font-semibold">Merge session</h2>
              <div className="flex flex-wrap gap-2">
                <AceSelect
                  className="!bg-black/40 !text-white flex-1"
                  value={mergeSrc}
                  onChange={(e) => setMergeSrc(e.target.value)}
                >
                  <option value="">Source</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.table?.name || s.tableId} · {s.id.slice(0, 6)}
                    </option>
                  ))}
                </AceSelect>
                <AceSelect
                  className="!bg-black/40 !text-white flex-1"
                  value={mergeTgt}
                  onChange={(e) => setMergeTgt(e.target.value)}
                >
                  <option value="">Target</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.table?.name || s.tableId} · {s.id.slice(0, 6)}
                    </option>
                  ))}
                </AceSelect>
                <AceButton variant="accent" onClick={mergeSessions} disabled={!mergeSrc || !mergeTgt}>
                  Merge
                </AceButton>
              </div>
            </AceCard>
          )}
        </div>

        <aside className="w-full p-4 md:w-96">
          <AceCard className="mb-4 space-y-2 text-sm !border-white/10 !bg-white/5 !text-white">
            <div className="font-semibold">Shift {shiftId ? 'terbuka' : 'tertutup'}</div>
            {!shiftId ? (
              <>
                <AceInput
                  className="!bg-black/40 !text-white"
                  type="number"
                  placeholder="Opening cash"
                  value={openingCash || ''}
                  onChange={(e) => setOpeningCash(Number(e.target.value))}
                />
                <AceButton variant="accent" className="w-full" onClick={openShift} disabled={!branchId}>
                  Buka shift
                </AceButton>
              </>
            ) : (
              <AceButton
                variant="ghost"
                className="w-full !border-white/20 !text-white"
                onClick={() => {
                  setActualCash(openingCash);
                  setCloseOpen(true);
                }}
              >
                Tutup shift
              </AceButton>
            )}
          </AceCard>

          <h2 className="font-semibold">Keranjang</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {cart.map((c) => (
              <li key={c.menuItemId} className="flex justify-between text-white/80">
                <span>
                  {c.quantity}× {c.name}
                </span>
                <span>{formatIdr(c.unitPrice * c.quantity)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 font-bold text-[#c4a574]">{formatIdr(total)}</p>
          <div className="mt-2 flex gap-2">
            <AceButton
              variant={payMethod === 'CASH' ? 'primary' : 'ghost'}
              className={`flex-1 !text-sm ${payMethod !== 'CASH' ? '!border-white/20 !text-white' : ''}`}
              onClick={() => setPayMethod('CASH')}
            >
              Cash
            </AceButton>
            <AceButton
              variant={payMethod === 'MIDTRANS' ? 'primary' : 'ghost'}
              className={`flex-1 !text-sm ${payMethod !== 'MIDTRANS' ? '!border-white/20 !text-white' : ''}`}
              onClick={() => setPayMethod('MIDTRANS')}
            >
              Non-tunai
            </AceButton>
          </div>
          <MovingBorderButton
            className="mt-3 w-full"
            containerClassName="mt-3 w-full"
            disabled={!cart.length}
            onClick={submitOrder}
          >
            Buat order
          </MovingBorderButton>
          {msg && <p className="mt-2 text-sm text-white/50">{msg}</p>}

          <h2 className="mt-8 font-semibold">Order aktif</h2>
          <div className="mt-2 max-h-[50vh] space-y-2 overflow-auto">
            {orders.map((o) => (
              <AceCard key={o.id} className="text-sm !border-white/10 !bg-white/5 !text-white">
                <div className="flex justify-between">
                  <span className="font-bold">{o.orderNumber}</span>
                  <AceBadge tone="info">{o.status}</AceBadge>
                </div>
                <p className="text-white/50">{formatIdr(o.grandTotal ?? o.total ?? 0)}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {o.status === 'NEW' && (
                    <AceButton variant="ghost" className="!border-white/20 !py-1 !text-xs !text-white" onClick={() => setStatus(o.id, 'ACCEPTED')}>
                      Accept
                    </AceButton>
                  )}
                  {['NEW', 'ACCEPTED'].includes(o.status) && (
                    <AceButton variant="ghost" className="!border-white/20 !py-1 !text-xs !text-white" onClick={() => setStatus(o.id, 'PREPARING')}>
                      Prep
                    </AceButton>
                  )}
                  {o.status === 'PREPARING' && (
                    <AceButton variant="ghost" className="!border-white/20 !py-1 !text-xs !text-white" onClick={() => setStatus(o.id, 'READY')}>
                      Ready
                    </AceButton>
                  )}
                  {o.status === 'READY' && (
                    <AceButton variant="primary" className="!py-1 !text-xs" onClick={() => setStatus(o.id, 'COMPLETED')}>
                      Done
                    </AceButton>
                  )}
                  <AceButton variant="ghost" className="!border-white/20 !py-1 !text-xs !text-white" onClick={() => openDetail(o.id)}>
                    Detail
                  </AceButton>
                  <AceButton variant="ghost" className="!border-white/20 !py-1 !text-xs !text-white" onClick={() => reprint(o.id)}>
                    Reprint
                  </AceButton>
                </div>
              </AceCard>
            ))}
          </div>

          {detail && (
            <AceCard className="mt-4 space-y-2 text-sm !border-white/10 !bg-white/5 !text-white">
              <div className="flex justify-between">
                <span className="font-semibold">{detail.orderNumber}</span>
                <button className="text-xs underline text-white/60" onClick={() => setDetail(null)}>
                  Tutup
                </button>
              </div>
              {(detail.items || []).map((i: any) => (
                <div key={i.id} className="flex items-center justify-between gap-2">
                  <span>
                    {i.quantity}× {i.nameSnapshot || i.name}
                    {i.voidedAt ? ' (void)' : ''}
                  </span>
                  {!i.voidedAt && (
                    <AceButton
                      variant="ghost"
                      className="!border-white/20 !py-0.5 !text-xs !text-white"
                      onClick={() => setVoidModal({ orderId: detail.id, itemId: i.id })}
                    >
                      Void
                    </AceButton>
                  )}
                </div>
              ))}
              {tables.length > 0 && (
                <AceSelect
                  className="!bg-black/40 !text-white text-xs"
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) transferTable(detail.id, e.target.value);
                  }}
                >
                  <option value="">Transfer ke meja…</option>
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </AceSelect>
              )}
            </AceCard>
          )}
        </aside>
      </div>

      <AnimatedModal open={closeOpen} onClose={() => setCloseOpen(false)} title="Tutup shift">
        <AceInput
          label="Kas aktual (IDR)"
          type="number"
          value={actualCash}
          onChange={(e) => setActualCash(Number(e.target.value))}
        />
        <div className="mt-4 flex gap-2">
          <AceButton variant="primary" onClick={confirmCloseShift}>
            Simpan
          </AceButton>
          <AceButton variant="ghost" onClick={() => setCloseOpen(false)}>
            Batal
          </AceButton>
        </div>
      </AnimatedModal>

      <AnimatedModal open={!!voidModal} onClose={() => setVoidModal(null)} title="Void item">
        <AceInput label="Alasan" value={voidReason} onChange={(e) => setVoidReason(e.target.value)} />
        <div className="mt-4 flex gap-2">
          <AceButton variant="danger" onClick={confirmVoid}>
            Void
          </AceButton>
          <AceButton variant="ghost" onClick={() => setVoidModal(null)}>
            Batal
          </AceButton>
        </div>
      </AnimatedModal>
    </OpsShell>
  );
}
