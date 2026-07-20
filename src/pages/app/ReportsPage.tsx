import { useEffect, useState } from 'react';
import { AceCard } from '@/components/ace/AceCard';
import { AceButton } from '@/components/ace/AceButton';
import { AceInput } from '@/components/ace/AceInput';
import { StatCard, EmptyState } from '@/components/ace/PageShell';
import { PageHeader } from '@/components/ace/PageHeader';
import { useApi } from '@/hooks/useApi';
import { useAppStore } from '@/lib/store';
import { formatIdr } from '@/lib/api';
import { Loader } from '@/components/ui/loader';

export function ReportsPage() {
  const api = useApi();
  const organizationId = useAppStore((s) => s.organizationId);
  const branchId = useAppStore((s) => s.branchId);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sales, setSales] = useState<any>(null);
  const [ops, setOps] = useState<any>(null);
  const [salesLoading, setSalesLoading] = useState(false);
  const [opsLoading, setOpsLoading] = useState(false);
  const [salesError, setSalesError] = useState('');
  const [opsError, setOpsError] = useState('');

  function qs() {
    const p = new URLSearchParams();
    if (organizationId) p.set('organizationId', organizationId);
    if (branchId) p.set('branchId', branchId);
    if (from) p.set('from', new Date(from).toISOString());
    if (to) p.set('to', new Date(to + 'T23:59:59').toISOString());
    return p.toString();
  }

  useEffect(() => {
    if (!organizationId) {
      setSales(null);
      return;
    }
    setSalesLoading(true);
    setSalesError('');
    api(`/reports/sales?${qs()}`)
      .then(setSales)
      .catch((e) => {
        setSales(null);
        setSalesError(e.message || 'Gagal memuat laporan penjualan.');
      })
      .finally(() => setSalesLoading(false));
  }, [api, organizationId, branchId, from, to]);

  useEffect(() => {
    if (!branchId) {
      setOps(null);
      return;
    }
    setOpsLoading(true);
    setOpsError('');
    const p = new URLSearchParams({ branchId });
    if (from) p.set('from', new Date(from).toISOString());
    if (to) p.set('to', new Date(to + 'T23:59:59').toISOString());
    api(`/reports/operations?${p}`)
      .then(setOps)
      .catch((e) => {
        setOps(null);
        setOpsError(e.message || 'Gagal memuat laporan operasional.');
      })
      .finally(() => setOpsLoading(false));
  }, [api, branchId, from, to]);

  const maxHour = Math.max(1, ...(sales?.byHour || []).map((h: any) => h.total || 0));

  function exportCsv() {
    if (!sales) return;
    const rows = [
      ['metric', 'value'],
      ['grossSales', sales.grossSales],
      ['netSales', sales.netSales],
      ['orderCount', sales.orderCount],
      ['aov', sales.averageOrderValue],
      ['tips', sales.tipTotal],
      ['discount', sales.discountTotal],
      ['tax', sales.taxTotal],
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'sales-report.csv';
    a.click();
  }

  return (
    <div className="animate-float-up space-y-6">
      <PageHeader
        title="Laporan"
        description="Penjualan dan operasional per cabang"
        actions={
          sales ? (
            <AceButton variant="ghost" onClick={exportCsv}>
              Export CSV
            </AceButton>
          ) : undefined
        }
      />

      {!organizationId && (
        <EmptyState
          title="Pilih tenant dulu"
          description="Gunakan switcher organisasi & cabang di atas."
        />
      )}

      {organizationId && (
        <AceCard className="!p-4">
          <div className="flex flex-wrap items-end gap-3">
            <AceInput
              label="Dari"
              type="date"
              containerClassName="min-w-[10rem]"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <AceInput
              label="Sampai"
              type="date"
              containerClassName="min-w-[10rem]"
              value={to}
              min={from}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </AceCard>
      )}

      {(salesLoading || opsLoading) && <Loader label="Memuat laporan…" />}
      {salesError && (
        <p role="alert" className="text-sm text-[var(--danger)]">
          {salesError}
        </p>
      )}
      {opsError && (
        <p role="alert" className="text-sm text-[var(--danger)]">
          {opsError}
        </p>
      )}

      {sales && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Penjualan kotor" value={formatIdr(sales.grossSales ?? 0)} />
          <StatCard label="Pesanan" value={sales.orderCount ?? 0} />
          <StatCard label="Rata-rata order" value={formatIdr(sales.averageOrderValue ?? 0)} />
          <StatCard label="Tip" value={formatIdr(sales.tipTotal ?? 0)} />
          <StatCard label="Net" value={formatIdr(sales.netSales ?? 0)} />
          <StatCard label="Diskon" value={formatIdr(sales.discountTotal ?? 0)} />
          <StatCard label="Pajak" value={formatIdr(sales.taxTotal ?? 0)} />
          <StatCard label="Refund" value={sales.refundCount ?? 0} />
        </div>
      )}

      {sales?.byHour?.length > 0 && (
        <AceCard>
          <h2 className="font-semibold text-cafe-ink">Penjualan per jam</h2>
          <div className="mt-3 flex h-32 items-end gap-1">
            {sales.byHour.map((h: any) => (
              <div key={h.hour} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-cafe-accent"
                  style={{ height: `${Math.max(4, (h.total / maxHour) * 100)}%` }}
                  title={formatIdr(h.total)}
                />
                <span className="text-[10px] text-cafe-muted">{h.hour}</span>
              </div>
            ))}
          </div>
        </AceCard>
      )}

      {sales?.topProducts?.length > 0 && (
        <AceCard>
          <h2 className="font-semibold text-cafe-ink">Top produk</h2>
          <ul className="mt-3 divide-y divide-cafe-border text-sm">
            {sales.topProducts.map((p: any) => (
              <li key={p.name} className="flex flex-wrap justify-between gap-2 py-2 first:pt-0 last:pb-0">
                <span>
                  {p.name} ×{p.qty}
                </span>
                <span className="font-semibold tabular-nums">{formatIdr(p.revenue)}</span>
              </li>
            ))}
          </ul>
        </AceCard>
      )}

      {ops && (
        <AceCard className="space-y-1 text-sm">
          <h2 className="font-semibold text-cafe-ink">Operasional cabang</h2>
          <p className="text-cafe-muted">Ticket: <span className="font-medium text-cafe-ink">{ops.ticketCount}</span></p>
          <p className="text-cafe-muted">
            Avg production:{' '}
            <span className="font-medium text-cafe-ink">{ops.avgProductionMinutes} min</span>
          </p>
          <p className="text-cafe-muted">
            Feedback avg:{' '}
            <span className="font-medium text-cafe-ink">
              {ops.feedback?._avg?.overallRating ?? ops.avgRating ?? '-'} (
              {ops.feedback?._count ?? ops.feedbackCount ?? 0})
            </span>
          </p>
          {(ops.reservations || []).map((r: any) => (
            <p key={r.status} className="text-cafe-muted">
              Reservasi {r.status}: {r._count}
            </p>
          ))}
        </AceCard>
      )}

      {!salesLoading && !salesError && organizationId && !sales && (
        <EmptyState title="Belum ada data laporan." />
      )}
    </div>
  );
}
