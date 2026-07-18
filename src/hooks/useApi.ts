import { useCallback } from 'react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { useAppStore } from '../lib/store';

export function useApi() {
  const { getAccessToken } = useAuth();
  const organizationId = useAppStore((s) => s.organizationId);
  const branchId = useAppStore((s) => s.branchId);

  return useCallback(
    async <T = unknown>(path: string, opts: { method?: string; body?: unknown } = {}) => {
      const token = await getAccessToken();
      return api<T>(path, {
        ...opts,
        token,
        orgId: organizationId || undefined,
        branchId: branchId || undefined,
      });
    },
    [getAccessToken, organizationId, branchId],
  );
}
