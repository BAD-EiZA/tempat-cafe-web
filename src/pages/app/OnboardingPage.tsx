import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle } from '@phosphor-icons/react';
import { AceCard } from '@/components/ace/AceCard';
import { AceButton } from '@/components/ace/AceButton';
import { AceInput } from '@/components/ace/AceInput';
import { AceBadge } from '@/components/ace/PageShell';
import { PageHeader } from '@/components/ace/PageHeader';
import { useApi } from '../../hooks/useApi';
import { useAppStore } from '../../lib/store';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 0, label: 'Usaha' },
  { id: 1, label: 'Merek' },
  { id: 2, label: 'Payout' },
  { id: 3, label: 'Kirim' },
];

type FormState = {
  name: string;
  legalName: string;
  email: string;
  phone: string;
  brandName: string;
  branchName: string;
  address: string;
  taxId: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
};

export function OnboardingPage() {
  const api = useApi();
  const setTenant = useAppStore((s) => s.setTenant);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>({
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
  const [busy, setBusy] = useState(false);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function canNext() {
    if (step === 0) {
      return Boolean(form.name && form.legalName && form.email && form.phone);
    }
    if (step === 1) {
      return Boolean(form.branchName);
    }
    return true;
  }

  async function submit() {
    if (busy) return;
    setErr('');
    setBusy(true);
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
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <div className="mx-auto max-w-lg">
        <PageHeader title="Onboarding" description="Merchant berhasil dibuat" />
        <AceCard className="mt-6">
          <div className="flex items-start gap-3">
            <CheckCircle weight="fill" className="h-8 w-8 shrink-0 text-[var(--ok)]" />
            <div>
              <p className="font-semibold text-cafe-ink">Berhasil</p>
              <div className="mt-1">
                <AceBadge tone="ok">{status || 'SUBMITTED'}</AceBadge>
              </div>
            </div>
          </div>
          <dl className="mt-4 space-y-2 border-t border-cafe-border pt-4 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-cafe-muted">Organisasi</dt>
              <dd className="font-medium text-cafe-ink">{result.organization.name}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-cafe-muted">Merek</dt>
              <dd className="font-medium text-cafe-ink">{result.brand.name}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-cafe-muted">Branch ID</dt>
              <dd className="truncate font-mono text-xs text-cafe-ink">{result.branch.id}</dd>
            </div>
          </dl>
          <p className="mt-4 text-sm text-cafe-muted">
            Pembayaran production hanya setelah platform APPROVED. Seed demo-cafe sudah APPROVED.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <AceButton as={Link} to="/app" variant="primary">
              Dashboard
            </AceButton>
            <AceButton as={Link} to="/app/menu" variant="ghost">
              Isi menu
            </AceButton>
            <AceButton as={Link} to="/app/tables" variant="ghost">
              Setup meja
            </AceButton>
          </div>
        </AceCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="Onboarding merchant"
        description="Buat organisasi, merek, dan cabang pertama."
      />

      <ol className="mt-6 flex flex-wrap gap-2" aria-label="Langkah onboarding">
        {STEPS.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => s.id < step && setStep(s.id)}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-semibold transition',
                s.id === step && 'bg-cafe-forest text-cafe-card',
                s.id < step && 'bg-cafe-hover text-cafe-ink',
                s.id > step && 'bg-cafe-card text-cafe-muted ring-1 ring-cafe-border',
              )}
              aria-current={s.id === step ? 'step' : undefined}
            >
              {s.id + 1}. {s.label}
            </button>
          </li>
        ))}
      </ol>

      <AceCard className="mt-6" aria-busy={busy}>
        {step === 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-cafe-ink">Data usaha</h2>
            <AceInput
              label="Nama usaha"
              required
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              disabled={busy}
            />
            <AceInput
              label="Nama legal"
              required
              value={form.legalName}
              onChange={(e) => setField('legalName', e.target.value)}
              disabled={busy}
            />
            <AceInput
              label="Email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              disabled={busy}
              autoComplete="email"
            />
            <AceInput
              label="Telepon"
              type="tel"
              required
              value={form.phone}
              onChange={(e) => setField('phone', e.target.value)}
              disabled={busy}
              autoComplete="tel"
            />
            <AceInput
              label="Alamat usaha"
              value={form.address}
              onChange={(e) => setField('address', e.target.value)}
              disabled={busy}
            />
            <AceInput
              label="NPWP / NIB"
              value={form.taxId}
              onChange={(e) => setField('taxId', e.target.value)}
              disabled={busy}
            />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-cafe-ink">Merek & cabang</h2>
            <AceInput
              label="Nama merek"
              hint="Kosongkan untuk pakai nama usaha"
              value={form.brandName}
              onChange={(e) => setField('brandName', e.target.value)}
              disabled={busy}
            />
            <AceInput
              label="Cabang pertama"
              required
              value={form.branchName}
              onChange={(e) => setField('branchName', e.target.value)}
              disabled={busy}
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-cafe-ink">Rekening payout</h2>
            <p className="text-sm text-cafe-muted">Opsional. Bisa diisi nanti setelah approve.</p>
            <AceInput
              label="Bank payout"
              value={form.bankName}
              onChange={(e) => setField('bankName', e.target.value)}
              disabled={busy}
            />
            <AceInput
              label="Nama rekening"
              value={form.accountName}
              onChange={(e) => setField('accountName', e.target.value)}
              disabled={busy}
            />
            <AceInput
              label="No. rekening"
              value={form.accountNumber}
              onChange={(e) => setField('accountNumber', e.target.value)}
              disabled={busy}
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3 text-sm">
            <h2 className="text-sm font-bold text-cafe-ink">Review</h2>
            <dl className="space-y-2 rounded-xl bg-cafe-bg p-4">
              {[
                ['Usaha', form.name],
                ['Legal', form.legalName],
                ['Email', form.email],
                ['Telepon', form.phone],
                ['Merek', form.brandName || form.name],
                ['Cabang', form.branchName],
                ['Bank', form.bankName || '-'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className="text-cafe-muted">{k}</dt>
                  <dd className="text-right font-medium text-cafe-ink">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="text-cafe-muted">
              Submit mengirim merchant ke status menunggu review platform.
            </p>
          </div>
        )}

        {err && (
          <p role="alert" className="mt-4 text-sm text-[var(--danger)]">
            {err}
          </p>
        )}

        <div className="mt-6 flex flex-wrap justify-between gap-2">
          <AceButton
            type="button"
            variant="ghost"
            disabled={step === 0 || busy}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            Kembali
          </AceButton>
          {step < 3 ? (
            <AceButton
              type="button"
              variant="primary"
              disabled={!canNext() || busy}
              onClick={() => setStep((s) => Math.min(3, s + 1))}
            >
              Lanjut
            </AceButton>
          ) : (
            <AceButton type="button" variant="primary" disabled={busy} onClick={submit}>
              {busy ? 'Membuat merchant…' : 'Buat merchant'}
            </AceButton>
          )}
        </div>
      </AceCard>
    </div>
  );
}
