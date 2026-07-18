import { useEffect, useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';

export function TenantSwitcher() {
  const api = useApi();
  const organizationId = useAppStore((s) => s.organizationId);
  const branchId = useAppStore((s) => s.branchId);
  const setTenant = useAppStore((s) => s.setTenant);
  const [memberships, setMemberships] = useState<any[]>([]);

  useEffect(() => {
    api<any>('/auth/me')
      .then((me) => setMemberships(me.memberships || []))
      .catch(() => undefined);
  }, [api]);

  if (!memberships.length) return null;

  const org = memberships.find((m) => m.organizationId === organizationId) || memberships[0];
  const branches = org?.organization?.branches || [];

  const sel =
    'rounded-xl border border-[#d4d0c8] bg-white px-2.5 py-1.5 text-sm outline-none transition focus:border-[#c4a574] focus:ring-2 focus:ring-[#c4a574]/25';

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm" data-ace="tenant">
      <select
        className={cn(sel, '!w-auto')}
        value={organizationId || ''}
        onChange={(e) => {
          const m = memberships.find((x) => x.organizationId === e.target.value);
          const b = m?.organization?.branches?.[0];
          if (m && b) setTenant(m.organizationId, b.id);
        }}
      >
        {memberships.map((m) => (
          <option key={m.organizationId} value={m.organizationId}>
            {m.organization?.name || m.organizationId.slice(0, 8)}
          </option>
        ))}
      </select>
      {branches.length > 0 && (
        <select
          className={cn(sel, '!w-auto')}
          value={branchId || ''}
          onChange={(e) => organizationId && setTenant(organizationId, e.target.value)}
        >
          {branches.map((b: any) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
