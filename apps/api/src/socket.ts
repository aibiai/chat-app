import { Server, Socket } from 'socket.io';
import { db } from './store';
import { nanoid } from 'nanoid';

const onlineCounts = new Map<string, number>();

export function setupSocket(io: Server) {
  io.on('connection', (socket: Socket) => {
    const uid = (socket as any).uid as string;
    socket.join(uid);
    onlineCounts.set(uid, (onlineCounts.get(uid) || 0) + 1);
    io.emit('presence', { uid, online: true });

    socket.on('private:message', ({ toUserId, content }: { toUserId: string; content: string }) => {
      const clean = typeof content === 'string' ? content.replace(/[ \u3000]+/g, '') : '';
      if (!toUserId || !clean) return;
      const msg = { id: nanoid(), fromUserId: uid, toUserId, content: clean, createdAt: Date.now() };
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
