import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus } from '@phosphor-icons/react';
import { useApi } from '@/hooks/useApi';
import { useRealtime } from '@/hooks/useRealtime';
import { useAppStore } from '@/lib/store';
import { formatIdr } from '@/lib/api';
import { TenantSwitcher } from '@/components/TenantSwitcher';
import { OpsShell } from '@/components/ace/OpsShell';
import { AceButton } from '@/components/ace/AceButton';
import { AceInput, AceSelect } from '@/components/ace/AceInput';
import { AnimatedModal } from '@/components/ui/animated-modal';
import { AceBadge } from '@/components/ace/PageShell';
import { isMockSnap, loadSnap } from '@/lib/snap';
import { ActionError, ConnectionStatus, statusLabel } from '@/components/ace/OpsFeedback';
import { cn } from '@/lib/utils';

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
  const [submitting, setSubmitting] = useState(false);
  const [busyAction, setBusyAction] = useState('');
  const [actionError, setActionError] = useState('');
  const [activeCat, setActiveCat] = useState('all');
  const submittingRef = useRef(false);

  useEffect(() => {
    setShiftId(localStorage.getItem('pos_shift'));
    setCart([]);
    setDetail(null);
  }, [branchId]);

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

  const categories = useMemo(() => {
    const list: { id: string; name: string }[] = [];
    for (const m of menu?.menus || []) {
      for (const c of m.categories || []) {
        if ((c.items || []).length) list.push({ id: c.id, name: c.name });
      }
    }
    return list;
  }, [menu]);

  const items = useMemo(() => {
    const out: any[] = [];
    for (const m of menu?.menus || []) {
      for (const c of m.categories || []) {
        if (activeCat !== 'all' && c.id !== activeCat) continue;
        for (const item of c.items || []) {
          out.push({ ...item, _catId: c.id });
        }
      }
    }
    return out;
  }, [menu, activeCat]);

  const total = useMemo(() => cart.reduce((s, c) => s + c.unitPrice * c.quantity, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((s, c) => s + c.quantity, 0), [cart]);

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

  function setCartQty(menuItemId: string, quantity: number) {
    setCart((prev) =>
      quantity <= 0
        ? prev.filter((c) => c.menuItemId !== menuItemId)
        : prev.map((c) => (c.menuItemId === menuItemId ? { ...c, quantity } : c)),
    );
  }

  async function openShift() {
    if (!branchId || busyAction) return;
    setBusyAction('open-shift');
    setActionError('');
    try {
      const s = await api<any>('/pos/shifts/open', {
        method: 'POST',
        body: { branchId, openingCash: Number(openingCash) || 0 },
      });
      setShiftId(s.id);
      localStorage.setItem('pos_shift', s.id);
      setMsg('Shift dibuka');
    } catch (e: any) {
      setActionError(e.message || 'Shift gagal dibuka');
    } finally {
      setBusyAction('');
    }
  }

  async function confirmCloseShift() {
    if (!shiftId || busyAction) return;
    setBusyAction('close-shift');
    setActionError('');
    try {
      await api(`/pos/shifts/${shiftId}/close`, {
        method: 'POST',
        body: { actualCash: Number(actualCash) || 0 },
      });
      localStorage.removeItem('pos_shift');
      setShiftId(null);
      setCloseOpen(false);
      setMsg('Shift ditutup');
    } catch (e: any) {
      setActionError(e.message || 'Shift gagal ditutup');
    } finally {
      setBusyAction('');
    }
  }

  async function submitOrder() {
    if (!shiftId) {
      setMsg('Buka shift sebelum membuat order');
      return;
    }
    if (!branchId || !cart.length || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
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
          setCart([]);
          setMsg(`Order ${order.orderNumber} dibayar (mock)`);
        } else if (snapToken && clientKey) {
          await loadSnap(clientKey);
          window.snap?.pay(snapToken, {
            onSuccess: () => {
              setCart([]);
              setMsg(`Order ${order.orderNumber} dibayar`);
              refresh();
            },
            onPending: () => {
              setCart([]);
              setMsg(`Order ${order.orderNumber} pending`);
              refresh();
            },
            onError: () => setMsg('Pembayaran gagal'),
            onClose: () => {
              setMsg('Pembayaran belum selesai. Keranjang tetap tersimpan.');
              refresh();
            },
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
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  async function setStatus(id: string, status: string) {
    if (busyAction) return;
    setBusyAction(`status:${id}`);
    setActionError('');
    try {
      await api(`/orders/${id}/status`, { method: 'PATCH', body: { status } });
      await refresh();
    } catch (e: any) {
      setActionError(e.message || 'Status order gagal diubah');
    } finally {
      setBusyAction('');
    }
  }

  async function openDetail(id: string) {
    setActionError('');
    try {
      setDetail(await api<any>(`/orders/${id}`));
    } catch (e: any) {
      setActionError(e.message || 'Detail order gagal dimuat');
    }
  }

  async function confirmVoid() {
    if (!voidModal || busyAction) return;
    const orderId = voidModal.orderId;
    setBusyAction('void');
    setActionError('');
    try {
      await api(`/orders/${orderId}/void-item`, {
        method: 'POST',
        body: { orderItemId: voidModal.itemId, reason: voidReason || 'void' },
      });
      setVoidModal(null);
      setMsg('Item dibatalkan');
      await openDetail(orderId);
      await refresh();
    } catch (e: any) {
      setActionError(e.message || 'Item gagal dibatalkan');
    } finally {
      setBusyAction('');
    }
  }

  async function transferTable(orderId: string, tableId: string) {
    if (!tableId) return;
    setActionError('');
    try {
      await api(`/orders/${orderId}/transfer-table`, { method: 'POST', body: { tableId } });
      setMsg('Transfer meja OK');
      await refresh();
    } catch (e: any) {
      setActionError(e.message || 'Transfer meja gagal');
    }
  }

  async function reprint(orderId: string) {
    setActionError('');
    try {
      const r = await api<any>(`/orders/${orderId}/reprint`, { method: 'POST' });
      setMsg(`Reprint: ${r.reprinted || 0} ticket`);
    } catch (e: any) {
      setActionError(e.message || 'Cetak ulang gagal');
    }
  }

  async function mergeSessions() {
    if (!mergeSrc || !mergeTgt || mergeSrc === mergeTgt) return;
    setActionError('');
    try {
      await api('/pos/sessions/merge', {
        method: 'POST',
        body: { sourceSessionId: mergeSrc, targetSessionId: mergeTgt },
      });
      setMsg('Session digabung');
      setMergeSrc('');
      setMergeTgt('');
      await refresh();
    } catch (e: any) {
      setActionError(e.message || 'Merge session gagal');
    }
  }

  return (
    <OpsShell>
      <div className="flex min-h-[100dvh] flex-col md:flex-row">
        {/* Menu column */}
        <div className="flex min-w-0 flex-1 flex-col border-b border-white/10 p-3 sm:p-4 md:border-b-0 md:border-r">
          <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-xl font-bold tracking-tight">POS</h1>
              <p className="text-xs ops-muted">
                Shift {shiftId ? 'terbuka' : 'tertutup'} · {items.length} item
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <TenantSwitcher />
              <AceButton as={Link} to="/app" variant="ghost" className="!border-white/15 !text-white !text-sm">
                Merchant
              </AceButton>
            </div>
          </header>

          <ConnectionStatus
            connected={connected}
            lastSync={lastSync}
            error={offline ? 'Data POS gagal dimuat' : ''}
            onRetry={() => refresh()}
          />
          <ActionError message={actionError} />

          {categories.length > 0 && (
            <nav
              aria-label="Kategori"
              className="mb-3 flex gap-1.5 overflow-x-auto pb-1"
            >
              <button
                type="button"
                className="ops-chip shrink-0"
                data-active={activeCat === 'all'}
                onClick={() => setActiveCat('all')}
              >
                Semua
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="ops-chip shrink-0"
                  data-active={activeCat === c.id}
                  onClick={() => setActiveCat(c.id)}
                >
                  {c.name}
                </button>
              ))}
            </nav>
          )}

          <div className="grid flex-1 grid-cols-2 content-start gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                className="ops-tile min-h-[4.5rem]"
                onClick={() => addItem(item)}
              >
                <div className="line-clamp-2 text-sm font-semibold leading-snug">{item.name}</div>
                <div className="mt-1 text-sm font-bold text-[var(--ops-accent)]">
                  {formatIdr(item.price)}
                </div>
              </button>
            ))}
            {!items.length && (
              <div className="ops-empty col-span-full">Menu kosong atau belum dimuat.</div>
            )}
          </div>

          {sessions.length > 0 && (
            <div className="ops-panel mt-4 space-y-2 p-3">
              <h2 className="text-sm font-semibold">Merge session</h2>
              <div className="flex flex-wrap gap-2">
                <AceSelect
                  className="flex-1"
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
                  className="flex-1"
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
            </div>
          )}
        </div>

        {/* Cart / orders rail */}
        <aside className="flex w-full flex-col gap-3 p-3 sm:p-4 md:w-[22rem] md:shrink-0 lg:w-96">
          <div className="ops-panel space-y-2 p-3 text-sm">
            <div className="font-semibold">
              Shift{' '}
              <span className={shiftId ? 'text-emerald-300' : 'text-amber-200'}>
                {shiftId ? 'terbuka' : 'tertutup'}
              </span>
            </div>
            {!shiftId ? (
              <>
                <AceInput
                  type="number"
                  placeholder="Opening cash"
                  value={openingCash || ''}
                  onChange={(e) => setOpeningCash(Number(e.target.value))}
                />
                <AceButton
                  variant="accent"
                  className="w-full"
                  onClick={openShift}
                  disabled={!branchId || !!busyAction}
                >
                  {busyAction === 'open-shift' ? 'Membuka...' : 'Buka shift'}
                </AceButton>
              </>
            ) : (
              <AceButton
                variant="ghost"
                className="w-full !border-white/15 !text-white"
                onClick={() => {
                  setActualCash(openingCash);
                  setCloseOpen(true);
                }}
              >
                Tutup shift
              </AceButton>
            )}
          </div>

          <div className="ops-panel flex flex-1 flex-col p-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Keranjang</h2>
              {cartCount > 0 && (
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold">
                  {cartCount}
                </span>
              )}
            </div>
            <ul className="mt-2 max-h-48 space-y-2 overflow-y-auto text-sm">
              {cart.map((c) => (
                <li key={c.menuItemId} className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{c.name}</div>
                    <div className="ops-muted text-xs">{formatIdr(c.unitPrice * c.quantity)}</div>
                  </div>
                  <div className="flex items-center gap-0.5 rounded-lg border border-white/10 bg-black/20 p-0.5">
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/10"
                      aria-label={`Kurangi ${c.name}`}
                      onClick={() => setCartQty(c.menuItemId, c.quantity - 1)}
                    >
                      <Minus weight="bold" className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold tabular-nums">{c.quantity}</span>
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/10"
                      aria-label={`Tambah ${c.name}`}
                      onClick={() => setCartQty(c.menuItemId, c.quantity + 1)}
                    >
                      <Plus weight="bold" className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
              {!cart.length && <li className="ops-muted py-4 text-center text-xs">Keranjang kosong</li>}
            </ul>

            <p className="mt-3 text-right text-lg font-bold tabular-nums text-[var(--ops-accent)]">
              {formatIdr(total)}
            </p>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <AceButton
                variant={payMethod === 'CASH' ? 'primary' : 'ghost'}
                className={cn('!text-sm', payMethod !== 'CASH' && '!border-white/15 !text-white')}
                onClick={() => setPayMethod('CASH')}
              >
                Cash
              </AceButton>
              <AceButton
                variant={payMethod === 'MIDTRANS' ? 'primary' : 'ghost'}
                className={cn('!text-sm', payMethod !== 'MIDTRANS' && '!border-white/15 !text-white')}
                onClick={() => setPayMethod('MIDTRANS')}
              >
                Non-tunai
              </AceButton>
            </div>

            <AceButton
              variant="accent"
              className="mt-3 w-full !min-h-12"
              disabled={!cart.length || !shiftId || submitting}
              onClick={submitOrder}
            >
              {submitting ? 'Memproses…' : shiftId ? 'Buat order' : 'Buka shift dulu'}
            </AceButton>
            {msg && <p className="mt-2 text-sm ops-muted">{msg}</p>}
          </div>

          <div>
            <h2 className="mb-2 font-semibold">Order aktif</h2>
            <div className="max-h-[40vh] space-y-2 overflow-y-auto md:max-h-[32vh]">
              {orders.map((o) => (
                <div key={o.id} className="ops-panel p-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold">{o.orderNumber}</span>
                    <AceBadge tone="info">{statusLabel(o.status)}</AceBadge>
                  </div>
                  <p className="mt-0.5 ops-muted">{formatIdr(o.grandTotal ?? o.total ?? 0)}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {o.status === 'NEW' && (
                      <AceButton
                        variant="ghost"
                        className="!border-white/15 !text-xs !text-white"
                        disabled={!!busyAction}
                        onClick={() => setStatus(o.id, 'ACCEPTED')}
                      >
                        Terima
                      </AceButton>
                    )}
                    {['NEW', 'ACCEPTED'].includes(o.status) && (
                      <AceButton
                        variant="ghost"
                        className="!border-white/15 !text-xs !text-white"
                        disabled={!!busyAction}
                        onClick={() => setStatus(o.id, 'PREPARING')}
                      >
                        Siapkan
                      </AceButton>
                    )}
                    {o.status === 'PREPARING' && (
                      <AceButton
                        variant="ghost"
                        className="!border-white/15 !text-xs !text-white"
                        disabled={!!busyAction}
                        onClick={() => setStatus(o.id, 'READY')}
                      >
                        Siap
                      </AceButton>
                    )}
                    {o.status === 'READY' && (
                      <AceButton
                        variant="primary"
                        className="!text-xs"
                        disabled={!!busyAction}
                        onClick={() => window.confirm('Selesaikan order ini?') && setStatus(o.id, 'COMPLETED')}
                      >
                        Selesai
                      </AceButton>
                    )}
                    <AceButton
                      variant="ghost"
                      className="!border-white/15 !text-xs !text-white"
                      onClick={() => openDetail(o.id)}
                    >
                      Detail
                    </AceButton>
                    <AceButton
                      variant="ghost"
                      className="!border-white/15 !text-xs !text-white"
                      onClick={() => reprint(o.id)}
                    >
                      Cetak
                    </AceButton>
                  </div>
                </div>
              ))}
              {!orders.length && <div className="ops-empty">Tidak ada order aktif.</div>}
            </div>
          </div>

          {detail && (
            <div className="ops-panel space-y-2 p-3 text-sm">
              <div className="flex justify-between">
                <span className="font-semibold">{detail.orderNumber}</span>
                <button
                  type="button"
                  className="text-xs ops-muted underline-offset-2 hover:underline"
                  onClick={() => setDetail(null)}
                >
                  Tutup
                </button>
              </div>
              {(detail.items || []).map((i: any) => (
                <div key={i.id} className="flex items-center justify-between gap-2">
                  <span>
                    {i.quantity}x {i.nameSnapshot || i.name}
                    {i.voidedAt ? ' (void)' : ''}
                  </span>
                  {!i.voidedAt && (
                    <AceButton
                      variant="ghost"
                      className="!border-white/15 !py-0.5 !text-xs !text-white"
                      onClick={() => setVoidModal({ orderId: detail.id, itemId: i.id })}
                    >
                      Batalkan
                    </AceButton>
                  )}
                </div>
              ))}
              {tables.length > 0 && (
                <AceSelect
                  className="text-xs"
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
            </div>
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

      <AnimatedModal open={!!voidModal} onClose={() => setVoidModal(null)} title="Batalkan item">
        <AceInput label="Alasan" value={voidReason} onChange={(e) => setVoidReason(e.target.value)} />
        <div className="mt-4 flex gap-2">
          <AceButton variant="danger" disabled={!!busyAction} onClick={confirmVoid}>
            {busyAction === 'void' ? 'Memproses...' : 'Batalkan item'}
          </AceButton>
          <AceButton variant="ghost" onClick={() => setVoidModal(null)}>
            Batal
          </AceButton>
        </div>
      </AnimatedModal>
    </OpsShell>
  );
}
