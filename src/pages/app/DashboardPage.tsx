import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '@/hooks/useApi';
import { useAppStore } from '@/lib/store';
import { formatIdr } from '@/lib/api';
import { BentoGrid, BentoGridItem } from '@/components/ui/bento-grid';
import { StatCard } from '@/components/ace/PageShell';
import { AceButton } from '@/components/ace/AceButton';
import { Loader } from '@/components/ui/loader';

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
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-2 text-[#6b6b6b]">Pilih tenant atau selesaikan onboarding.</p>
        <AceButton as={Link} to="/app/onboarding" variant="accent" className="mt-4">
          Onboarding
        </AceButton>
      </div>
    );
  }

  if (loading) return <Loader />;

  if (error) return <p role="alert" className="text-sm text-[var(--danger)]">{error}</p>;

  return (
    <div className="animate-float-up space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-[#6b6b6b]">Ringkasan operasional cabang</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AceButton as={Link} to="/pos" variant="primary">
            POS
          </AceButton>
          <AceButton as={Link} to="/app/reports" variant="ghost">
            Laporan
          </AceButton>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Gross sales" value={formatIdr(sales?.grossSales ?? 0)} />
        <StatCard label="Orders" value={sales?.orderCount ?? 0} />
        <StatCard label="AOV" value={formatIdr(sales?.averageOrderValue ?? 0)} />
        <StatCard label="Tips" value={formatIdr(sales?.tipTotal ?? 0)} />
      </div>

      <BentoGrid>
        <Link to="/app/menu"><BentoGridItem title="Menu" description="Kelola kategori & item" /></Link>
        <Link to="/app/tables"><BentoGridItem title="Meja & QR" description="Floor map & rotate QR" /></Link>
        <Link to="/app/reservations"><BentoGridItem title="Reservasi" description="Check-in & kapasitas" /></Link>
        <Link to="/app/ledger"><BentoGridItem title="Ledger" description="Saldo & payout" /></Link>
        <Link to="/kds"><BentoGridItem title="KDS" description="Kitchen display" /></Link>
        <Link to="/app/homepage"><BentoGridItem title="Homepage" description="Builder publik" /></Link>
      </BentoGrid>
    </div>
  );
}
