import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

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

const DEV = import.meta.env.VITE_DEV_AUTH === 'true' || !import.meta.env.VITE_KINDE_CLIENT_ID;
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

function parseJwt(token: string): { sub?: string; email?: string; name?: string } | null {
  try {
    const [, p] = token.split('.');
    return JSON.parse(atob(p.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const fromHash = hash.get('access_token') || hash.get('id_token');
    if (fromHash) {
      localStorage.setItem('access_token', fromHash);
      window.history.replaceState({}, '', window.location.pathname + window.location.search);
      return fromHash;
    }
    return localStorage.getItem('access_token') || localStorage.getItem('dev_token');
  });
  const [user, setUser] = useState<AuthCtx['user']>(() => {
    if (token) {
      const p = parseJwt(token);
      if (p) return { id: p.sub, email: p.email, name: p.name };
    }
    const raw = localStorage.getItem('dev_user');
    return raw ? JSON.parse(raw) : null;
  });

  const devLogin = useCallback((label = 'owner') => {
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
    setToken(null);
    setUser(null);
    if (!DEV && KINDE_DOMAIN) {
      window.location.href = `${KINDE_DOMAIN}/logout?redirect=${encodeURIComponent(LOGOUT_URI)}`;
    }
  }, []);

  const login = useCallback(() => {
    if (DEV) {
      devLogin('owner');
      return;
    }
    if (!KINDE_DOMAIN || !KINDE_CLIENT_ID) {
      devLogin('owner');
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
