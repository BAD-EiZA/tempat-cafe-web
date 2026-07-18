const BASE = import.meta.env.VITE_API_BASE || '/api/v1';

type Opts = {
  method?: string;
  body?: unknown;
  token?: string | null;
  orgId?: string;
  branchId?: string;
};

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, data: unknown) {
    super(typeof data === 'object' && data && 'message' in data ? String((data as any).message) : `HTTP ${status}`);
    this.status = status;
    this.data = data;
  }
}

export async function api<T = unknown>(path: string, opts: Opts = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  if (opts.orgId) headers['x-organization-id'] = opts.orgId;
  if (opts.branchId) headers['x-branch-id'] = opts.branchId;

  const res = await fetch(`${BASE}${path}`, {
    method: opts.method || (opts.body ? 'POST' : 'GET'),
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) throw new ApiError(res.status, data);
  return data as T;
}

export function formatIdr(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);
}
