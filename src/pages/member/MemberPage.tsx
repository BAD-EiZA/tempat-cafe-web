import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Coins, Receipt, ArrowRight } from '@phosphor-icons/react';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/lib/auth';
import { formatIdr } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { PageShell, EmptyState } from '@/components/ace/PageShell';
import { AceCard } from '@/components/ace/AceCard';
import { AceButton } from '@/components/ace/AceButton';
import { AceBadge } from '@/components/ace/PageShell';
import { FloatingNavbar } from '@/components/ui/floating-navbar';
import { Loader } from '@/components/ui/loader';
import { statusLabel } from '@/components/ace/OpsFeedback';

function lastCafeSlug() {
  try {
    return sessionStorage.getItem('lastCafeSlug') || '';
  } catch {
    return '';
  }
}

function statusTone(status?: string): 'default' | 'ok' | 'warn' | 'info' | 'danger' {
  if (!status) return 'default';
  if (status === 'CANCELLED') return 'danger';
  if (status === 'AWAITING_PAYMENT') return 'warn';
  if (['READY', 'SERVED', 'COMPLETED'].includes(status)) return 'ok';
  if (['PREPARING', 'ACCEPTED', 'NEW'].includes(status)) return 'info';
  return 'default';
}

export function MemberPage() {
  const api = useApi();
  const { isAuthenticated, login, user, devLogin } = useAuth();
  const organizationId = useAppStore((s) => s.organizationId);
  const [profile, setProfile] = useState<any>(null);
  const [err, setErr] = useState('');
  const [lookup, setLookup] = useState<any>(null);
  const [loyaltyErr, setLoyaltyErr] = useState('');
  const [retry, setRetry] = useState(0);
  const cafeSlug = lastCafeSlug();

  useEffect(() => {
    if (!isAuthenticated) return;
    setErr('');
    setProfile(null);
    api('/customers/me', { method: 'POST' })
      .then(async (c: any) => {
        const full = await api<any>(`/customers/${c.id}`).catch(() => c);
        setProfile(full);
      })
      .catch((e) => setErr(e.message));
  }, [api, isAuthenticated, retry]);

  useEffect(() => {
    if (!organizationId || !profile?.id) return;
    api<any>(`/loyalty/lookup?organizationId=${organizationId}&customerId=${profile.id}`)
      .then((value) => {
        setLookup(value);
        setLoyaltyErr('');
      })
      .catch(() => {
        setLookup(null);
        setLoyaltyErr('Saldo poin tidak dapat diperbarui.');
      });
  }, [api, organizationId, profile?.id]);

  if (!isAuthenticated) {
    return (
      <PageShell beams={false} maxWidth="max-w-md">
        <AceCard className="mt-20 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cafe-forest text-cafe-card">
            <Coins weight="duotone" className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-cafe-ink">Member</h1>
          <p className="mt-2 text-sm text-cafe-muted">
            Login untuk lihat poin loyalty dan riwayat pesanan.
          </p>
          <AceButton variant="primary" className="mt-6 w-full" onClick={login}>
            Login
          </AceButton>
          <AceButton variant="ghost" className="mt-2 w-full" onClick={() => devLogin('owner')}>
            Dev login
          </AceButton>
          <AceButton as={Link} to="/" variant="ghost" className="mt-4 w-full !text-xs">
            Beranda
          </AceButton>
        </AceCard>
      </PageShell>
    );
  }

  if (!profile && !err) {
    return (
      <PageShell beams={false} maxWidth="max-w-md">
        <Loader className="pt-20" label="Memuat profil member…" />
      </PageShell>
    );
  }

  if (err && !profile) {
    return (
      <PageShell beams={false} maxWidth="max-w-md">
        <AceCard className="mt-20 text-center" role="alert">
          <h1 className="font-semibold text-cafe-ink">Profil tidak dapat dimuat</h1>
          <p className="mt-2 text-sm text-[var(--danger)]">{err}</p>
          <div className="mt-4 flex justify-center gap-2">
            <AceButton onClick={() => setRetry((n) => n + 1)}>Coba lagi</AceButton>
            <AceButton as={Link} to="/" variant="ghost">
              Beranda
            </AceButton>
          </div>
        </AceCard>
      </PageShell>
    );
  }

  const accounts = profile?.loyaltyAccounts || [];
  const orders = profile?.orders || [];
  const memberships = profile?.memberships || [];
  const balance = lookup?.balance ?? accounts[0]?.balance ?? 0;
  const perPt = lookup?.discountPerPoint ?? 0;
  const displayName = profile?.name || user?.name || user?.email || 'Member';

  return (
    <PageShell beams={false} maxWidth="max-w-md" className="pb-10">
      <FloatingNavbar
        brand="Member"
        navItems={[
          { name: 'Beranda', link: '/' },
          ...(cafeSlug ? [{ name: 'Menu', link: `/c/${cafeSlug}/menu` }] : []),
        ]}
      />

      <div className="space-y-5 pt-20">
        <section className="rounded-2xl bg-cafe-forest px-5 py-6 text-cafe-card">
          <p className="text-xs font-medium text-cafe-card/70">Halo</p>
          <h1 className="mt-1 text-xl font-bold tracking-tight">{displayName}</h1>
          <p className="mt-1 text-sm text-cafe-card/75">
            {profile?.email || user?.email}
            {profile?.phone ? ` · ${profile.phone}` : ''}
          </p>

          <div className="mt-5 rounded-xl bg-white/10 px-4 py-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-xs font-medium text-cafe-card/70">
              <Coins weight="duotone" className="h-4 w-4" />
              Saldo poin
            </div>
            <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight">{balance}</p>
            {perPt > 0 && (
              <p className="mt-1 text-sm text-cafe-card/70">
                ≈ {formatIdr(balance * perPt)} nilai tukar
              </p>
            )}
          </div>
        </section>

        {memberships.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {memberships.map((m: any) => (
              <AceBadge key={m.id} tone="ok">
                {m.tier?.name || m.tierId || 'Member'}
              </AceBadge>
            ))}
          </div>
        )}

        <p className="text-xs leading-relaxed text-cafe-muted">
          Tukar poin saat checkout dengan nomor telepon yang sama di profil.
        </p>

        {!organizationId && (
          <AceCard className="!border-cafe-accent/30 !bg-cafe-accent/10">
            <p className="text-sm font-medium text-cafe-ink">Poin terikat ke kafe</p>
            <p className="mt-1 text-xs text-cafe-muted">
              Buka menu kafe dulu agar saldo poin cabang bisa dimuat.
            </p>
            <AceButton
              as={Link}
              to={cafeSlug ? `/c/${cafeSlug}/menu` : '/'}
              variant="primary"
              className="mt-3 !text-sm"
            >
              {cafeSlug ? 'Buka menu' : 'Ke beranda'}
              <ArrowRight weight="bold" className="h-4 w-4" />
            </AceButton>
          </AceCard>
        )}

        {loyaltyErr && (
          <p role="status" className="text-xs text-[var(--danger)]">
            {loyaltyErr}
          </p>
        )}
        {err && (
          <p role="alert" className="text-sm text-[var(--danger)]">
            {err}
          </p>
        )}

        <section>
          <div className="mb-2 flex items-center gap-2">
            <Receipt weight="duotone" className="h-5 w-5 text-cafe-forest-mid" />
            <h2 className="font-bold text-cafe-ink">Riwayat pesanan</h2>
          </div>
          <ul className="divide-y divide-cafe-border overflow-hidden rounded-2xl border border-cafe-border bg-cafe-card">
            {orders.map((o: any) => {
              const row = (
                <>
                  <div className="min-w-0">
                    <div className="font-semibold text-cafe-ink">{o.orderNumber}</div>
                    <div className="mt-0.5">
                      <AceBadge tone={statusTone(o.status)}>{statusLabel(o.status)}</AceBadge>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-semibold tabular-nums text-cafe-ink">
                      {formatIdr(o.grandTotal)}
                    </div>
                    {o.publicToken && (
                      <ArrowRight weight="bold" className="ml-auto mt-1 h-3.5 w-3.5 text-cafe-muted" />
                    )}
                  </div>
                </>
              );
              return (
                <li key={o.id}>
                  {o.publicToken ? (
                    <Link
                      to={`/order/${o.publicToken}`}
                      className="flex min-h-11 items-center justify-between gap-3 px-4 py-3 text-sm transition hover:bg-cafe-hover"
                      aria-label={`Lihat pesanan ${o.orderNumber}`}
                    >
                      {row}
                    </Link>
                  ) : (
                    <div className="flex min-h-11 items-center justify-between gap-3 px-4 py-3 text-sm">
                      {row}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          {!orders.length && (
            <EmptyState
              title="Belum ada pesanan"
              description="Pesan lewat menu QR, lalu lacak di sini."
            />
          )}
        </section>
      </div>
    </PageShell>
  );
}
