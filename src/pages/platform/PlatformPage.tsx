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
    await api(`/platform/merchants/${id}/status`, { method: 'PATCH', body: { status } });
    setMerchants(await api<any[]>('/platform/merchants'));
  }

  async function runRecon() {
    await api('/platform/reconciliation/run', { method: 'POST' });
    setRecon(await api<any[]>('/platform/reconciliation'));
  }

  async function impersonate(id: string) {
    const res = await api<any>(`/platform/impersonate/${id}`, { method: 'POST' });
    const orgId = res?.organizationId || id;
    try {
      const branches = await api<any[]>(`/branches?organizationId=${orgId}`);
      setTenant(orgId, branches[0]?.id || '');
    } catch {
      setTenant(orgId, '');
    }
    nav('/app');
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
            { id: 'merchants', label: 'merchants' },
            { id: 'payments', label: 'payments' },
            { id: 'metrics', label: 'metrics' },
            { id: 'audit', label: 'audit' },
            { id: 'recon', label: 'recon' },
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
                    {m.slug} · {m.status}
                  </div>
                </div>
                <div className="flex gap-2">
                  <AceButton variant="accent" className="!text-sm" onClick={() => setStatus(m.id, 'APPROVED')}>
                    Approve
                  </AceButton>
                  <AceButton variant="ghost" className="!text-sm" onClick={() => setStatus(m.id, 'SUSPENDED')}>
                    Suspend
                  </AceButton>
                  <AceButton variant="primary" className="!text-sm" onClick={() => impersonate(m.id)}>
                    Impersonate
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
              <AceCard key={p.id} className="flex justify-between text-sm">
                <span>
                  {p.id.slice(0, 8)}… · {p.status} · {p.method || '—'}
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
            <AceButton variant="primary" className="mb-4" onClick={runRecon}>
              Run recon (7 hari)
            </AceButton>
            <div className="space-y-2">
              {recon.map((r) => (
                <AceCard key={r.id} className="flex justify-between text-sm">
                  <span>
                    {r.status} · {r.providerTxId || r.paymentId?.slice?.(0, 8) || r.id.slice(0, 8)}
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
