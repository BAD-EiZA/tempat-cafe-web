import { useEffect, useState } from 'react';
import { AceCard } from '@/components/ace/AceCard';
import { AceButton } from '@/components/ace/AceButton';
import { AceBadge, EmptyState, StatCard } from '@/components/ace/PageShell';
import { useApi } from '../../hooks/useApi';
import { useAppStore } from '../../lib/store';

export function FeedbackPage() {
  const api = useApi();
  const organizationId = useAppStore((s) => s.organizationId);
  const branchId = useAppStore((s) => s.branchId);
  const [rows, setRows] = useState<any[]>([]);
  const [reply, setReply] = useState<Record<string, string>>({});

  async function load() {
    if (!organizationId) return;
    const q = new URLSearchParams({ organizationId });
    if (branchId) q.set('branchId', branchId);
    setRows(await api<any[]>(`/feedback?${q}`));
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, [api, organizationId, branchId]);

  async function respond(id: string) {
    const message = reply[id];
    if (!message) return;
    await api(`/feedback/${id}/respond`, { method: 'POST', body: { message } });
    setReply({ ...reply, [id]: '' });
    await load();
  }

  return (
    <div className="animate-float-up" data-ace="1">
      <h1 className="text-2xl font-bold">Feedback</h1>
      <div className="mt-6 space-y-3">
        {rows.map((f) => (
          <div key={f.id} className="rounded-2xl border border-[#e8e4de] bg-white p-4 shadow-sm">
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
            <div className="mt-2 flex gap-2">
              <input
                className="input"
                placeholder="Balas…"
                value={reply[f.id] || ''}
                onChange={(e) => setReply({ ...reply, [f.id]: e.target.value })}
              />
              <button className="inline-flex items-center justify-center rounded-xl bg-[#1a1a1a] px-4 py-2.5 text-sm font-semibold text-white text-sm" onClick={() => respond(f.id)}>
                Kirim
              </button>
            </div>
          </div>
        ))}
        {!rows.length && <p className="text-[var(--muted)]">Belum ada feedback.</p>}
      </div>
    </div>
  );
}
