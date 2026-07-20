import { useEffect, useState } from 'react';
import { AceButton } from '@/components/ace/AceButton';
import { AceInput, AceSelect } from '@/components/ace/AceInput';
import { AceBadge, EmptyState } from '@/components/ace/PageShell';
import { PageHeader } from '@/components/ace/PageHeader';
import { useApi } from '../../hooks/useApi';
import { useAppStore } from '../../lib/store';
import { Loader } from '@/components/ui/loader';

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
    if (!organizationId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      setMembers(await api<any[]>(`/organizations/${organizationId}/members`));
    } catch (e: any) {
      setError(e.message || 'Gagal memuat staf.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, [api, organizationId]);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setMsg('');
    try {
      await api(`/organizations/${organizationId}/members`, { method: 'POST', body: form });
      setForm({ ...form, email: '', name: '' });
      setMsg('Undangan staf terkirim.');
      await load();
    } catch (e: any) {
      setError(e.message || 'Gagal mengundang staf.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(userId: string) {
    const member = members.find((m) => m.userId === userId);
    if (!window.confirm(`Hapus ${member?.user?.name || member?.user?.email || 'staf ini'} dari organisasi?`))
      return;
    setBusy(true);
    setError('');
    setMsg('');
    try {
      await api(`/organizations/${organizationId}/members/${userId}/remove`, { method: 'POST' });
      setMsg('Staf dihapus.');
      await load();
    } catch (e: any) {
      setError(e.message || 'Gagal menghapus staf.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="animate-float-up space-y-6">
      <PageHeader title="Staf" description="Undang dan kelola akses organisasi" />
      {!organizationId && (
        <EmptyState title="Pilih tenant dulu" description="Gunakan switcher organisasi di atas." />
      )}
      {loading && <Loader label="Memuat staf…" />}
      {msg && (
        <p className="text-sm text-cafe-muted" role="status">
          {msg}
        </p>
      )}
      {error && (
        <p className="text-sm text-[var(--danger)]" role="alert">
          {error}
        </p>
      )}

      {organizationId && (
        <>
          <form
            className="max-w-md space-y-3 rounded-2xl border border-cafe-border bg-cafe-card p-4 shadow-sm"
            onSubmit={invite}
          >
            <h2 className="text-sm font-bold text-cafe-ink">Undang staf</h2>
            <AceInput
              label="Email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              autoComplete="email"
            />
            <AceInput
              label="Nama"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <AceSelect
              label="Peran"
              value={form.roleCode}
              onChange={(e) => setForm({ ...form, roleCode: e.target.value })}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </AceSelect>
            <AceButton type="submit" variant="primary" disabled={!organizationId || busy}>
              {busy ? 'Memproses…' : 'Undang'}
            </AceButton>
          </form>

          <ul className="divide-y divide-cafe-border overflow-hidden rounded-2xl border border-cafe-border bg-cafe-card">
            {members.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <div className="font-medium text-cafe-ink">{m.user?.name || m.user?.email}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-cafe-muted">
                    <span className="truncate">{m.user?.email}</span>
                    <AceBadge>{m.role?.code}</AceBadge>
                  </div>
                </div>
                <AceButton variant="danger" className="!text-sm" disabled={busy} onClick={() => remove(m.userId)}>
                  Hapus
                </AceButton>
              </li>
            ))}
          </ul>
          {!loading && !members.length && !error && <EmptyState title="Belum ada staf" />}
        </>
      )}
    </div>
  );
}
