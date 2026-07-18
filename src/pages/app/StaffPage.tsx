import { useEffect, useState } from 'react';
import { AceCard } from '@/components/ace/AceCard';
import { AceButton } from '@/components/ace/AceButton';
import { AceBadge, EmptyState, StatCard } from '@/components/ace/PageShell';
import { useApi } from '../../hooks/useApi';
import { useAppStore } from '../../lib/store';

const ROLES = ['CASHIER', 'KITCHEN', 'BARISTA', 'WAITER', 'BRANCH_MANAGER', 'OWNER', 'FINANCE_VIEWER'];

export function StaffPage() {
  const api = useApi();
  const organizationId = useAppStore((s) => s.organizationId);
  const [members, setMembers] = useState<any[]>([]);
  const [form, setForm] = useState({ email: '', name: '', roleCode: 'CASHIER' });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  async function load() {
    if (!organizationId) { setLoading(false); return; }
    setLoading(true); setError('');
    try { setMembers(await api<any[]>(`/organizations/${organizationId}/members`)); }
    catch (e: any) { setError(e.message || 'Gagal memuat staf.'); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, [api, organizationId]);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(''); setMsg('');
    try {
      await api(`/organizations/${organizationId}/members`, { method: 'POST', body: form });
      setForm({ ...form, email: '', name: '' }); setMsg('Undangan staf terkirim.'); await load();
    } catch (e: any) { setError(e.message || 'Gagal mengundang staf.'); }
    finally { setBusy(false); }
  }

  async function remove(userId: string) {
    const member = members.find((m) => m.userId === userId);
    if (!window.confirm(`Hapus ${member?.user?.name || member?.user?.email || 'staf ini'} dari organisasi?`)) return;
    setBusy(true); setError(''); setMsg('');
    try { await api(`/organizations/${organizationId}/members/${userId}/remove`, { method: 'POST' }); setMsg('Staf dihapus.'); await load(); }
    catch (e: any) { setError(e.message || 'Gagal menghapus staf.'); }
    finally { setBusy(false); }
  }

  return (
    <div className="animate-float-up" data-ace="1">
      <h1 className="text-2xl font-bold">Staf</h1>
      {loading && <p className="mt-4 text-[var(--muted)]" role="status">Memuat staf…</p>}
      {msg && <p className="mt-4 text-sm text-[var(--muted)]" role="status">{msg}</p>}
      {error && <p className="mt-4 text-sm text-red-700" role="alert">{error}</p>}
      <form className="rounded-2xl border border-[#e8e4de] bg-white p-4 shadow-sm mt-6 max-w-md space-y-2" onSubmit={invite}>
        <h2 className="font-semibold">Undang staf</h2>
        <input
          className="input"
          type="email"
          placeholder="Email"
          aria-label="Email staf"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          className="input"
          placeholder="Nama"
          aria-label="Nama staf"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <select
          className="input"
          aria-label="Peran staf"
          value={form.roleCode}
          onChange={(e) => setForm({ ...form, roleCode: e.target.value })}
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <button className="inline-flex items-center justify-center rounded-xl bg-[#1a1a1a] px-4 py-2.5 text-sm font-semibold text-white" type="submit" disabled={!organizationId || busy}>
          {busy ? 'Memproses…' : 'Undang'}
        </button>
      </form>
      <div className="mt-6 space-y-2">
        {members.map((m) => (
          <div key={m.id} className="rounded-2xl border border-[#e8e4de] bg-white p-4 shadow-sm flex items-center justify-between gap-3 text-sm">
            <div>
              <div className="font-medium">{m.user?.name || m.user?.email}</div>
              <div className="text-[var(--muted)]">
                {m.user?.email} · {m.role?.code}
              </div>
            </div>
            <button className="inline-flex items-center justify-center rounded-xl bg-[#b91c1c] px-4 py-2.5 text-sm font-semibold text-white" disabled={busy} onClick={() => remove(m.userId)}>
              Hapus
            </button>
          </div>
        ))}
        {!loading && !members.length && !error && <EmptyState title="Belum ada staf." />}
      </div>
    </div>
  );
}
