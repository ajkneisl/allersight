import { useCallback, useEffect, useRef, useState } from 'react';
import { API_BASE_URL } from './api';
import { useAuth } from './auth-context';

export function useVisionStatus() {
  const { token } = useAuth();
  const [connected, setConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!token) return;
    const url = API_BASE_URL.replace(/^http/, 'ws') + `/ws/status?token=${token}`;
    const socket = new WebSocket(url);
    ws.current = socket;

    socket.onmessage = (e) => setConnected(e.data === 'connected');
    socket.onclose = () => { ws.current = null; setConnected(false); };

    return () => { socket.close(); ws.current = null; };
  }, [token]);

  const refresh = useCallback(() => {
    // Close and reopen to get fresh status from server
    if (ws.current) {
      ws.current.onclose = null;
      ws.current.close();
      ws.current = null;
    }
    if (!token) return;
    setConnected(false); // brief visual reset
    const url = API_BASE_URL.replace(/^http/, 'ws') + `/ws/status?token=${token}`;
    const socket = new WebSocket(url);
    ws.current = socket;
    socket.onmessage = (e) => setConnected(e.data === 'connected');
    socket.onclose = () => { ws.current = null; setConnected(false); };
  }, [token]);

  return { connected, refresh };
}
