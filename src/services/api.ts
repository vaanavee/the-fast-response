import { Ambulance, Hospital, MissionStage } from '../types';

const isBrowser = typeof window !== 'undefined';
// When served via Vite dev server or production reverse proxy, use current origin
// When VITE_API_URL is explicitly set, honor it
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? (isBrowser ? '' : 'http://localhost:8000');

export const WS_BASE_URL = import.meta.env.VITE_WS_URL ?? (
  isBrowser
    ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`
    : 'ws://localhost:8000'
);

export async function fetchNearbyAmbulances(lat = 13.05060, lon = 80.21140): Promise<Ambulance[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/ambulances/nearby?lat=${lat}&lon=${lon}`);
    if (!res.ok) throw new Error('Failed to fetch ambulances');
    return await res.json();
  } catch (err) {
    console.warn('Backend unavailable, using fallback mock data:', err);
    return [];
  }
}

export async function fetchNearbyHospitals(lat = 13.05060, lon = 80.21140): Promise<Hospital[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/hospitals/nearby?lat=${lat}&lon=${lon}`);
    if (!res.ok) throw new Error('Failed to fetch hospitals');
    return await res.json();
  } catch (err) {
    console.warn('Backend unavailable, using fallback mock data:', err);
    return [];
  }
}

export async function sendSOSAlert(lat = 13.05060, lon = 80.21140) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/dispatch/sos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_lat: lat, user_lon: lon })
    });
    return await res.json();
  } catch (err) {
    console.warn('Error sending SOS alert to backend:', err);
    return null;
  }
}

export async function updateMissionStage(stage: MissionStage) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/driver/update-mission?stage=${stage}`, {
      method: 'POST'
    });
    return await res.json();
  } catch (err) {
    console.warn('Error updating mission stage on backend:', err);
    return null;
  }
}

export async function resetDispatch() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/dispatch/reset`, {
      method: 'POST'
    });
    return await res.json();
  } catch (err) {
    console.warn('Error resetting dispatch on backend:', err);
    return null;
  }
}

export function createDispatchWebSocket(onMessage: (data: any) => void, onStatusChange?: (status: boolean) => void) {
  let ws: WebSocket | null = null;
  let shouldReconnect = true;
  let reconnectTimer: any = null;

  function connect() {
    try {
      // Connect to /ws/dispatch endpoint
      const wsUrl = `${WS_BASE_URL}/ws/dispatch`;
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[WebSocket] Connected to Dispatch Center at', wsUrl);
        onStatusChange?.(true);
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          onMessage(parsed);
        } catch (e) {
          console.error('[WebSocket] Failed to parse message:', e);
        }
      };

      ws.onclose = () => {
        console.log('[WebSocket] Connection closed. Retrying in 4s...');
        onStatusChange?.(false);
        if (shouldReconnect) {
          reconnectTimer = setTimeout(connect, 4000);
        }
      };

      ws.onerror = (error) => {
        console.warn('[WebSocket] Connection notice (backend may be offline):', error);
        ws?.close();
      };
    } catch (e) {
      console.warn('[WebSocket] Init error:', e);
      if (shouldReconnect) {
        reconnectTimer = setTimeout(connect, 4000);
      }
    }
  }

  connect();

  return {
    send: (message: any) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    },
    close: () => {
      shouldReconnect = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) ws.close();
    }
  };
}
