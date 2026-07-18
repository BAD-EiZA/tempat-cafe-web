import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/lib/auth';
import { formatIdr } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { PageShell, StatCard, EmptyState } from '@/components/ace/PageShell';
import { AceCard } from '@/components/ace/AceCard';
import { AceButton } from '@/components/ace/AceButton';
import { AceTabs } from '@/components/ui/tabs';
import { BentoGrid, BentoGridItem } from '@/components/ui/bento-grid';
import { FloatingNavbar } from '@/components/ui/floating-navbar';
import { Loader } from '@/components/ui/loader';
import { statusLabel } from '@/components/ace/OpsFeedback';

export function PlatformPage() {
  const api = useApi();
  const nav = useNavigate();
  const setTenant = useAppStore((s) => s.setTenant);
  const { devLogin, isAuthenticated, login } = useAuth();
  const [tab, setTab] = useState<'merchants' | 'payments' | 'metrics' | 'audit' | 'recon'>('merchants');
  const [merchants, setMerchants] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [audit, setAudit] = useState<any[]>([]);
  const [recon, setRecon] = useState<any[]>([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;
    setErr('');
    setLoading(true);
    (async () => {
      try {
        if (tab === 'merchants') setMerchants(await api<any[]>('/platform/merchants'));
        if (tab === 'payments') setPayments(await api<any[]>('/platform/payments'));
        if (tab === 'metrics') setMetrics(await api('/platform/metrics'));
        if (tab === 'audit') setAudit(await api<any[]>('/platform/audit-logs'));
        if (tab === 'recon') setRecon(await api<any[]>('/platform/reconciliation'));
      } catch (e: any) {
        setErr(e.message || 'Akses ditolak / error');
      } finally {
        setLoading(false);
      }
    })();
  }, [api, tab, isAuthenticated]);

  async function setStatus(id: string, status: string) {
    if (pendingAction) return;
    const merchant = merchants.find((m) => m.id === id);
    const action = status === 'APPROVED' ? 'menyetujui' : 'menangguhkan';
    if (!window.confirm(`Konfirmasi ${action} merchant ${merchant?.name || id}?`)) return;
    const reason = status === 'SUSPENDED' ? window.prompt('Alasan penangguhan:')?.trim() : undefined;
    if (status === 'SUSPENDED' && !reason) return;
    setPendingAction(`status:${id}`);
    setErr('');
    try {
      await api(`/platform/merchants/${id}/status`, { method: 'PATCH', body: { status, reason } });
      setMerchants(await api<any[]>('/platform/merchants'));
    } catch (e: any) {
      setErr(e.message || `Gagal ${action} merchant`);
    } finally {
      setPendingAction('');
    }
  }

  async function runRecon() {
    if (pendingAction || !window.confirm('Jalankan rekonsiliasi 7 hari terakhir?')) return;
    setPendingAction('recon');
    setErr('');
    try {
      await api('/platform/reconciliation/run', { method: 'POST' });
      setRecon(await api<any[]>('/platform/reconciliation'));
    } catch (e: any) {
      setErr(e.message || 'Rekonsiliasi gagal');
    } finally {
      setPendingAction('');
    }
  }

  async function impersonate(id: string) {
    if (pendingAction) return;
    const merchant = merchants.find((m) => m.id === id);
    if (!window.confirm(`Masuk sebagai merchant ${merchant?.name || id}? Semua aksi akan diaudit.`)) return;
    setPendingAction(`impersonate:${id}`);
    try {
      const res = await api<any>(`/platform/impersonate/${id}`, { method: 'POST' });
      const orgId = res?.organizationId || id;
      try {
        const branches = await api<any[]>(`/branches?organizationId=${orgId}`);
        setTenant(orgId, branches[0]?.id || '');
      } catch {
        setTenant(orgId, '');
      }
      nav('/app');
    } catch (e: any) {
      setErr(e.message || 'Impersonate gagal');
      setPendingAction('');
    }
  }

  if (!isAuthenticated) {
    return (
      <PageShell beams spotlight maxWidth="max-w-md">
        <AceCard className="mt-20 text-center" glare>
          <p className="font-semibold">Login platform admin dulu.</p>
          <AceButton variant="primary" className="mt-4 w-full" onClick={() => devLogin('admin')}>
            Dev admin login
          </AceButton>
          <AceButton variant="ghost" className="mt-2 w-full" onClick={login}>
            Login
          </AceButton>
        </AceCard>
      </PageShell>
    );
  }

  return (
    <PageShell beams maxWidth="max-w-5xl" className="pb-16">
      <FloatingNavbar
        brand="Platform Admin"
        navItems={[
          { name: 'Beranda', link: '/' },
          { name: 'Merchant app', link: '/app' },
        ]}
        right={
          <AceButton variant="ghost" className="!py-1.5 !text-xs" onClick={() => devLogin('admin')}>
            Switch admin
          </AceButton>
        }
      />
      <div className="pt-20">
        <h1 className="text-2xl font-bold">Platform Admin</h1>
        <AceTabs
          className="mt-4"
          tabs={[
            { id: 'merchants', label: 'Merchant' },
            { id: 'payments', label: 'Pembayaran' },
            { id: 'metrics', label: 'Metrik' },
            { id: 'audit', label: 'Audit' },
            { id: 'recon', label: 'Rekonsiliasi' },
          ]}
          value={tab}
          onChange={setTab}
        />
        {err && (
          <AceCard className="mt-4 border-red-200">
            <p className="text-sm text-[var(--danger)]">{err}</p>
            <p className="mt-1 text-xs text-[#6b6b6b]">Coba Switch admin (seed: dev-platform-admin)</p>
          </AceCard>
        )}
        {loading && <Loader className="mt-8" />}

        {tab === 'merchants' && !loading && (
          <div className="mt-6 space-y-2">
            {merchants.map((m) => (
              <AceCard key={m.id} className="flex flex-wrap items-center justify-between gap-3" glare>
                <div>
                  <div className="font-medium">{m.name}</div>
                  <div className="text-sm text-[#6b6b6b]">
                    {m.slug} · {statusLabel(m.status)}
                  </div>
                </div>
                <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-3">
                  <AceButton variant="accent" className="!text-sm" disabled={!!pendingAction} onClick={() => setStatus(m.id, 'APPROVED')}>
                    {pendingAction === `status:${m.id}` ? 'Memproses...' : 'Setujui'}
                  </AceButton>
                  <AceButton variant="ghost" className="!text-sm" disabled={!!pendingAction} onClick={() => setStatus(m.id, 'SUSPENDED')}>
                    {pendingAction === `status:${m.id}` ? 'Memproses...' : 'Tangguhkan'}
                  </AceButton>
                  <AceButton variant="primary" className="!text-sm" disabled={!!pendingAction} onClick={() => impersonate(m.id)}>
                    {pendingAction === `impersonate:${m.id}` ? 'Memproses...' : 'Masuk sebagai'}
                  </AceButton>
                </div>
              </AceCard>
            ))}
            {!merchants.length && <EmptyState title="Belum ada merchant" />}
          </div>
        )}

        {tab === 'payments' && !loading && (
          <div className="mt-6 space-y-2">
            {payments.map((p) => (
              <AceCard key={p.id} className="flex flex-col gap-2 text-sm sm:flex-row sm:justify-between">
                <span>
                  {p.id.slice(0, 8)}... · {statusLabel(p.status)} · {p.method || '-'}
                </span>
                <span className="font-semibold">{formatIdr(p.amount ?? 0)}</span>
              </AceCard>
            ))}
            {!payments.length && <EmptyState title="Belum ada payment" />}
          </div>
        )}

        {tab === 'metrics' && metrics && !loading && (
          <BentoGrid className="mt-6">
            <BentoGridItem title="Volume" description={formatIdr(metrics.paymentVolume || 0)} />
            <BentoGridItem title="Paid" description={String(metrics.paidCount)} />
            <BentoGridItem title="Total pay" description={String(metrics.totalPayments)} />
            <BentoGridItem
              title="Success"
              description={`${Math.round((metrics.successRate || 0) * 100)}%`}
              className="md:col-span-3"
            />
          </BentoGrid>
        )}

        {tab === 'audit' && !loading && (
          <div className="mt-6 space-y-2">
            {audit.map((a) => (
              <AceCard key={a.id} className="text-sm">
                <div className="font-medium">{a.action}</div>
                <div className="text-[#6b6b6b]">
                  {a.actorId} · {a.createdAt}
                </div>
              </AceCard>
            ))}
          </div>
        )}

        {tab === 'recon' && !loading && (
          <div className="mt-6">
            <AceButton variant="primary" className="mb-4" disabled={!!pendingAction} onClick={runRecon}>
               {pendingAction === 'recon' ? 'Menjalankan...' : 'Jalankan rekonsiliasi (7 hari)'}
            </AceButton>
            <div className="space-y-2">
              {recon.map((r) => (
                <AceCard key={r.id} className="flex flex-col gap-2 text-sm sm:flex-row sm:justify-between">
                  <span>
                    {statusLabel(r.status)} · {r.providerTxId || r.paymentId?.slice?.(0, 8) || r.id.slice(0, 8)}
                  </span>
                  <span>{formatIdr(r.internalAmount ?? r.amount ?? 0)}</span>
                </AceCard>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
