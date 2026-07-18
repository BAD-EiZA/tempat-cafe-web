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

  useEffect(() => {
    if (!organizationId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api(`/reports/sales?organizationId=${organizationId}${branchId ? `&branchId=${branchId}` : ''}`)
      .then(setSales)
      .catch(() => setSales(null))
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

  return (
    <div className="animate-float-up space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-[#6b6b6b]">Ringkasan operasional cabang</p>
        </div>
        <div className="flex gap-2">
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
        <BentoGridItem title="Menu" description="Kelola kategori & item" onClick={() => (window.location.href = '/app/menu')} />
        <BentoGridItem title="Meja & QR" description="Floor map & rotate QR" onClick={() => (window.location.href = '/app/tables')} />
        <BentoGridItem title="Reservasi" description="Check-in & kapasitas" onClick={() => (window.location.href = '/app/reservations')} />
        <BentoGridItem title="Ledger" description="Saldo & payout" onClick={() => (window.location.href = '/app/ledger')} />
        <BentoGridItem title="KDS" description="Kitchen display" onClick={() => (window.location.href = '/kds')} />
        <BentoGridItem title="Homepage" description="Builder publik" onClick={() => (window.location.href = '/app/homepage')} />
      </BentoGrid>
    </div>
  );
}
