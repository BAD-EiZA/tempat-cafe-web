import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ForkKnife,
  GridFour,
  CashRegister,
  CookingPot,
  CalendarBlank,
  Wallet,
  Browser,
  ChartBar,
  RocketLaunch,
  ArrowRight,
} from '@phosphor-icons/react';
import { useApi } from '@/hooks/useApi';
import { useAppStore } from '@/lib/store';
import { formatIdr } from '@/lib/api';
import { StatCard } from '@/components/ace/PageShell';
import { PageHeader } from '@/components/ace/PageHeader';
import { AceButton } from '@/components/ace/AceButton';
import { AceCard } from '@/components/ace/AceCard';
import { Loader } from '@/components/ui/loader';
import { cn } from '@/lib/utils';

const QUICK = [
  {
    to: '/app/menu',
    title: 'Menu',
    desc: 'Kategori & item',
    icon: ForkKnife,
  },
  {
    to: '/app/tables',
    title: 'Meja & QR',
    desc: 'Floor map & QR',
    icon: GridFour,
  },
  {
    to: '/pos',
    title: 'POS',
    desc: 'Kasir floor',
    icon: CashRegister,
  },
  {
    to: '/kds',
    title: 'KDS',
    desc: 'Kitchen display',
    icon: CookingPot,
  },
];

const MORE = [
  { to: '/app/reservations', title: 'Reservasi', icon: CalendarBlank },
  { to: '/app/ledger', title: 'Ledger', icon: Wallet },
  { to: '/app/homepage', title: 'Homepage', icon: Browser },
  { to: '/app/reports', title: 'Laporan', icon: ChartBar },
];

function StatSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-[88px] animate-pulse rounded-2xl border border-cafe-border bg-cafe-card"
        />
      ))}
    </div>
  );
}

export function DashboardPage() {
  const api = useApi();
  const organizationId = useAppStore((s) => s.organizationId);
  const branchId = useAppStore((s) => s.branchId);
  const [sales, setSales] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!organizationId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    api(`/reports/sales?organizationId=${organizationId}${branchId ? `&branchId=${branchId}` : ''}`)
      .then(setSales)
      .catch((e) => {
        setSales(null);
        setError(e.message || 'Gagal memuat dashboard.');
      })
      .finally(() => setLoading(false));
  }, [api, organizationId, branchId]);

  if (!organizationId) {
    return (
      <div className="mx-auto max-w-lg">
        <PageHeader
          title="Dashboard"
          description="Belum ada tenant aktif di sesi ini."
        />
        <AceCard className="mt-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cafe-forest text-cafe-card">
            <RocketLaunch weight="duotone" className="h-6 w-6" />
          </div>
          <h2 className="mt-4 font-semibold text-cafe-ink">Mulai onboarding merchant</h2>
          <p className="mt-2 text-sm text-cafe-muted">
            Buat organisasi, merek, dan cabang pertama. Atau pilih tenant di switcher atas.
          </p>
          <AceButton as={Link} to="/app/onboarding" variant="primary" className="mt-5">
            Mulai onboarding
            <ArrowRight weight="bold" className="h-4 w-4" />
          </AceButton>
        </AceCard>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Ringkasan operasional cabang" />
        <StatSkeleton />
        <Loader label="Memuat ringkasan…" />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <p role="alert" className="mt-4 text-sm text-[var(--danger)]">
          {error}
        </p>
      </div>
    );
  }

  const emptySales =
    !sales ||
    (!(sales.orderCount > 0) && !(sales.grossSales > 0));

  return (
    <div className="animate-float-up space-y-8">
      <PageHeader
        title="Dashboard"
        description="Ringkasan operasional cabang"
        actions={
          <>
            <AceButton as={Link} to="/pos" variant="primary">
              Buka POS
            </AceButton>
            <AceButton as={Link} to="/app/reports" variant="ghost">
              Laporan
            </AceButton>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Penjualan kotor" value={formatIdr(sales?.grossSales ?? 0)} />
        <StatCard label="Pesanan" value={sales?.orderCount ?? 0} />
        <StatCard label="Rata-rata order" value={formatIdr(sales?.averageOrderValue ?? 0)} />
        <StatCard label="Tip" value={formatIdr(sales?.tipTotal ?? 0)} />
      </div>

      {emptySales && (
        <p className="text-sm text-cafe-muted">
          Belum ada data penjualan di periode default. Mulai dari POS atau cek filter di Laporan.
        </p>
      )}

      <section>
        <h2 className="text-sm font-bold text-cafe-ink">Aksi cepat</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'group flex items-start gap-3 rounded-2xl border border-cafe-border bg-cafe-card p-4 shadow-sm transition',
                'hover:-translate-y-0.5 hover:border-cafe-forest-mid/40 hover:shadow-md',
              )}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cafe-forest text-cafe-card">
                <item.icon weight="duotone" className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold text-cafe-ink group-hover:text-cafe-forest">
                  {item.title}
                </span>
                <span className="mt-0.5 block text-xs text-cafe-muted">{item.desc}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-bold text-cafe-ink">Lainnya</h2>
        <ul className="mt-3 divide-y divide-cafe-border rounded-2xl border border-cafe-border bg-cafe-card">
          {MORE.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className="flex items-center gap-3 px-4 py-3 text-sm transition hover:bg-cafe-hover"
              >
                <item.icon weight="duotone" className="h-5 w-5 text-cafe-forest-mid" />
                <span className="flex-1 font-medium text-cafe-ink">{item.title}</span>
                <ArrowRight weight="bold" className="h-4 w-4 text-cafe-muted" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
