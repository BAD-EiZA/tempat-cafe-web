import { useEffect, useState } from 'react';
import { AceButton } from '@/components/ace/AceButton';
import { AceInput } from '@/components/ace/AceInput';
import { EmptyState } from '@/components/ace/PageShell';
import { PageHeader } from '@/components/ace/PageHeader';
import { useApi } from '../../hooks/useApi';
import { useAppStore } from '../../lib/store';
import { Loader } from '@/components/ui/loader';

export function FeedbackPage() {
  const api = useApi();
  const organizationId = useAppStore((s) => s.organizationId);
  const branchId = useAppStore((s) => s.branchId);
  const [rows, setRows] = useState<any[]>([]);
  const [reply, setReply] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  async function load() {
    if (!organizationId) { setLoading(false); return; }
    setLoading(true); setError('');
    const q = new URLSearchParams({ organizationId });
    if (branchId) q.set('branchId', branchId);
    try { setRows(await api<any[]>(`/feedback?${q}`)); }
    catch (e: any) { setError(e.message || 'Gagal memuat feedback.'); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, [api, organizationId, branchId]);

  async function respond(id: string) {
    const message = reply[id];
    if (!message) return;
    setBusyId(id); setError('');
    try {
      await api(`/feedback/${id}/respond`, { method: 'POST', body: { message } });
      setReply({ ...reply, [id]: '' }); await load();
    } catch (e: any) { setError(e.message || 'Gagal mengirim balasan.'); }
    finally { setBusyId(''); }
  }

  return (
    <div className="animate-float-up space-y-6">
      <PageHeader title="Feedback" description="Ulasan tamu & balasan" />
      {!organizationId && (
        <EmptyState title="Pilih tenant dulu" description="Gunakan switcher organisasi di atas." />
      )}
      {loading && <Loader label="Memuat feedback…" />}
      {error && (
        <p className="text-sm text-[var(--danger)]" role="alert">
          {error}
        </p>
      )}
      <div className="space-y-3">
        {rows.map((f) => (
          <div key={f.id} className="rounded-2xl border border-cafe-border bg-cafe-card p-4 shadow-sm">
            <div className="flex justify-between">
              <span className="font-bold">{f.overallRating}★</span>
              <span className="text-sm text-[var(--muted)]">{f.order?.orderNumber}</span>
            </div>
            {f.comment && <p className="mt-1 text-sm">{f.comment}</p>}
            {(f.responses || []).map((r: any) => (
              <p key={r.id} className="mt-2 text-sm text-[var(--muted)]">
                Reply: {r.message}
              </p>
            ))}
            <div className="mt-2 flex flex-wrap gap-2">
              <AceInput
                containerClassName="min-w-0 flex-1"
                placeholder="Balas…"
                aria-label={`Balasan untuk feedback ${f.order?.orderNumber || f.id}`}
                value={reply[f.id] || ''}
                onChange={(e) => setReply({ ...reply, [f.id]: e.target.value })}
              />
              <AceButton
                variant="primary"
                className="!text-sm"
                disabled={busyId === f.id || !reply[f.id]?.trim()}
                onClick={() => respond(f.id)}
              >
                {busyId === f.id ? 'Mengirim…' : 'Kirim'}
              </AceButton>
            </div>
          </div>
        ))}
        {!loading && !rows.length && !error && organizationId && (
          <EmptyState title="Belum ada feedback" />
        )}
      </div>
    </div>
  );
}
