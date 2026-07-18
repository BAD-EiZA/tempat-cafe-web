import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../lib/auth';

const BASE = import.meta.env.VITE_API_BASE || '/api/v1';

export function useRealtime(branchId: string | null, onEvent: (e: any) => void) {
  const { getAccessToken } = useAuth();
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const cb = useRef(onEvent);
  cb.current = onEvent;

  useEffect(() => {
    if (!branchId) return;
    let closed = false;
    let es: EventSource | null = null;
    let retry: number | undefined;
    let attempts = 0;

    const scheduleReconnect = () => {
      if (closed || retry !== undefined) return;
      setConnected(false);
      const delay = Math.min(1000 * 2 ** attempts, 30_000);
      attempts = Math.min(attempts + 1, 5);
      retry = window.setTimeout(() => {
        retry = undefined;
        void connect();
      }, delay);
    };

    const connect = async () => {
      try {
        const token = await getAccessToken();
        if (closed) return;
        const params = new URLSearchParams({ branchId });
        // EventSource cannot set an Authorization header.
        if (token) params.set('access_token', token);
        const source = new EventSource(`${BASE}/realtime/stream?${params}`);
        es?.close();
        es = source;
        esRef.current = source;
        source.onopen = () => {
          if (closed || es !== source) return;
          attempts = 0;
          setConnected(true);
        };
        source.onerror = () => {
          if (closed || es !== source) return;
          source.close();
          es = null;
          esRef.current = null;
          scheduleReconnect();
        };
        source.onmessage = (msg) => {
          try {
            const data = JSON.parse(msg.data);
            cb.current(data);
          } catch {
            /* ignore */
          }
        };
      } catch {
        scheduleReconnect();
      }
    };

    void connect();

    return () => {
      closed = true;
      if (retry !== undefined) window.clearTimeout(retry);
      es?.close();
      esRef.current = null;
      setConnected(false);
    };
  }, [branchId, getAccessToken]);

  return { connected };
}
