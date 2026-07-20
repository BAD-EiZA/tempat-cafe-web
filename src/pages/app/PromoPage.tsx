import { useEffect, useState } from 'react';
import { AceButton } from '@/components/ace/AceButton';
import { AceInput, AceSelect } from '@/components/ace/AceInput';
import { EmptyState } from '@/components/ace/PageShell';
import { PageHeader } from '@/components/ace/PageHeader';
import { useApi } from '../../hooks/useApi';
import { useAppStore } from '../../lib/store';
import { formatIdr } from '../../lib/api';
import { Loader } from '@/components/ui/loader';

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
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    if (!organizationId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [p, v] = await Promise.all([
        api<any[]>(`/promotions?organizationId=${organizationId}`),
        api<any[]>(`/vouchers?organizationId=${organizationId}`),
      ]);
      setPromos(p);
      setVouchers(v);
    } catch (e: any) {
      setError(e.message || 'Gagal memuat promo dan voucher.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, [api, organizationId]);

  async function addPromo(e: React.FormEvent) {
    e.preventDefault();
    if (
      !window.confirm(
        `Buat promo ${promoForm.name} senilai ${promoForm.value}${promoForm.discountType === 'PERCENT' ? '%' : ' IDR'}?`,
      )
    )
      return;
    setBusy(true);
    setError('');
    try {
      await api('/promotions', {
        method: 'POST',
        body: {
          organizationId,
          name: promoForm.name,
          type: promoForm.discountType === 'PERCENT' ? 'PERCENT' : 'FIXED',
          rules:
            promoForm.discountType === 'PERCENT'
              ? { percentBps: Number(promoForm.value) * 100 }
              : { value: Number(promoForm.value) },
          isActive: true,
        },
      });
      setPromoForm({ ...promoForm, name: '' });
      await load();
    } catch (e: any) {
      setError(e.message || 'Gagal membuat promo.');
    } finally {
      setBusy(false);
    }
  }

  async function addVoucher(e: React.FormEvent) {
    e.preventDefault();
    if (
      !window.confirm(
        `Buat voucher ${voucherForm.code} senilai ${voucherForm.value}${voucherForm.discountType === 'PERCENT' ? '%' : ' IDR'}?`,
      )
    )
      return;
    setBusy(true);
    setError('');
    try {
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
    } catch (e: any) {
      setError(e.message || 'Gagal membuat voucher.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="animate-float-up space-y-6">
      <PageHeader title="Promo & voucher" description="Diskon otomatis dan kode voucher" />
      {!organizationId && (
        <EmptyState title="Pilih tenant dulu" description="Gunakan switcher organisasi di atas." />
      )}
      {loading && <Loader label="Memuat promo dan voucher…" />}
      {error && (
        <p role="alert" className="text-sm text-[var(--danger)]">
          {error}
        </p>
      )}

      {organizationId && (
        <div className="grid gap-4 lg:grid-cols-2">
          <form className="space-y-3 rounded-2xl border border-cafe-border bg-cafe-card p-4 shadow-sm" onSubmit={addPromo}>
            <h2 className="text-sm font-bold text-cafe-ink">Promo</h2>
            <AceInput
              label="Nama"
              value={promoForm.name}
              onChange={(e) => setPromoForm({ ...promoForm, name: e.target.value })}
              required
            />
            <AceSelect
              label="Jenis diskon"
              value={promoForm.discountType}
              onChange={(e) => setPromoForm({ ...promoForm, discountType: e.target.value })}
            >
              <option value="PERCENT">Persen</option>
              <option value="FIXED">Nominal</option>
            </AceSelect>
            <AceInput
              label="Nilai"
              type="number"
              min={1}
              max={promoForm.discountType === 'PERCENT' ? 100 : undefined}
              value={promoForm.value}
              onChange={(e) => setPromoForm({ ...promoForm, value: Number(e.target.value) })}
            />
            <AceButton type="submit" variant="accent" disabled={!organizationId || busy}>
              {busy ? 'Menyimpan…' : 'Tambah promo'}
            </AceButton>
            <ul className="divide-y divide-cafe-border text-sm">
              {promos.map((p) => (
                <li key={p.id} className="flex justify-between gap-2 py-2">
                  <span className="font-medium text-cafe-ink">{p.name}</span>
                  <span className="text-cafe-muted">
                    {p.type === 'PERCENT'
                      ? `${Number(p.rules?.percentBps || 0) / 100}%`
                      : formatIdr(Number(p.rules?.value || 0))}
                  </span>
                </li>
              ))}
            </ul>
            {!loading && !promos.length && <EmptyState title="Belum ada promo" />}
          </form>

          <form className="space-y-3 rounded-2xl border border-cafe-border bg-cafe-card p-4 shadow-sm" onSubmit={addVoucher}>
            <h2 className="text-sm font-bold text-cafe-ink">Voucher</h2>
            <AceInput
              label="Kode"
              value={voucherForm.code}
              onChange={(e) => setVoucherForm({ ...voucherForm, code: e.target.value.toUpperCase() })}
              required
            />
            <AceSelect
              label="Jenis diskon"
              value={voucherForm.discountType}
              onChange={(e) => setVoucherForm({ ...voucherForm, discountType: e.target.value })}
            >
              <option value="FIXED">Nominal</option>
              <option value="PERCENT">Persen</option>
            </AceSelect>
            <AceInput
              label="Nilai"
              type="number"
              min={1}
              value={voucherForm.value}
              onChange={(e) => setVoucherForm({ ...voucherForm, value: Number(e.target.value) })}
            />
            <AceInput
              label="Max redeem"
              type="number"
              min={1}
              value={voucherForm.maxRedemptions}
              onChange={(e) =>
                setVoucherForm({ ...voucherForm, maxRedemptions: Number(e.target.value) })
              }
            />
            <AceButton type="submit" variant="accent" disabled={!organizationId || busy}>
              {busy ? 'Menyimpan…' : 'Tambah voucher'}
            </AceButton>
            <ul className="divide-y divide-cafe-border text-sm">
              {vouchers.map((v) => (
                <li key={v.id} className="flex justify-between gap-2 py-2">
                  <code className="font-medium text-cafe-ink">{v.codes?.[0]?.code || v.name}</code>
                  <span className="text-cafe-muted">
                    {v.type} {v.value != null ? formatIdr(v.value) : ''}
                  </span>
                </li>
              ))}
            </ul>
            {!loading && !vouchers.length && <EmptyState title="Belum ada voucher" />}
          </form>
        </div>
      )}
    </div>
  );
}
