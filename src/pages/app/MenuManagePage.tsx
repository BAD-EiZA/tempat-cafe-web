import { useEffect, useState } from 'react';
import { AceCard } from '@/components/ace/AceCard';
import { AceButton } from '@/components/ace/AceButton';
import { AceBadge, EmptyState, StatCard } from '@/components/ace/PageShell';
import { useApi } from '../../hooks/useApi';
import { useAppStore } from '../../lib/store';
import { formatIdr } from '../../lib/api';

export function MenuManagePage() {
  const api = useApi();
  const branchId = useAppStore((s) => s.branchId);
  const [menus, setMenus] = useState<any[]>([]);
  const [brandId, setBrandId] = useState('');
  const [itemForm, setItemForm] = useState({ categoryId: '', name: '', basePrice: 0, description: '' });
  const [catForm, setCatForm] = useState({ menuId: '', name: '' });
  const [modForm, setModForm] = useState({ name: '', optionName: '', priceDelta: 0, groupId: '' });
  const [err, setErr] = useState('');

  async function load() {
    if (!branchId) return;
    const list = await api<any[]>(`/menus?branchId=${branchId}`);
    setMenus(list);
    if (list[0]?.brandId) setBrandId(list[0].brandId);
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, [api, branchId]);

  async function createMenu() {
    if (!brandId && !branchId) return;
    setErr('');
    try {
      const me = await api<any>('/auth/me');
      const orgId = me.memberships?.[0]?.organizationId;
      const branches = await api<any[]>(`/branches?organizationId=${orgId}`);
      const b = branches.find((x) => x.id === branchId) || branches[0];
      await api('/menus', {
        method: 'POST',
        body: { brandId: b.brandId, branchId: b.id, name: 'Menu Utama' },
      });
      await load();
    } catch (e: any) {
      setErr(e.message);
    }
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    await api('/menu-categories', { method: 'POST', body: catForm });
    setCatForm({ ...catForm, name: '' });
    await load();
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    const slug = itemForm.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    await api('/menu-items', {
      method: 'POST',
      body: {
        categoryId: itemForm.categoryId,
        name: itemForm.name,
        description: itemForm.description || undefined,
        slug,
        basePrice: Number(itemForm.basePrice),
      },
    });
    setItemForm({ categoryId: itemForm.categoryId, name: '', basePrice: 0, description: '' });
    await load();
  }

  async function addModifierGroup(e: React.FormEvent) {
    e.preventDefault();
    const g = await api<any>('/modifier-groups', {
      method: 'POST',
      body: { name: modForm.name, required: false, maxSelect: 3 },
    });
    if (modForm.optionName) {
      await api('/modifiers', {
        method: 'POST',
        body: {
          modifierGroupId: g.id,
          name: modForm.optionName,
          priceDelta: Number(modForm.priceDelta) || 0,
        },
      });
    }
    setModForm({ name: '', optionName: '', priceDelta: 0, groupId: g.id });
    await load();
  }

  async function linkModifier(itemId: string) {
    if (!modForm.groupId) return;
    await api(`/menu-items/${itemId}/modifier-groups`, {
      method: 'POST',
      body: { modifierGroupId: modForm.groupId },
    });
    await load();
  }

  async function toggleSoldOut(itemId: string, soldOut: boolean) {
    if (!branchId) return;
    await api(`/menu-items/${itemId}/sold-out`, {
      method: 'POST',
      body: { branchId, isSoldOut: soldOut },
    });
    await load();
  }

  return (
    <div className="animate-float-up" data-ace="1">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Menu</h1>
        <button className="inline-flex items-center justify-center rounded-xl bg-[#1a1a1a] px-4 py-2.5 text-sm font-semibold text-white" onClick={createMenu} disabled={!branchId}>
          + Menu
        </button>
      </div>
      {err && <p className="mt-2 text-sm text-[var(--danger)]">{err}</p>}
      {!branchId && <p className="mt-4 text-[var(--muted)]">Pilih tenant di dashboard dulu.</p>}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <form className="rounded-2xl border border-[#e8e4de] bg-white p-4 shadow-sm space-y-2" onSubmit={addCategory}>
          <h2 className="font-semibold">Kategori baru</h2>
          <select
            className="input"
            value={catForm.menuId}
            onChange={(e) => setCatForm({ ...catForm, menuId: e.target.value })}
            required
          >
            <option value="">Pilih menu</option>
            {menus.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <input
            className="input"
            placeholder="Nama kategori"
            value={catForm.name}
            onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
            required
          />
          <button className="inline-flex items-center justify-center rounded-xl bg-[#c4a574] px-4 py-2.5 text-sm font-semibold text-[#1a1a1a]" type="submit">
            Tambah kategori
          </button>
        </form>

        <form className="rounded-2xl border border-[#e8e4de] bg-white p-4 shadow-sm space-y-2" onSubmit={addItem}>
          <h2 className="font-semibold">Item baru</h2>
          <select
            className="input"
            value={itemForm.categoryId}
            onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
            required
          >
            <option value="">Pilih kategori</option>
            {menus.flatMap((m) =>
              (m.categories || []).map((c: any) => (
                <option key={c.id} value={c.id}>
                  {m.name} / {c.name}
                </option>
              )),
            )}
          </select>
          <input
            className="input"
            placeholder="Nama item"
            value={itemForm.name}
            onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
            required
          />
          <input
            className="input"
            type="number"
            placeholder="Harga"
            value={itemForm.basePrice || ''}
            onChange={(e) => setItemForm({ ...itemForm, basePrice: Number(e.target.value) })}
            required
          />
          <input
            className="input"
            placeholder="Deskripsi"
            value={itemForm.description}
            onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
          />
          <button className="inline-flex items-center justify-center rounded-xl bg-[#c4a574] px-4 py-2.5 text-sm font-semibold text-[#1a1a1a]" type="submit">
            Tambah item
          </button>
        </form>
      </div>

      <form className="rounded-2xl border border-[#e8e4de] bg-white p-4 shadow-sm mt-4 max-w-xl space-y-2" onSubmit={addModifierGroup}>
        <h2 className="font-semibold">Modifier group</h2>
        <input
          className="input"
          placeholder="Nama group (mis. Ukuran)"
          value={modForm.name}
          onChange={(e) => setModForm({ ...modForm, name: e.target.value })}
          required
        />
        <input
          className="input"
          placeholder="Opsi pertama (mis. Large)"
          value={modForm.optionName}
          onChange={(e) => setModForm({ ...modForm, optionName: e.target.value })}
        />
        <input
          className="input"
          type="number"
          placeholder="Price delta"
          value={modForm.priceDelta || ''}
          onChange={(e) => setModForm({ ...modForm, priceDelta: Number(e.target.value) })}
        />
        <button className="inline-flex items-center justify-center rounded-xl border border-[#d4d0c8] px-4 py-2.5 text-sm font-semibold" type="submit">
          Buat group + opsi
        </button>
        {modForm.groupId && (
          <p className="text-xs text-[var(--muted)]">Group ID: {modForm.groupId} — klik Link di item</p>
        )}
      </form>

      <div className="mt-8 space-y-6">
        {menus.map((m) => (
          <div key={m.id}>
            <h2 className="text-lg font-semibold">{m.name}</h2>
            {(m.categories || []).map((c: any) => (
              <div key={c.id} className="mt-3">
                <h3 className="text-sm font-bold text-[var(--muted)]">{c.name}</h3>
                <div className="mt-2 space-y-2">
                  {(c.items || []).map((item: any) => {
                    const ov = item.branchItems?.find((b: any) => b.branchId === branchId);
                    const sold = ov?.isSoldOut;
                    return (
                      <div key={item.id} className="rounded-2xl border border-[#e8e4de] bg-white p-4 shadow-sm flex items-center justify-between gap-3">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-[var(--muted)]">{formatIdr(item.basePrice)}</div>
                        </div>
                        <div className="flex gap-1">
                          {modForm.groupId && (
                            <button className="inline-flex items-center justify-center rounded-xl border border-[#d4d0c8] px-4 py-2.5 text-sm font-semibold text-sm" onClick={() => linkModifier(item.id)}>
                              Link mod
                            </button>
                          )}
                          <button
                            className={`btn text-sm ${sold ? 'btn-accent' : 'btn-ghost'}`}
                            onClick={() => toggleSoldOut(item.id, !sold)}
                          >
                            {sold ? 'Habis' : 'Tersedia'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
