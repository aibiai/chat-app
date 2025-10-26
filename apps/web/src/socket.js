import { io } from 'socket.io-client';
let socket = null;
export function getSocket() {
    if (socket && socket.connected)
        return socket;
    const token = localStorage.getItem('token') || '';
    const isDev = import.meta.env?.DEV;
    const base = isDev ? '/' : ((import.meta.env?.VITE_API_URL) || '/');
    socket = io(base, { path: '/socket.io', transports: ['websocket', 'polling'], auth: { token } });
    return socket;
}
export function disconnectSocket() {
    socket?.disconnect();
    socket = null;
}
