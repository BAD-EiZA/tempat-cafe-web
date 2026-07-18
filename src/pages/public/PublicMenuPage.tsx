import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, formatIdr } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { PageShell } from '@/components/ace/PageShell';
import { GlareCard } from '@/components/ui/glare-card';
import { AceButton } from '@/components/ace/AceButton';
import { AceCard } from '@/components/ace/AceCard';
import { Loader } from '@/components/ui/loader';
import { AnimatedModal } from '@/components/ui/animated-modal';
import { MovingBorderButton } from '@/components/ui/moving-border';

type ModSel = { name: string; priceDelta: number };

export function PublicMenuPage() {
  const { cafeSlug } = useParams();
  const [data, setData] = useState<any>(null);
  const cart = useAppStore((s) => s.cart);
  const addToCart = useAppStore((s) => s.addToCart);
  const setTenant = useAppStore((s) => s.setTenant);
  const updateQty = useAppStore((s) => s.updateQty);
  const [pick, setPick] = useState<any | null>(null);
  const [selected, setSelected] = useState<Record<string, ModSel>>({});
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!cafeSlug) return;
    api<any>(`/public/cafes/${cafeSlug}/menu`).then((res) => {
      setData(res);
      if (res.branch) {
        const orgId = res.branch.organizationId || res.branch.brand?.organizationId || '';
        setTenant(orgId, res.branch.id);
      }
    });
  }, [cafeSlug, setTenant]);

  const total = cart.reduce((s, c) => s + c.unitPrice * c.quantity, 0);
  const count = cart.reduce((s, c) => s + c.quantity, 0);

  const modExtra = useMemo(
    () => Object.values(selected).reduce((s, m) => s + (m.priceDelta || 0), 0),
    [selected],
  );

  function openItem(item: any) {
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
        next[groupId] = { name: mod.name, priceDelta: mod.priceDelta || 0 };
        return next;
      }
      return { ...prev, [key]: { name: mod.name, priceDelta: mod.priceDelta || 0 } };
    });
  }

  function confirmPick() {
    if (!pick) return;
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

  if (!data) {
    return (
      <PageShell maxWidth="max-w-lg">
        <Loader />
      </PageShell>
    );
  }

  return (
    <PageShell beams maxWidth="max-w-lg" className="pb-28">
      <header className="sticky top-0 z-20 -mx-4 border-b border-[#e8e4de] bg-[#faf8f5]/90 px-4 py-4 backdrop-blur">
        <p className="text-sm text-[#6b6b6b]">{data.branch?.brand?.name}</p>
        <h1 className="text-xl font-bold">{data.branch?.name || 'Menu'}</h1>
      </header>

      <div className="mt-4 space-y-6">
        {(data.menus || []).map((menu: any) =>
          (menu.categories || []).map((cat: any) => (
            <section key={cat.id}>
              <h2 className="mb-2 font-semibold text-[#1a1a1a]">{cat.name}</h2>
              <div className="space-y-2">
                {(cat.items || []).map((item: any) => {
                  const inCart = cart.find((c) => c.menuItemId === item.id && !c.modifiers?.length);
                  const hasMods = (item.modifierGroups || []).length > 0;
                  return (
                    <GlareCard key={item.id} className="flex items-start justify-between gap-3 !p-3">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">{item.name}</div>
                        {item.description && (
                          <p className="mt-0.5 line-clamp-2 text-sm text-[#6b6b6b]">{item.description}</p>
                        )}
                        <div className="mt-1 text-sm font-semibold text-[#c4a574]">{formatIdr(item.price)}</div>
                        {hasMods && <p className="text-xs text-[#6b6b6b]">+ opsi</p>}
                      </div>
                      {!hasMods && inCart ? (
                        <div className="flex items-center gap-2">
                          <AceButton
                            variant="ghost"
                            className="!px-2 !py-1"
                            onClick={() => updateQty(item.id, inCart.quantity - 1)}
                          >
                            −
                          </AceButton>
                          <span className="w-6 text-center text-sm font-bold">{inCart.quantity}</span>
                          <AceButton
                            variant="ghost"
                            className="!px-2 !py-1"
                            onClick={() => updateQty(item.id, inCart.quantity + 1)}
                          >
                            +
                          </AceButton>
                        </div>
                      ) : (
                        <AceButton variant="primary" className="!px-3 !py-2 text-sm" onClick={() => openItem(item)}>
                          +
                        </AceButton>
                      )}
                    </GlareCard>
                  );
                })}
              </div>
            </section>
          )),
        )}
      </div>

      {count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#e8e4de] bg-white/95 p-4 backdrop-blur">
          <MovingBorderButton as={Link} to="/checkout" containerClassName="w-full" className="w-full">
            Checkout ({count}) · {formatIdr(total)}
          </MovingBorderButton>
        </div>
      )}

      <AnimatedModal open={!!pick} onClose={() => setPick(null)} title={pick?.name || 'Pilih opsi'}>
        {pick && (
          <div className="space-y-4">
            <p className="text-sm text-[#6b6b6b]">
              Dasar {formatIdr(pick.price)}
              {modExtra > 0 ? ` + ${formatIdr(modExtra)}` : ''}
            </p>
            {(pick.modifierGroups || []).map((g: any) => {
              const multi = (g.maxSelect || 1) > 1;
              return (
                <AceCard key={g.id} className="!p-3">
                  <p className="mb-2 text-sm font-semibold">
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
                        >
                          {m.name}
                          {m.priceDelta ? ` (+${formatIdr(m.priceDelta)})` : ''}
                        </AceButton>
                      );
                    })}
                  </div>
                </AceCard>
              );
            })}
            <input
              className="w-full rounded-xl border border-[#d4d0c8] px-3 py-2 text-sm"
              placeholder="Catatan item"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <AceButton variant="accent" className="w-full" onClick={confirmPick}>
              Tambah · {formatIdr(pick.price + modExtra)}
            </AceButton>
          </div>
        )}
      </AnimatedModal>
    </PageShell>
  );
}
