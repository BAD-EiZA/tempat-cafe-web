import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAppStore } from './store';

type AuthCtx = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: { id?: string; email?: string; name?: string } | null;
  getAccessToken: () => Promise<string | null>;
  login: () => void;
  register: () => void;
  logout: () => void;
  devLogin: (label?: string) => void;
};

const Ctx = createContext<AuthCtx | null>(null);

const DEV = import.meta.env.VITE_DEV_AUTH === 'true';
const KINDE_DOMAIN = (import.meta.env.VITE_KINDE_DOMAIN || '').replace(/\/$/, '');
const KINDE_CLIENT_ID = import.meta.env.VITE_KINDE_CLIENT_ID || '';
const REDIRECT = import.meta.env.VITE_KINDE_REDIRECT_URI || window.location.origin;
const LOGOUT_URI = import.meta.env.VITE_KINDE_LOGOUT_URI || window.location.origin;
const AUDIENCE = import.meta.env.VITE_KINDE_AUDIENCE || '';

function mockJwt(sub: string, email: string, name: string) {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      sub,
      email,
      name,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400,
    }),
  );
  return `${header}.${payload}.dev`;
}

type TokenPayload = { sub?: string; email?: string; name?: string; exp?: number };

function decodePart(part: string) {
  const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')));
}

function parseJwt(token: string): TokenPayload | null {
  try {
    const [header, payload] = token.split('.');
    if (!header || !payload || (!DEV && decodePart(header)?.alg === 'none')) return null;
    const parsed = decodePart(payload);
    if (!parsed || typeof parsed !== 'object') return null;
    if (parsed.exp != null && (typeof parsed.exp !== 'number' || parsed.exp * 1000 <= Date.now())) return null;
    return parsed;
  } catch {
    return null;
  }
}

function readUser(raw: string | null): AuthCtx['user'] {
  if (!raw || !DEV) return null;
  try {
    const user = JSON.parse(raw);
    if (!user || typeof user !== 'object') return null;
    return {
      id: typeof user.id === 'string' ? user.id : undefined,
      email: typeof user.email === 'string' ? user.email : undefined,
      name: typeof user.name === 'string' ? user.name : undefined,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const fromHash = hash.get('access_token') || hash.get('id_token');
    if (fromHash && parseJwt(fromHash)) {
      localStorage.setItem('access_token', fromHash);
      window.history.replaceState({}, '', window.location.pathname + window.location.search);
      return fromHash;
    }
    const stored = localStorage.getItem('access_token') || (DEV ? localStorage.getItem('dev_token') : null);
    return stored && parseJwt(stored) ? stored : null;
  });
  const [user, setUser] = useState<AuthCtx['user']>(() => {
    if (token) {
      const p = parseJwt(token);
      if (p) return { id: p.sub, email: p.email, name: p.name };
    }
    return readUser(localStorage.getItem('dev_user'));
  });

  const devLogin = useCallback((label = 'owner') => {
    if (!DEV) return;
    const map: Record<string, { sub: string; email: string; name: string }> = {
      owner: { sub: 'dev-owner', email: 'owner@dev.local', name: 'Owner Dev' },
      admin: { sub: 'dev-platform-admin', email: 'admin@platform.local', name: 'Platform Admin' },
    };
    const u = map[label] || {
      sub: `dev-${label}`,
      email: `${label}@dev.local`,
      name: label,
    };
    const t = mockJwt(u.sub, u.email, u.name);
    localStorage.setItem('dev_token', t);
    localStorage.setItem('access_token', t);
    localStorage.setItem('dev_user', JSON.stringify({ id: u.sub, email: u.email, name: u.name }));
    setToken(t);
    setUser({ id: u.sub, email: u.email, name: u.name });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('dev_token');
    localStorage.removeItem('dev_user');
    localStorage.removeItem('access_token');
    useAppStore.getState().reset();
    setToken(null);
    setUser(null);
    if (!DEV && KINDE_DOMAIN) {
      window.location.href = `${KINDE_DOMAIN}/logout?redirect=${encodeURIComponent(LOGOUT_URI)}`;
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    const exp = parseJwt(token)?.exp;
    if (!exp) return;
    const timer = window.setTimeout(logout, Math.max(0, exp * 1000 - Date.now()));
    return () => window.clearTimeout(timer);
  }, [token, logout]);

  const login = useCallback(() => {
    if (DEV) {
      devLogin('owner');
      return;
    }
    if (!KINDE_DOMAIN || !KINDE_CLIENT_ID) {
      console.error('Kinde auth is not configured');
      return;
    }
    const params = new URLSearchParams({
      client_id: KINDE_CLIENT_ID,
      redirect_uri: REDIRECT,
      response_type: 'token',
      scope: 'openid profile email offline',
    });
    if (AUDIENCE) params.set('audience', AUDIENCE);
    window.location.href = `${KINDE_DOMAIN}/oauth2/auth?${params}`;
  }, [devLogin]);

  const value = useMemo<AuthCtx>(
    () => ({
      isAuthenticated: !!token,
      isLoading: false,
      user,
      getAccessToken: async () => token,
      login,
      register: login,
      logout,
      devLogin,
    }),
    [token, user, login, logout, devLogin],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('AuthProvider missing');
  return ctx;
}
