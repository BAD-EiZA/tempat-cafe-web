import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, ShoppingCart } from '@phosphor-icons/react';
import { api, formatIdr } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { PageShell } from '@/components/ace/PageShell';
import { AceButton } from '@/components/ace/AceButton';
import { AceCard } from '@/components/ace/AceCard';
import { Loader } from '@/components/ui/loader';
import { AnimatedModal } from '@/components/ui/animated-modal';
import { cn } from '@/lib/utils';
import { assets } from '@/lib/assets';

type ModSel = { modifierId: string; name: string; priceDelta: number };

export function PublicMenuPage() {
  const { cafeSlug, branchSlug } = useParams();
  const [data, setData] = useState<any>(null);
  const cart = useAppStore((s) => s.cart);
  const addToCart = useAppStore((s) => s.addToCart);
  const setTenant = useAppStore((s) => s.setTenant);
  const setCafeSlug = useAppStore((s) => s.setCafeSlug);
  const updateQty = useAppStore((s) => s.updateQty);
  const tableId = useAppStore((s) => s.tableId);
  const [pick, setPick] = useState<any | null>(null);
  const [selected, setSelected] = useState<Record<string, ModSel>>({});
  const [notes, setNotes] = useState('');
  const [err, setErr] = useState('');
  const [pickErr, setPickErr] = useState('');
  const [retry, setRetry] = useState(0);
  const [activeCat, setActiveCat] = useState('');
  const cafeBase = branchSlug ? `/c/${cafeSlug}/${branchSlug}` : `/c/${cafeSlug}`;

  useEffect(() => {
    if (!cafeSlug) return;
    setErr('');
    setCafeSlug(cafeSlug);
    try {
      sessionStorage.setItem('lastCafeSlug', cafeSlug);
      if (branchSlug) sessionStorage.setItem('lastBranchSlug', branchSlug);
      else sessionStorage.removeItem('lastBranchSlug');
    } catch {
      /* ignore */
    }
    const path = branchSlug
      ? `/public/cafes/${cafeSlug}/${branchSlug}/menu`
      : `/public/cafes/${cafeSlug}/menu`;
    api<any>(path)
      .then((res) => {
        setData(res);
        if (res.branch) {
          const orgId = res.branch.organizationId || res.branch.brand?.organizationId || '';
          setTenant(orgId, res.branch.id);
        }
      })
      .catch((e) => setErr(e.message || 'Menu gagal dimuat'));
  }, [cafeSlug, branchSlug, setTenant, setCafeSlug, retry]);

  const categories = useMemo(() => {
    const list: { id: string; name: string; items: any[] }[] = [];
    for (const menu of data?.menus || []) {
      for (const cat of menu.categories || []) {
        if ((cat.items || []).length) list.push({ id: cat.id, name: cat.name, items: cat.items });
      }
    }
    return list;
  }, [data]);

  useEffect(() => {
    if (categories.length && !activeCat) setActiveCat(categories[0].id);
  }, [categories, activeCat]);

  const total = cart.reduce((s, c) => s + c.unitPrice * c.quantity, 0);
  const count = cart.reduce((s, c) => s + c.quantity, 0);

  const modExtra = useMemo(
    () => Object.values(selected).reduce((s, m) => s + (m.priceDelta || 0), 0),
    [selected],
  );

  function scrollToCat(id: string) {
    setActiveCat(id);
    document.getElementById(`cat-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function openItem(item: any) {
    if (item.isAvailable === false || item.soldOut) return;
    const groups = item.modifierGroups || [];
    if (!groups.length) {
      addToCart({
        menuItemId: item.id,
        name: item.name,
        unitPrice: item.price,
        quantity: 1,
      });
      return;
    }
    setPick(item);
    setSelected({});
    setNotes('');
    setPickErr('');
  }

  function toggleMod(groupId: string, mod: any, multi: boolean) {
    setSelected((prev) => {
      const key = multi ? `${groupId}:${mod.id}` : groupId;
      if (prev[key]?.name === mod.name) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      if (!multi) {
        const next = { ...prev };
        Object.keys(next).forEach((k) => {
          if (k === groupId || k.startsWith(`${groupId}:`)) delete next[k];
        });
        next[groupId] = { modifierId: mod.id, name: mod.name, priceDelta: mod.priceDelta || 0 };
        return next;
      }
      return { ...prev, [key]: { modifierId: mod.id, name: mod.name, priceDelta: mod.priceDelta || 0 } };
    });
  }

  function confirmPick() {
    if (!pick) return;
    const missing = (pick.modifierGroups || []).find(
      (g: any) =>
        g.required && !Object.keys(selected).some((key) => key === g.id || key.startsWith(`${g.id}:`)),
    );
    if (missing) {
      setPickErr(`Pilih opsi ${missing.name}`);
      return;
    }
    const modifiers = Object.values(selected);
    const unitPrice = pick.price + modifiers.reduce((s, m) => s + m.priceDelta, 0);
    addToCart({
      menuItemId: pick.id,
      name: pick.name,
      unitPrice,
      quantity: 1,
      notes: notes || undefined,
      modifiers: modifiers.length ? modifiers : undefined,
    });
    setPick(null);
  }

  if (err) {
    return (
      <PageShell beams={false} maxWidth="max-w-lg">
        <AceCard className="mt-10 text-center" role="alert">
          <h1 className="font-semibold">Menu tidak dapat dimuat</h1>
          <p className="mt-2 text-sm text-[var(--danger)]">{err}</p>
          <div className="mt-4 flex justify-center gap-2">
            <AceButton onClick={() => setRetry((n) => n + 1)}>Coba lagi</AceButton>
            <AceButton as={Link} to={cafeBase} variant="ghost">
              Kembali ke kafe
            </AceButton>
          </div>
        </AceCard>
      </PageShell>
    );
  }

  if (!data) {
    return (
      <PageShell beams={false} maxWidth="max-w-lg">
        <Loader label="Memuat menu…" />
      </PageShell>
    );
  }

  return (
    <PageShell beams={false} maxWidth="max-w-lg" className={cn(count > 0 ? 'pb-28' : 'pb-10')}>
      <header className="sticky top-0 z-20 -mx-4 border-b border-cafe-border bg-cafe-bg/95 px-4 pt-3 pb-0 backdrop-blur">
        <div className="flex items-start gap-3">
          <Link
            to={cafeBase}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cafe-border bg-cafe-card text-cafe-ink"
            aria-label="Kembali ke kafe"
          >
            <ArrowLeft weight="bold" className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1 pb-3">
            <p className="truncate text-xs font-medium text-cafe-muted">{data.branch?.brand?.name}</p>
            <h1 className="truncate text-lg font-bold tracking-tight text-cafe-ink">
              {data.branch?.name || 'Menu'}
            </h1>
            {tableId && (
              <p className="mt-0.5 text-xs text-cafe-forest-mid">Pesanan meja aktif</p>
            )}
          </div>
        </div>
        {categories.length > 1 && (
          <nav
            aria-label="Kategori menu"
            className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-3 scrollbar-none"
          >
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => scrollToCat(cat.id)}
                className={cn(
                  'shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold transition',
                  activeCat === cat.id
                    ? 'bg-cafe-forest text-cafe-card'
                    : 'bg-cafe-card text-cafe-muted ring-1 ring-cafe-border hover:text-cafe-ink',
                )}
              >
                {cat.name}
              </button>
            ))}
          </nav>
        )}
      </header>

      <div className="mt-5 space-y-8">
        {categories.map((cat) => (
          <section key={cat.id} id={`cat-${cat.id}`} className="scroll-mt-36">
            <h2 className="mb-3 text-base font-bold tracking-tight text-cafe-ink">{cat.name}</h2>
            <ul className="divide-y divide-cafe-border rounded-2xl border border-cafe-border bg-cafe-card">
              {cat.items.map((item: any) => {
                const soldOut = item.isAvailable === false || item.soldOut;
                const inCart = cart.find((c) => c.menuItemId === item.id && !c.modifiers?.length);
                const hasMods = (item.modifierGroups || []).length > 0;
                const img = item.imageUrl || item.photoUrl || item.image || assets.menuItem;
                return (
                  <li
                    key={item.id}
                    className={cn(
                      'flex items-stretch gap-3 p-3',
                      soldOut && 'opacity-55',
                    )}
                  >
                    <img
                      src={img}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-xl object-cover bg-cafe-hover"
                      width={64}
                      height={64}
                      loading="lazy"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-cafe-ink">{item.name}</div>
                      {item.description && (
                        <p className="mt-0.5 line-clamp-2 text-sm text-cafe-muted">{item.description}</p>
                      )}
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-cafe-accent">
                          {formatIdr(item.price)}
                        </span>
                        {hasMods && !soldOut && (
                          <span className="text-xs text-cafe-muted">+ opsi</span>
                        )}
                        {soldOut && (
                          <span className="text-xs font-semibold text-cafe-muted">Habis</span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center self-center">
                      {soldOut ? null : !hasMods && inCart ? (
                        <div className="flex items-center gap-1 rounded-xl border border-cafe-border bg-cafe-bg p-0.5">
                          <AceButton
                            variant="ghost"
                            className="!h-9 !min-h-9 !w-9 !border-0 !px-0 !py-0"
                            aria-label={`Kurangi ${item.name}`}
                            onClick={() => updateQty(item.id, inCart.quantity - 1)}
                          >
                            <Minus weight="bold" className="h-4 w-4" />
                          </AceButton>
                          <span className="w-6 text-center text-sm font-bold" aria-live="polite">
                            {inCart.quantity}
                          </span>
                          <AceButton
                            variant="ghost"
                            className="!h-9 !min-h-9 !w-9 !border-0 !px-0 !py-0"
                            aria-label={`Tambah ${item.name}`}
                            onClick={() => updateQty(item.id, inCart.quantity + 1)}
                          >
                            <Plus weight="bold" className="h-4 w-4" />
                          </AceButton>
                        </div>
                      ) : (
                        <AceButton
                          variant="primary"
                          className="!h-10 !min-h-10 !w-10 !px-0 !py-0"
                          aria-label={`Tambah ${item.name}`}
                          onClick={() => openItem(item)}
                        >
                          <Plus weight="bold" className="h-4 w-4" />
                        </AceButton>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      {!categories.length && (
        <AceCard className="mt-8 text-center" role="status">
          <p className="font-semibold">Menu belum tersedia</p>
          <p className="mt-1 text-sm text-cafe-muted">Silakan kembali lagi nanti.</p>
          <AceButton as={Link} to={cafeBase} variant="ghost" className="mt-4">
            Kembali ke kafe
          </AceButton>
        </AceCard>
      )}

      {count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-cafe-border bg-cafe-card/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
          <div className="mx-auto max-w-lg">
            <AceButton as={Link} to="/checkout" variant="primary" className="w-full gap-2">
              <ShoppingCart weight="bold" className="h-4 w-4" />
              Checkout ({count}) · {formatIdr(total)}
            </AceButton>
          </div>
        </div>
      )}

      <AnimatedModal open={!!pick} onClose={() => setPick(null)} title={pick?.name || 'Pilih opsi'}>
        {pick && (
          <div className="space-y-4">
            <p className="text-sm text-cafe-muted">
              Dasar {formatIdr(pick.price)}
              {modExtra > 0 ? ` + ${formatIdr(modExtra)}` : ''}
            </p>
            {(pick.modifierGroups || []).map((g: any) => {
              const multi = (g.maxSelect || 1) > 1;
              return (
                <div key={g.id} className="rounded-xl border border-cafe-border bg-cafe-bg/50 p-3">
                  <p className="mb-2 text-sm font-semibold text-cafe-ink">
                    {g.name}
                    {g.required ? ' *' : ''}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(g.modifiers || []).map((m: any) => {
                      const key = multi ? `${g.id}:${m.id}` : g.id;
                      const on = selected[key]?.name === m.name;
                      return (
                        <AceButton
                          key={m.id}
                          type="button"
                          variant={on ? 'primary' : 'ghost'}
                          className="!text-xs"
                          onClick={() => toggleMod(g.id, m, multi)}
                          aria-pressed={on}
                        >
                          {m.name}
                          {m.priceDelta ? ` (+${formatIdr(m.priceDelta)})` : ''}
                        </AceButton>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            <label className="block text-sm font-semibold text-cafe-muted" htmlFor="item-notes">
              Catatan item
            </label>
            <input
              id="item-notes"
              className="min-h-11 w-full rounded-xl border border-cafe-border bg-cafe-card px-3 py-2 text-sm outline-none focus:border-cafe-accent focus:ring-2 focus:ring-cafe-accent/25"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            {pickErr && (
              <p role="alert" className="text-sm text-[var(--danger)]">
                {pickErr}
              </p>
            )}
            <AceButton variant="accent" className="w-full" onClick={confirmPick}>
              Tambah · {formatIdr(pick.price + modExtra)}
            </AceButton>
          </div>
        )}
      </AnimatedModal>
    </PageShell>
  );
}
