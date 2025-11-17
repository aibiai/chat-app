import { io, Socket } from 'socket.io-client';
import { API_ORIGIN } from './api';

let socket: Socket | null = null;

export function getSocket(): Socket {
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
  // 默认后端端口已更新为 3004；在无浏览器环境时使用该端口作为回退
  const baseOrigin = API_ORIGIN || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3004');
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
