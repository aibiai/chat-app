import { Server, Socket } from 'socket.io';
import { setSocketIO } from './socketHub';
import { db } from './store';
import { nanoid } from 'nanoid';

const onlineCounts = new Map<string, number>();

export function setupSocket(io: Server) {
  // 保存全局引用，供其他模块广播事件
  setSocketIO(io);
  io.on('connection', (socket: Socket) => {
    const uid = (socket as any).uid as string;
    socket.join(uid);
    onlineCounts.set(uid, (onlineCounts.get(uid) || 0) + 1);
    io.emit('presence', { uid, online: true });

    socket.on('private:message', ({ toUserId, content }: { toUserId: string; content: string }) => {
      // 仅去除 ASCII 边界空白（空格/Tab/NBSP 等），保留全角空格等 CJK 符号
      const edgeTrimmed = typeof content === 'string'
        ? content.replace(/^[\u0009-\u000D\u0020\u00A0]+|[\u0009-\u000D\u0020\u00A0]+$/g, '')
        : '';
      // 若消息只包含 ASCII 空白，则视为无效，不转发（允许全角空格“　”）
      const asciiOnly = edgeTrimmed.replace(/[\u0009-\u000D\u0020\u00A0]/g, '').length === 0;
      if (!toUserId || !edgeTrimmed || asciiOnly) return;
      // 去掉消息中所有 ASCII 空格（U+0020），保留全角空格
      const sanitized = edgeTrimmed.replace(/ /g, '');
      if (!sanitized) return;
      const msg = { id: nanoid(), fromUserId: uid, toUserId, content: sanitized, createdAt: Date.now() };
      const messages = db.getMessages();
      messages.push(msg);
      db.saveMessages(messages);
      // emit to both parties
      io.to(uid).to(toUserId).emit('private:message', msg);
    });

    socket.on('disconnect', () => {
      const curr = (onlineCounts.get(uid) || 1) - 1;
      if (curr <= 0) {
        onlineCounts.delete(uid);
        io.emit('presence', { uid, online: false });
      } else {
        onlineCounts.set(uid, curr);
      }
    });
  });
}
