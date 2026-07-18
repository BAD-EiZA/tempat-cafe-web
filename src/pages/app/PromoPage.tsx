import { useEffect, useState } from 'react';
import { AceCard } from '@/components/ace/AceCard';
import { AceButton } from '@/components/ace/AceButton';
import { AceBadge, EmptyState, StatCard } from '@/components/ace/PageShell';
import { useApi } from '../../hooks/useApi';
import { useAppStore } from '../../lib/store';
import { formatIdr } from '../../lib/api';

export function PromoPage() {
  const api = useApi();
  const organizationId = useAppStore((s) => s.organizationId);
  const [promos, setPromos] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [promoForm, setPromoForm] = useState({ name: '', discountType: 'PERCENT', value: 10 });
  const [voucherForm, setVoucherForm] = useState({
    code: '',
    discountType: 'FIXED',
    value: 5000,
    maxRedemptions: 100,
  });

  async function load() {
    if (!organizationId) return;
    const [p, v] = await Promise.all([
      api<any[]>(`/promotions?organizationId=${organizationId}`),
      api<any[]>(`/vouchers?organizationId=${organizationId}`),
    ]);
    setPromos(p);
    setVouchers(v);
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, [api, organizationId]);

  async function addPromo(e: React.FormEvent) {
    e.preventDefault();
    await api('/promotions', {
      method: 'POST',
      body: {
        organizationId,
        name: promoForm.name,
        type: promoForm.discountType === 'PERCENT' ? 'PERCENT' : 'FIXED',
        rules: { value: Number(promoForm.value), discountType: promoForm.discountType },
        isActive: true,
      },
    });
    setPromoForm({ ...promoForm, name: '' });
    await load();
  }

  async function addVoucher(e: React.FormEvent) {
    e.preventDefault();
    await api('/vouchers', {
      method: 'POST',
      body: {
        organizationId,
        name: voucherForm.code,
        code: voucherForm.code,
        type: voucherForm.discountType === 'PERCENT' ? 'PERCENT' : 'FIXED',
        value: Number(voucherForm.value),
        percentBps:
          voucherForm.discountType === 'PERCENT' ? Number(voucherForm.value) * 100 : undefined,
        totalLimit: Number(voucherForm.maxRedemptions),
      },
    });
    setVoucherForm({ ...voucherForm, code: '' });
    await load();
  }

  return (
    <div className="animate-float-up" data-ace="1">
      <h1 className="text-2xl font-bold">Promo & Voucher</h1>
      {!organizationId && <p className="mt-4 text-[var(--muted)]">Pilih tenant di dashboard dulu.</p>}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <form className="rounded-2xl border border-[#e8e4de] bg-white p-4 shadow-sm space-y-2" onSubmit={addPromo}>
          <h2 className="font-semibold">Promo</h2>
          <input
            className="input"
            placeholder="Nama"
            value={promoForm.name}
            onChange={(e) => setPromoForm({ ...promoForm, name: e.target.value })}
            required
          />
          <select
            className="input"
            value={promoForm.discountType}
            onChange={(e) => setPromoForm({ ...promoForm, discountType: e.target.value })}
          >
            <option value="PERCENT">Persen</option>
            <option value="FIXED">Nominal</option>
          </select>
          <input
            className="input"
            type="number"
            value={promoForm.value}
            onChange={(e) => setPromoForm({ ...promoForm, value: Number(e.target.value) })}
          />
          <button className="inline-flex items-center justify-center rounded-xl bg-[#c4a574] px-4 py-2.5 text-sm font-semibold text-[#1a1a1a]" type="submit" disabled={!organizationId}>
            Tambah promo
          </button>
          <ul className="text-sm">
            {promos.map((p) => (
              <li key={p.id}>
                {p.name} — {p.type} {p.rules?.value != null ? String(p.rules.value) : ''}
              </li>
            ))}
          </ul>
        </form>

        <form className="rounded-2xl border border-[#e8e4de] bg-white p-4 shadow-sm space-y-2" onSubmit={addVoucher}>
          <h2 className="font-semibold">Voucher</h2>
          <input
            className="input"
            placeholder="Kode"
            value={voucherForm.code}
            onChange={(e) => setVoucherForm({ ...voucherForm, code: e.target.value.toUpperCase() })}
            required
          />
          <select
            className="input"
            value={voucherForm.discountType}
            onChange={(e) => setVoucherForm({ ...voucherForm, discountType: e.target.value })}
          >
            <option value="FIXED">Nominal</option>
            <option value="PERCENT">Persen</option>
          </select>
          <input
            className="input"
            type="number"
            value={voucherForm.value}
            onChange={(e) => setVoucherForm({ ...voucherForm, value: Number(e.target.value) })}
          />
          <input
            className="input"
            type="number"
            placeholder="Max redeem"
            value={voucherForm.maxRedemptions}
            onChange={(e) =>
              setVoucherForm({ ...voucherForm, maxRedemptions: Number(e.target.value) })
            }
          />
          <button className="inline-flex items-center justify-center rounded-xl bg-[#c4a574] px-4 py-2.5 text-sm font-semibold text-[#1a1a1a]" type="submit" disabled={!organizationId}>
            Tambah voucher
          </button>
          <ul className="text-sm">
            {vouchers.map((v) => (
              <li key={v.id}>
                <code>{v.codes?.[0]?.code || v.name}</code> — {v.type}{' '}
                {v.value != null ? formatIdr(v.value) : ''}
              </li>
            ))}
          </ul>
        </form>
      </div>
    </div>
  );
}
