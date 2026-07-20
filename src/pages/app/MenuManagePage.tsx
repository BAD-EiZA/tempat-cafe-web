import { useEffect, useState } from 'react';
import { AceButton } from '@/components/ace/AceButton';
import { AceInput, AceSelect } from '@/components/ace/AceInput';
import { EmptyState } from '@/components/ace/PageShell';
import { PageHeader } from '@/components/ace/PageHeader';
import { useApi } from '../../hooks/useApi';
import { useAppStore } from '../../lib/store';
import { formatIdr } from '../../lib/api';
import { Loader } from '@/components/ui/loader';

export function MenuManagePage() {
  const api = useApi();
  const branchId = useAppStore((s) => s.branchId);
  const [menus, setMenus] = useState<any[]>([]);
  const [brandId, setBrandId] = useState('');
  const [itemForm, setItemForm] = useState({ categoryId: '', name: '', basePrice: 0, description: '' });
  const [catForm, setCatForm] = useState({ menuId: '', name: '' });
  const [modForm, setModForm] = useState({ name: '', optionName: '', priceDelta: 0, groupId: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState('');

  async function load() {
    if (!branchId) {
      setMenus([]);
      return;
    }
    setLoading(true);
    setErr('');
    try {
      const list = await api<any[]>(`/menus?branchId=${branchId}`);
      setMenus(list);
      if (list[0]?.brandId) setBrandId(list[0].brandId);
    } catch (e: any) {
      setErr(e.message || 'Gagal memuat menu.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [api, branchId]);

  async function createMenu() {
    if ((!brandId && !branchId) || busy) return;
    setErr('');
    setBusy('menu');
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
      setErr(e.message || 'Gagal membuat menu.');
    } finally {
      setBusy('');
    }
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy('category');
    setErr('');
    try {
      await api('/menu-categories', { method: 'POST', body: catForm });
      setCatForm({ ...catForm, name: '' });
      await load();
    } catch (e: any) {
      setErr(e.message || 'Gagal menambah kategori.');
    } finally {
      setBusy('');
    }
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy('item');
    setErr('');
    const slug = itemForm.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    try {
      await api('/menu-items', {
        method: 'POST',
        body: { ...itemForm, description: itemForm.description || undefined, slug, basePrice: Number(itemForm.basePrice) },
      });
      setItemForm({ categoryId: itemForm.categoryId, name: '', basePrice: 0, description: '' });
      await load();
    } catch (e: any) {
      setErr(e.message || 'Gagal menambah item.');
    } finally {
      setBusy('');
    }
  }

  async function addModifierGroup(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy('modifier');
    setErr('');
    try {
      const g = await api<any>('/modifier-groups', {
        method: 'POST',
        body: { name: modForm.name, required: false, maxSelect: 3 },
      });
      if (modForm.optionName) await api('/modifiers', { method: 'POST', body: { modifierGroupId: g.id, name: modForm.optionName, priceDelta: Number(modForm.priceDelta) || 0 } });
      setModForm({ name: '', optionName: '', priceDelta: 0, groupId: g.id });
      await load();
    } catch (e: any) {
      setErr(e.message || 'Gagal membuat modifier.');
    } finally {
      setBusy('');
    }
  }

  async function linkModifier(itemId: string) {
    if (!modForm.groupId || busy) return;
    setBusy(itemId);
    setErr('');
    try {
      await api(`/menu-items/${itemId}/modifier-groups`, { method: 'POST', body: { modifierGroupId: modForm.groupId } });
      await load();
    } catch (e: any) {
      setErr(e.message || 'Gagal menghubungkan modifier.');
    } finally {
      setBusy('');
    }
  }

  async function toggleSoldOut(itemId: string, soldOut: boolean) {
    if (!branchId || busy) return;
    setBusy(itemId);
    setErr('');
    try {
      await api(`/menu-items/${itemId}/sold-out`, { method: 'POST', body: { branchId, isSoldOut: soldOut } });
      await load();
    } catch (e: any) {
      setErr(e.message || 'Gagal mengubah status item.');
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="animate-float-up space-y-6">
      <PageHeader
        title="Menu"
        description="Kategori, item, dan modifier cabang"
        actions={
          <AceButton variant="primary" onClick={createMenu} disabled={!branchId || !!busy}>
            {busy === 'menu' ? 'Membuat…' : 'Buat menu'}
          </AceButton>
        }
      />
      {err && (
        <p role="alert" className="text-sm text-[var(--danger)]">
          {err}
        </p>
      )}
      {!branchId && (
        <EmptyState title="Pilih tenant dulu" description="Gunakan switcher organisasi & cabang di atas." />
      )}
      {loading && <Loader label="Memuat menu…" />}

      {branchId && (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <form className="space-y-3 rounded-2xl border border-cafe-border bg-cafe-card p-4 shadow-sm" onSubmit={addCategory}>
              <h2 className="text-sm font-bold text-cafe-ink">Kategori baru</h2>
              <AceSelect
                label="Menu"
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
              </AceSelect>
              <AceInput
                label="Nama kategori"
                value={catForm.name}
                onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                required
              />
              <AceButton type="submit" variant="accent" disabled={!!busy}>
                {busy === 'category' ? 'Menambah…' : 'Tambah kategori'}
              </AceButton>
            </form>

            <form className="space-y-3 rounded-2xl border border-cafe-border bg-cafe-card p-4 shadow-sm" onSubmit={addItem}>
              <h2 className="text-sm font-bold text-cafe-ink">Item baru</h2>
              <AceSelect
                label="Kategori"
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
              </AceSelect>
              <AceInput
                label="Nama item"
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                required
              />
              <AceInput
                label="Harga"
                type="number"
                value={itemForm.basePrice || ''}
                onChange={(e) => setItemForm({ ...itemForm, basePrice: Number(e.target.value) })}
                required
              />
              <AceInput
                label="Deskripsi"
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
              />
              <AceButton type="submit" variant="accent" disabled={!!busy}>
                {busy === 'item' ? 'Menambah…' : 'Tambah item'}
              </AceButton>
            </form>
          </div>

          <form className="max-w-xl space-y-3 rounded-2xl border border-cafe-border bg-cafe-card p-4 shadow-sm" onSubmit={addModifierGroup}>
            <h2 className="text-sm font-bold text-cafe-ink">Modifier group</h2>
            <AceInput
              label="Nama group"
              placeholder="mis. Ukuran"
              value={modForm.name}
              onChange={(e) => setModForm({ ...modForm, name: e.target.value })}
              required
            />
            <AceInput
              label="Opsi pertama"
              placeholder="mis. Large"
              value={modForm.optionName}
              onChange={(e) => setModForm({ ...modForm, optionName: e.target.value })}
            />
            <AceInput
              label="Selisih harga"
              type="number"
              value={modForm.priceDelta || ''}
              onChange={(e) => setModForm({ ...modForm, priceDelta: Number(e.target.value) })}
            />
            <AceButton type="submit" variant="ghost" disabled={!!busy}>
              {busy === 'modifier' ? 'Membuat…' : 'Buat group + opsi'}
            </AceButton>
            {modForm.groupId && (
              <p className="text-xs text-cafe-muted">Group ID: {modForm.groupId} - klik Link di item</p>
            )}
          </form>

          <div className="space-y-6">
            {!loading &&
              menus.map((m) => (
                <div key={m.id}>
                  <h2 className="text-lg font-semibold text-cafe-ink">{m.name}</h2>
                  {(m.categories || []).map((c: any) => (
                    <div key={c.id} className="mt-3">
                      <h3 className="text-sm font-bold text-cafe-muted">{c.name}</h3>
                      <ul className="mt-2 divide-y divide-cafe-border overflow-hidden rounded-2xl border border-cafe-border bg-cafe-card">
                        {(c.items || []).map((item: any) => {
                          const ov = item.branchItems?.find((b: any) => b.branchId === branchId);
                          const sold = ov?.isSoldOut;
                          return (
                            <li
                              key={item.id}
                              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                            >
                              <div>
                                <div className="font-medium text-cafe-ink">{item.name}</div>
                                <div className="text-sm text-cafe-muted">{formatIdr(item.basePrice)}</div>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {modForm.groupId && (
                                  <AceButton
                                    variant="ghost"
                                    className="!text-sm"
                                    disabled={!!busy}
                                    onClick={() => linkModifier(item.id)}
                                  >
                                    {busy === item.id ? 'Menyimpan…' : 'Link mod'}
                                  </AceButton>
                                )}
                                <AceButton
                                  variant={sold ? 'accent' : 'ghost'}
                                  className="!text-sm"
                                  disabled={!!busy}
                                  onClick={() => toggleSoldOut(item.id, !sold)}
                                >
                                  {sold ? 'Habis' : 'Tersedia'}
                                </AceButton>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              ))}
            {!loading && !err && branchId && !menus.length && (
              <EmptyState
                title="Belum ada menu"
                description="Buat menu utama untuk mulai menambahkan kategori dan item."
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
