import { Ambulance, Hospital, MissionStage } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

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
      ws = new WebSocket(`${WS_BASE_URL}/ws/dispatch`);

      ws.onopen = () => {
        console.log('[WebSocket] Connected to Dispatch Center');
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
        console.log('[WebSocket] Connection closed. Retrying in 3s...');
        onStatusChange?.(false);
        if (shouldReconnect) {
          reconnectTimer = setTimeout(connect, 3000);
        }
      };

      ws.onerror = (error) => {
        console.warn('[WebSocket] Connection error:', error);
        ws?.close();
      };
    } catch (e) {
      console.warn('[WebSocket] Init error:', e);
      if (shouldReconnect) {
        reconnectTimer = setTimeout(connect, 3000);
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
