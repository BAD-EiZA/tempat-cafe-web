import { useEffect, useState } from 'react';
import { AceCard } from '@/components/ace/AceCard';
import { AceButton } from '@/components/ace/AceButton';
import { StatCard } from '@/components/ace/PageShell';
import { useApi } from '@/hooks/useApi';
import { useAppStore } from '@/lib/store';
import { formatIdr } from '@/lib/api';
import { EmptyState } from '@/components/ace/PageShell';
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

  return (
    <div className="animate-float-up" data-ace="1">
      <h1 className="text-2xl font-bold">Laporan</h1>
      {!organizationId && <p className="mt-4 text-[var(--muted)]">Pilih tenant di dashboard dulu.</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        <div><label className="label" htmlFor="report-from">Dari</label><input id="report-from" className="input max-w-[10rem]" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div><label className="label" htmlFor="report-to">Sampai</label><input id="report-to" className="input max-w-[10rem]" type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} /></div>
      </div>

      {(salesLoading || opsLoading) && <Loader label="Memuat laporan…" />}
      {salesError && <p role="alert" className="mt-4 text-sm text-[var(--danger)]">{salesError}</p>}
      {opsError && <p role="alert" className="mt-2 text-sm text-[var(--danger)]">{opsError}</p>}

      {sales && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Gross sales', formatIdr(sales.grossSales ?? 0)],
            ['Orders', sales.orderCount ?? 0],
            ['AOV', formatIdr(sales.averageOrderValue ?? 0)],
            ['Tips', formatIdr(sales.tipTotal ?? 0)],
            ['Net', formatIdr(sales.netSales ?? 0)],
            ['Diskon', formatIdr(sales.discountTotal ?? 0)],
            ['Pajak', formatIdr(sales.taxTotal ?? 0)],
            ['Refund count', sales.refundCount ?? 0],
          ].map(([k, v]) => (
            <div key={String(k)} className="rounded-2xl border border-[#e8e4de] bg-white p-4 shadow-sm">
              <div className="text-sm text-[var(--muted)]">{k}</div>
              <div className="mt-1 text-2xl font-bold">{v}</div>
            </div>
          ))}
        </div>
      )}

      {sales?.byHour?.length > 0 && (
        <div className="rounded-2xl border border-[#e8e4de] bg-white p-4 shadow-sm mt-6">
          <h2 className="font-semibold">Penjualan per jam</h2>
          <div className="mt-3 flex h-32 items-end gap-1">
            {sales.byHour.map((h: any) => (
              <div key={h.hour} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-[var(--accent)]"
                  style={{ height: `${Math.max(4, (h.total / maxHour) * 100)}%` }}
                  title={formatIdr(h.total)}
                />
                <span className="text-[10px] text-[var(--muted)]">{h.hour}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {sales?.topProducts?.length > 0 && (
        <div className="rounded-2xl border border-[#e8e4de] bg-white p-4 shadow-sm mt-6">
          <h2 className="font-semibold">Top produk</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {sales.topProducts.map((p: any) => (
              <li key={p.name} className="flex flex-wrap justify-between gap-2">
                <span>
                  {p.name} ×{p.qty}
                </span>
                <span>{formatIdr(p.revenue)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {ops && (
        <div className="rounded-2xl border border-[#e8e4de] bg-white p-4 shadow-sm mt-6 space-y-1 text-sm">
          <h2 className="font-semibold">Operasional cabang</h2>
          <p>Ticket: {ops.ticketCount}</p>
          <p>Avg production: {ops.avgProductionMinutes} min</p>
          <p>Feedback avg: {ops.feedback?._avg?.overallRating ?? ops.avgRating ?? '—'} ({ops.feedback?._count ?? ops.feedbackCount ?? 0})</p>
          {(ops.reservations || []).map((r: any) => (
            <p key={r.status} className="text-[var(--muted)]">
              Reservasi {r.status}: {r._count}
            </p>
          ))}
        </div>
      )}

      {sales && (
        <button
          className="inline-flex items-center justify-center rounded-xl border border-[#d4d0c8] px-4 py-2.5 text-sm font-semibold mt-4"
          onClick={() => {
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
          }}
        >
          Export CSV
        </button>
      )}
      {!salesLoading && !salesError && organizationId && !sales && <EmptyState title="Belum ada data laporan." />}
    </div>
  );
}
