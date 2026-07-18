declare global {
  interface Window {
    snap?: { pay: (token: string, opts?: object) => void };
  }
}

export function snapScriptUrl() {
  return import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === 'true'
    ? 'https://app.midtrans.com/snap/snap.js'
    : 'https://app.sandbox.midtrans.com/snap/snap.js';
}

export async function loadSnap(clientKey: string) {
  if (window.snap) return;
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = snapScriptUrl();
    s.setAttribute('data-client-key', clientKey);
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Snap load failed'));
    document.body.appendChild(s);
  });
}

export function isMockSnap(snapToken?: string, clientKey?: string, mock?: boolean) {
  return (
    !!mock ||
    !clientKey ||
    clientKey === 'mock' ||
    String(snapToken || '').startsWith('mock-')
  );
}
