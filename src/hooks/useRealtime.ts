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

    (async () => {
      const token = await getAccessToken();
      // EventSource cannot set Authorization header — pass token as query for SSE only
      const url = `${BASE}/realtime/stream?branchId=${branchId}${token ? `&access_token=${encodeURIComponent(token)}` : ''}`;
      // Prefer fetch-stream fallback: use poll if EventSource auth fails
      try {
        es = new EventSource(url);
        esRef.current = es;
        es.onopen = () => !closed && setConnected(true);
        es.onerror = () => {
          setConnected(false);
          es?.close();
        };
        es.onmessage = (msg) => {
          try {
            const data = JSON.parse(msg.data);
            cb.current(data);
          } catch {
            /* ignore */
          }
        };
      } catch {
        setConnected(false);
      }
    })();

    return () => {
      closed = true;
      es?.close();
      setConnected(false);
    };
  }, [branchId, getAccessToken]);

  return { connected };
}
