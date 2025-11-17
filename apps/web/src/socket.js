import { io } from 'socket.io-client';
import { API_ORIGIN } from './api';

let socket = null;

export function getSocket() {
  if (socket && socket.connected) return socket;
  const token = localStorage.getItem('token') || '';
  const guest = !token;
  const guestId = (() => {
    const key = 'guestId';
    let id = localStorage.getItem(key);
    if (!id) {
      id = Math.random().toString(36).slice(2);
      localStorage.setItem(key, id);
    }
    return id;
  })();
  const baseOrigin = API_ORIGIN || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3003');
  socket = io(baseOrigin, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    auth: guest ? { guest: true, guestId } : { token },
    timeout: 6000,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 500,
    reconnectionDelayMax: 3000,
    randomizationFactor: 0.4
  });
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
