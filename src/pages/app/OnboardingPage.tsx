import { useState } from 'react';
import { AceCard } from '@/components/ace/AceCard';
import { AceButton } from '@/components/ace/AceButton';
import { AceBadge, EmptyState, StatCard } from '@/components/ace/PageShell';
import { useApi } from '../../hooks/useApi';
import { useAppStore } from '../../lib/store';

export function OnboardingPage() {
  const api = useApi();
  const setTenant = useAppStore((s) => s.setTenant);
  const [form, setForm] = useState({
    name: '',
    legalName: '',
    email: '',
    phone: '',
    brandName: '',
    branchName: 'Cabang Utama',
    address: '',
    taxId: '',
    bankName: '',
    accountName: '',
    accountNumber: '',
  });
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState('');
  const [status, setStatus] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    try {
      const org = await api<any>('/organizations', {
        method: 'POST',
        body: {
          name: form.name,
          legalName: form.legalName,
          email: form.email,
          phone: form.phone,
          address: form.address || undefined,
          taxId: form.taxId || undefined,
          brandName: form.brandName || form.name,
          branchName: form.branchName,
        },
      });
      if (form.bankName) {
        await api(`/organizations/${org.organization.id}/payout-accounts`, {
          method: 'POST',
          body: {
            bankName: form.bankName,
            accountName: form.accountName,
            accountNumber: form.accountNumber,
          },
        });
      }
      const submitted = await api<any>(`/organizations/${org.organization.id}/submit`, {
        method: 'POST',
      });
      setStatus(submitted.status || 'SUBMITTED');
      setTenant(org.organization.id, org.branch.id);
      setResult(org);
    } catch (e: any) {
      setErr(e.message || 'Gagal');
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold">Onboarding Merchant</h1>
      <form className="mt-6 space-y-3" onSubmit={submit}>
        {[
          ['name', 'Nama usaha'],
          ['legalName', 'Nama legal'],
          ['email', 'Email'],
          ['phone', 'Telepon'],
          ['address', 'Alamat usaha'],
          ['taxId', 'NPWP / NIB'],
          ['brandName', 'Nama merek'],
          ['branchName', 'Cabang pertama'],
          ['bankName', 'Bank payout'],
          ['accountName', 'Nama rekening'],
          ['accountNumber', 'No. rekening'],
        ].map(([key, label]) => (
          <div key={key}>
            <label className="label">{label}</label>
            <input
              className="input"
              value={(form as any)[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              required={key === 'name'}
            />
          </div>
        ))}
        {err && <p className="text-sm text-[var(--danger)]">{err}</p>}
        <button className="inline-flex items-center justify-center rounded-xl bg-[#1a1a1a] px-4 py-2.5 text-sm font-semibold text-white" type="submit">
          Buat merchant
        </button>
      </form>
      {result && (
        <div className="rounded-2xl border border-[#e8e4de] bg-white p-4 shadow-sm mt-6 text-sm">
          <p className="font-semibold">Berhasil — status {status || 'SUBMITTED'}</p>
          <p>Org: {result.organization.name}</p>
          <p>Brand: {result.brand.name}</p>
          <p>Branch ID: {result.branch.id}</p>
          <p className="mt-2 text-[var(--muted)]">
            Pembayaran production hanya setelah platform APPROVED. Seed demo-cafe sudah APPROVED.
          </p>
        </div>
      )}
    </div>
  );
}
