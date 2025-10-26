import { Router, Request, Response } from 'express';
import { db } from '../store';
import { verifyToken } from '../auth';
import { nanoid } from 'nanoid';

export const messagesRouter = Router();

// 最近会话列表（按最后一条消息时间倒序）
messagesRouter.get('/recent', (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Unauthorized' });
  const uid = payload.uid;
  const all = db.getMessages();
  const mine = all.filter(m => m.fromUserId === uid || m.toUserId === uid);
  const map = new Map<string, { lastAt: number; lastContent: string }>();
  for (const m of mine) {
    const peerId = m.fromUserId === uid ? m.toUserId : m.fromUserId;
    const cur = map.get(peerId);
    if (!cur || m.createdAt > cur.lastAt) {
      map.set(peerId, { lastAt: m.createdAt, lastContent: m.content });
    }
  }
  const users = db.getUsers();
  const reads = db.getReads();
  const list = Array.from(map.entries())
    .map(([peerId, meta]) => {
      const lastReadAt = reads.find(r => r.userId === uid && r.peerId === peerId)?.lastReadAt || 0;
      const unread = all.filter(m => m.toUserId === uid && m.fromUserId === peerId && m.createdAt > lastReadAt).length;
      const u = users.find(u => u.id === peerId);
      const peer = u ? { id: u.id, nickname: u.nickname, gender: u.gender, avatarUrl: (u as any).avatarUrl } :
        (peerId === 'support' ? { id: 'support', nickname: '客服', gender: 'other', avatarUrl: '' } : { id: peerId, nickname: peerId, gender: 'other', avatarUrl: '' });
      return { peerId, lastAt: meta.lastAt, lastContent: meta.lastContent, peer, unread };
    })
    .sort((a, b) => b.lastAt - a.lastAt);
  res.json({ list });
});

// 标记某会话已读：将当前用户与 peer 的 lastReadAt 更新为当前时间
messagesRouter.post('/read', (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Unauthorized' });
  const { peerId } = req.body as { peerId: string };
  if (!peerId) return res.status(400).json({ error: 'Missing peerId' });
  const list = db.getReads();
  const idx = list.findIndex(r => r.userId === payload.uid && r.peerId === peerId);
  if (idx >= 0) list[idx].lastReadAt = Date.now();
  else list.push({ userId: payload.uid, peerId, lastReadAt: Date.now() });
  db.saveReads(list);
  res.json({ ok: true });
});

// Get conversation messages between current user and peer
messagesRouter.get('/:peerId', (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const payload = verifyToken(token);
  const peerId = req.params.peerId;
  // 游客仅允许访问与客服的对话（peerId === 'support'）
  if (!payload) {
    if (peerId !== 'support') return res.status(401).json({ error: 'Unauthorized' });
    const guestId = (req.headers['x-guest-id'] as string) || 'guest:anonymous';
    const uid = `guest:${guestId}`;
    const msgs = db.getMessages().filter(m =>
      (m.fromUserId === uid && m.toUserId === 'support') ||
      (m.fromUserId === 'support' && m.toUserId === uid)
    );
    return res.json(msgs);
  }
  const msgs = db.getMessages().filter(m =>
    (m.fromUserId === payload.uid && m.toUserId === peerId) ||
    (m.fromUserId === peerId && m.toUserId === payload.uid)
  );
  res.json(msgs);
});

// 游客发送客服消息（HTTP fallback）
messagesRouter.post('/guest/support', (req: Request, res: Response) => {
  const { guestId, content } = req.body as { guestId: string; content: string };
  const clean = typeof content === 'string' ? content.replace(/[ \u3000]+/g, '') : '';
  if (!guestId || !clean) return res.status(400).json({ error: 'Missing fields' });
  const uid = `guest:${guestId}`;
  const messages = db.getMessages();
  const msg = { id: nanoid(), fromUserId: uid, toUserId: 'support', content: clean, createdAt: Date.now() };
  messages.push(msg);
  db.saveMessages(messages);
  res.json(msg);
});

// Send message (HTTP fallback)
messagesRouter.post('/', (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Unauthorized' });
  const { toUserId, content } = req.body as { toUserId: string; content: string };
  const clean = typeof content === 'string' ? content.replace(/[ \u3000]+/g, '') : '';
  if (!toUserId || !clean) return res.status(400).json({ error: 'Missing fields' });
  const messages = db.getMessages();
  const msg = { id: nanoid(), fromUserId: payload.uid, toUserId, content: clean, createdAt: Date.now() };
  messages.push(msg);
  db.saveMessages(messages);
  res.json(msg);
});
