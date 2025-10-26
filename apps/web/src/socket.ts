import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket && socket.connected) return socket;
  const token = localStorage.getItem('token') || '';
  // 游客模式：无 token 时也允许连接（用于联系客服）
  const guest = !token;
  const guestId = (() => {
    const key = 'guestId';
    let id = localStorage.getItem(key);
    if (!id) { id = Math.random().toString(36).slice(2); localStorage.setItem(key, id); }
    return id;
  })();
  // 统一使用与 API 相同的基址：开发环境一律走相对路径并由 Vite 代理，生产可用 VITE_API_URL
  const isDev = (import.meta as any).env?.DEV;
  const base = isDev ? '/' : ((import.meta as any).env?.VITE_API_URL || '/');
  socket = io(base, {
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
