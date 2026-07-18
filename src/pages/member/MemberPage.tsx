import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/lib/auth';
import { formatIdr } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { PageShell, StatCard, EmptyState } from '@/components/ace/PageShell';
import { AceCard } from '@/components/ace/AceCard';
import { AceButton } from '@/components/ace/AceButton';
import { Timeline } from '@/components/ui/timeline';
import { GlareCard } from '@/components/ui/glare-card';
import { FloatingNavbar } from '@/components/ui/floating-navbar';
import { MovingBorderButton } from '@/components/ui/moving-border';
import { Loader } from '@/components/ui/loader';

export function MemberPage() {
  const api = useApi();
  const { isAuthenticated, login, user, devLogin } = useAuth();
  const organizationId = useAppStore((s) => s.organizationId);
  const [profile, setProfile] = useState<any>(null);
  const [err, setErr] = useState('');
  const [lookup, setLookup] = useState<any>(null);
  const [loyaltyErr, setLoyaltyErr] = useState('');
  const [retry, setRetry] = useState(0);

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
      <PageShell beams spotlight maxWidth="max-w-md">
        <AceCard className="mt-20 text-center" glare>
          <h1 className="text-2xl font-bold">Member</h1>
          <p className="mt-2 text-[#6b6b6b]">Login untuk lihat profil & loyalty.</p>
          <MovingBorderButton className="mt-4" onClick={login}>
            Login
          </MovingBorderButton>
          <AceButton variant="ghost" className="mt-2 w-full" onClick={() => devLogin('owner')}>
            Dev login
          </AceButton>
        </AceCard>
      </PageShell>
    );
  }

  if (!profile && !err) {
    return (
      <PageShell beams maxWidth="max-w-md">
        <Loader className="pt-20" label="Memuat profil member…" />
      </PageShell>
    );
  }

  if (err && !profile) {
    return (
      <PageShell beams maxWidth="max-w-md">
        <AceCard className="mt-20 text-center" role="alert">
          <h1 className="font-semibold">Profil tidak dapat dimuat</h1>
          <p className="mt-2 text-sm text-[var(--danger)]">{err}</p>
          <div className="mt-4 flex justify-center gap-2">
            <AceButton onClick={() => setRetry((n) => n + 1)}>Coba lagi</AceButton>
            <AceButton as={Link} to="/" variant="ghost">Beranda</AceButton>
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

  return (
    <PageShell beams maxWidth="max-w-md" className="pb-10">
      <FloatingNavbar
        brand="Member"
        navItems={[{ name: 'Beranda', link: '/' }]}
        right={
          <AceButton as={Link} to="/" variant="ghost" className="!py-1.5 !text-xs">
            Home
          </AceButton>
        }
      />
      <div className="space-y-4 pt-20">
        <GlareCard>
          <p className="font-medium">{profile?.name || user?.name || user?.email}</p>
          <p className="text-sm text-[#6b6b6b]">{profile?.email || user?.email}</p>
          <p className="text-sm text-[#6b6b6b]">{profile?.phone}</p>
        </GlareCard>
        {err && <p role="alert" className="text-sm text-[var(--danger)]">{err}</p>}

        {memberships.length > 0 && (
          <AceCard>
            <h2 className="font-semibold">Tier</h2>
            {memberships.map((m: any) => (
              <p key={m.id} className="text-sm">
                {m.tier?.name || m.tierId}
              </p>
            ))}
          </AceCard>
        )}

        <StatCard
          label="Poin"
          value={
            <span>
              {balance}
              {perPt > 0 && (
                <span className="ml-2 text-sm font-normal text-[#6b6b6b]">
                  ≈ {formatIdr(balance * perPt)}
                </span>
              )}
            </span>
          }
        />
        <p className="text-xs text-[#6b6b6b]">
          Tukar poin saat checkout (nomor telepon sama dengan profil).
        </p>
        {loyaltyErr && <p role="status" className="text-xs text-[var(--danger)]">{loyaltyErr}</p>}

        <div>
          <h2 className="font-semibold">Riwayat pesanan</h2>
          <div className="mt-2 space-y-2">
            {orders.map((o: any) => (
              <AceCard key={o.id} className="!p-0">
                <Link className="block min-h-11 p-4 text-sm" to={`/order/${o.publicToken}`} aria-label={`Lihat pesanan ${o.orderNumber}`}>
                  <div className="flex justify-between">
                    <span className="font-medium">{o.orderNumber}</span>
                    <span>{formatIdr(o.grandTotal)}</span>
                  </div>
                  <div className="text-[#6b6b6b]">{o.status}</div>
                </Link>
              </AceCard>
            ))}
            {!orders.length && <EmptyState title="Belum ada pesanan." />}
          </div>
        </div>

        {orders.length > 0 && (
          <AceCard>
            <Timeline
              items={orders.slice(0, 5).map((o: any) => ({
                title: o.orderNumber,
                description: `${o.status} · ${formatIdr(o.grandTotal)}`,
                done: o.status === 'COMPLETED',
              }))}
            />
          </AceCard>
        )}
      </div>
    </PageShell>
  );
}
