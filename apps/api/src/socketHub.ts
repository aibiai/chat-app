import type { Server } from 'socket.io';

let ioRef: Server | null = null;

export function setSocketIO(io: Server) {
  ioRef = io;
}

export function emit(event: string, payload: any) {
  try {
    ioRef?.emit(event, payload);
  } catch {}
}

export function emitToAdmins(event: string, payload: any) {
  try {
    // 管理员端使用 adminToken 连接 socket，会被归入 uid = 'admin' 的房间
    ioRef?.to('admin').emit(event, payload);
  } catch {}
}
