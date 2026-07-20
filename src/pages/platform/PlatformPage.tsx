import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/lib/auth';
import { formatIdr } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { PageShell, StatCard, EmptyState, AceBadge } from '@/components/ace/PageShell';
import { AceCard } from '@/components/ace/AceCard';
import { AceButton } from '@/components/ace/AceButton';
import { AceTabs } from '@/components/ui/tabs';
import { FloatingNavbar } from '@/components/ui/floating-navbar';
import { Loader } from '@/components/ui/loader';
import { statusLabel } from '@/components/ace/OpsFeedback';
import { ShieldCheck } from '@phosphor-icons/react';

function merchantTone(status?: string): 'default' | 'ok' | 'warn' | 'danger' | 'info' {
  if (status === 'APPROVED') return 'ok';
  if (status === 'SUSPENDED') return 'danger';
  if (status === 'PENDING' || status === 'SUBMITTED') return 'warn';
  return 'default';
}

function payTone(status?: string): 'default' | 'ok' | 'warn' | 'danger' | 'info' {
  if (status === 'PAID') return 'ok';
  if (status === 'FAILED' || status === 'CANCELLED') return 'danger';
  if (status === 'PENDING' || status === 'AWAITING_PAYMENT') return 'warn';
  return 'info';
}

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
    } finally {
      setPendingAction('');
    }
  }

  if (!isAuthenticated) {
    return (
      <div data-theme-lock="light">
        <PageShell beams={false} maxWidth="max-w-md">
          <AceCard className="mt-20 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cafe-forest text-cafe-card">
              <ShieldCheck weight="duotone" className="h-6 w-6" />
            </div>
            <h1 className="mt-4 text-xl font-bold text-cafe-ink">Platform Admin</h1>
            <p className="mt-2 text-sm text-cafe-muted">Login untuk kelola merchant, pembayaran, dan audit.</p>
            <AceButton variant="primary" className="mt-6 w-full" onClick={() => devLogin('admin')}>
              Dev admin login
            </AceButton>
            <AceButton variant="ghost" className="mt-2 w-full" onClick={login}>
              Login
            </AceButton>
            <AceButton as={Link} to="/" variant="ghost" className="mt-4 w-full !text-xs">
              Beranda
            </AceButton>
          </AceCard>
        </PageShell>
      </div>
    );
  }

  return (
    <div data-theme-lock="light">
      <PageShell beams={false} maxWidth="max-w-5xl" className="pb-16">
        <FloatingNavbar
          brand="Platform"
          navItems={[
            { name: 'Beranda', link: '/' },
            { name: 'Merchant', link: '/app' },
          ]}
          right={
            <AceButton variant="ghost" className="!py-1.5 !text-xs" onClick={() => devLogin('admin')}>
              Switch admin
            </AceButton>
          }
        />
        <div className="pt-20">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-cafe-ink">Platform Admin</h1>
              <p className="mt-1 text-sm text-cafe-muted">Merchant, pembayaran, metrik, audit, rekonsiliasi</p>
            </div>
          </div>

          <AceTabs
            className="mt-5"
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
            <AceCard className="mt-4 !border-red-200 !bg-red-50" role="alert">
              <p className="text-sm text-[var(--danger)]">{err}</p>
              <p className="mt-1 text-xs text-cafe-muted">Coba Switch admin (seed: dev-platform-admin)</p>
            </AceCard>
          )}
          {loading && <Loader className="mt-8" label="Memuat…" />}

          {tab === 'merchants' && !loading && (
            <ul className="mt-6 divide-y divide-cafe-border overflow-hidden rounded-2xl border border-cafe-border bg-cafe-card">
              {merchants.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-cafe-ink">{m.name}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-cafe-muted">
                      <span className="font-mono text-xs">{m.slug}</span>
                      <AceBadge tone={merchantTone(m.status)}>{statusLabel(m.status)}</AceBadge>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {m.status !== 'APPROVED' && (
                      <AceButton
                        variant="accent"
                        className="!text-sm"
                        disabled={!!pendingAction}
                        onClick={() => setStatus(m.id, 'APPROVED')}
                      >
                        {pendingAction === `status:${m.id}` ? '…' : 'Setujui'}
                      </AceButton>
                    )}
                    {m.status !== 'SUSPENDED' && (
                      <AceButton
                        variant="ghost"
                        className="!text-sm"
                        disabled={!!pendingAction}
                        onClick={() => setStatus(m.id, 'SUSPENDED')}
                      >
                        Tangguhkan
                      </AceButton>
                    )}
                    <AceButton
                      variant="primary"
                      className="!text-sm"
                      disabled={!!pendingAction}
                      onClick={() => impersonate(m.id)}
                    >
                      {pendingAction === `impersonate:${m.id}` ? '…' : 'Masuk sebagai'}
                    </AceButton>
                  </div>
                </li>
              ))}
              {!merchants.length && (
                <li className="p-6">
                  <EmptyState title="Belum ada merchant" />
                </li>
              )}
            </ul>
          )}

          {tab === 'payments' && !loading && (
            <ul className="mt-6 divide-y divide-cafe-border overflow-hidden rounded-2xl border border-cafe-border bg-cafe-card">
              {payments.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-cafe-muted">{p.id.slice(0, 8)}…</span>
                      <AceBadge tone={payTone(p.status)}>{statusLabel(p.status)}</AceBadge>
                      <span className="text-cafe-muted">{p.method || '-'}</span>
                    </div>
                  </div>
                  <span className="font-semibold tabular-nums text-cafe-ink">
                    {formatIdr(p.amount ?? 0)}
                  </span>
                </li>
              ))}
              {!payments.length && (
                <li className="p-6">
                  <EmptyState title="Belum ada payment" />
                </li>
              )}
            </ul>
          )}

          {tab === 'metrics' && !loading && (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {metrics ? (
                <>
                  <StatCard label="Volume" value={formatIdr(metrics.paymentVolume || 0)} />
                  <StatCard label="Lunas" value={metrics.paidCount ?? 0} />
                  <StatCard label="Total bayar" value={metrics.totalPayments ?? 0} />
                  <StatCard
                    label="Success rate"
                    value={`${Math.round((metrics.successRate || 0) * 100)}%`}
                  />
                </>
              ) : (
                <EmptyState title="Metrik tidak tersedia" />
              )}
            </div>
          )}

          {tab === 'audit' && !loading && (
            <ul className="mt-6 divide-y divide-cafe-border overflow-hidden rounded-2xl border border-cafe-border bg-cafe-card">
              {audit.map((a) => (
                <li key={a.id} className="px-4 py-3 text-sm">
                  <div className="font-semibold text-cafe-ink">{a.action}</div>
                  <div className="mt-0.5 text-cafe-muted">
                    <span className="font-mono text-xs">{a.actorId}</span>
                    {' · '}
                    {a.createdAt
                      ? new Date(a.createdAt).toLocaleString('id-ID')
                      : a.createdAt}
                  </div>
                </li>
              ))}
              {!audit.length && (
                <li className="p-6">
                  <EmptyState title="Belum ada log audit" />
                </li>
              )}
            </ul>
          )}

          {tab === 'recon' && !loading && (
            <div className="mt-6 space-y-4">
              <AceButton variant="primary" disabled={!!pendingAction} onClick={runRecon}>
                {pendingAction === 'recon' ? 'Menjalankan…' : 'Jalankan rekonsiliasi (7 hari)'}
              </AceButton>
              <ul className="divide-y divide-cafe-border overflow-hidden rounded-2xl border border-cafe-border bg-cafe-card">
                {recon.map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <AceBadge tone={payTone(r.status)}>{statusLabel(r.status)}</AceBadge>
                      <span className="font-mono text-xs text-cafe-muted">
                        {r.providerTxId || r.paymentId?.slice?.(0, 8) || r.id.slice(0, 8)}
                      </span>
                    </div>
                    <span className="font-semibold tabular-nums">
                      {formatIdr(r.internalAmount ?? r.amount ?? 0)}
                    </span>
                  </li>
                ))}
                {!recon.length && (
                  <li className="p-6">
                    <EmptyState title="Belum ada hasil rekonsiliasi" />
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </PageShell>
    </div>
  );
}
