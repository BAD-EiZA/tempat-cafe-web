/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE: string;
  readonly VITE_KINDE_DOMAIN: string;
  readonly VITE_KINDE_CLIENT_ID: string;
  readonly VITE_KINDE_REDIRECT_URI: string;
  readonly VITE_KINDE_LOGOUT_URI: string;
  readonly VITE_KINDE_AUDIENCE: string;
  readonly VITE_DEV_AUTH: string;
  readonly VITE_MIDTRANS_IS_PRODUCTION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
