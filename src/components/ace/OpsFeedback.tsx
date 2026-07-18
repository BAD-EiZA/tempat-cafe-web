import { useEffect, useState } from 'react';

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Baru',
  ACCEPTED: 'Diterima',
  QUEUED: 'Antre',
  ACKNOWLEDGED: 'Dikonfirmasi',
  PREPARING: 'Disiapkan',
  PARTIALLY_READY: 'Sebagian siap',
  READY: 'Siap',
  SERVED: 'Diantar',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
  PENDING: 'Menunggu',
  PAID: 'Lunas',
  FAILED: 'Gagal',
  APPROVED: 'Disetujui',
  SUSPENDED: 'Ditangguhkan',
  ACTIVE: 'Aktif',
  INACTIVE: 'Tidak aktif',
  AVAILABLE: 'Tersedia',
  OCCUPIED: 'Terisi',
  RESERVED: 'Dipesan',
};

export function statusLabel(status?: string) {
  return status ? STATUS_LABELS[status] || status : '-';
}

export function ConnectionStatus({
  connected,
  lastSync,
  error,
  onRetry,
}: {
  connected: boolean;
  lastSync: Date | null;
  error?: string;
  onRetry?: () => void;
}) {
  const [, tick] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => tick((value) => value + 1), 10_000);
    return () => window.clearInterval(timer);
  }, []);

  const stale = !!lastSync && Date.now() - lastSync.getTime() > 20_000;
  const tone = error ? 'border-red-400/30 bg-red-500/15 text-red-100' : stale || !connected ? 'border-amber-400/30 bg-amber-500/15 text-amber-100' : 'border-emerald-400/30 bg-emerald-500/15 text-emerald-100';
  const label = error ? 'Koneksi gagal' : stale ? 'Data usang' : connected ? 'Tersambung langsung' : 'Menyambungkan ulang';

  return (
    <div className={`mb-3 flex min-h-11 flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm ${tone}`} role={error ? 'alert' : 'status'}>
      <span>
        <strong>{label}</strong>
        <span className="ml-2 opacity-75">{lastSync ? `Pembaruan ${lastSync.toLocaleTimeString('id-ID')}` : 'Belum ada data'}</span>
      </span>
      {error && onRetry && (
        <button className="min-h-11 rounded-lg px-3 font-semibold underline" onClick={onRetry}>Coba lagi</button>
      )}
    </div>
  );
}

export function ActionError({ message }: { message: string }) {
  if (!message) return null;
  return <p className="mt-2 rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-100" role="alert">{message}</p>;
}
