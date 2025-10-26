import { Router, Request, Response } from 'express';
import { db } from '../store';
import { verifyToken } from '../auth';

export const usersRouter = Router();

usersRouter.get('/', (req: Request, res: Response) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const payload = token ? verifyToken(token) : null;

  const all = db.getUsers();

  let filtered = all;
  if (payload) {
    const me = all.find(u => u.id === (payload as any).uid);
    const g = (me as any)?.gender as string | undefined;
    if (g === 'male' || g === 'female') {
      const want = g === 'male' ? 'female' : 'male';
      filtered = all.filter(u => u.id !== me?.id && (u as any).gender === want);
    } else {
      // 对于缺失/other 性别，维持原样（不过滤），以避免意外空列表
      filtered = all.filter(u => u.id !== me?.id);
    }
  }

  const users = filtered.map(u => ({ id: u.id, nickname: u.nickname, gender: (u as any).gender, avatarUrl: (u as any).avatarUrl, birthday: (u as any).birthday, popularity: (u as any).popularity || 0 }));
  res.json(users);
});

// auth middleware
function authMiddleware(req: Request, res: Response, next: Function) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const payload = token ? verifyToken(token) : null;
  if (!payload) return res.status(401).json({ error: 'Unauthorized' });
  (req as any).uid = payload.uid;
  next();
}

// get my profile
usersRouter.get('/me', authMiddleware, (req: Request, res: Response) => {
  const uid = (req as any).uid as string;
  const user = db.getUsers().find(u => u.id === uid);
  if (!user) return res.status(404).json({ error: 'Not found' });
  const { passwordHash, resetToken, resetExpires, ...publicUser } = user as any;
  // ensure balance always present
  if (publicUser.balance == null) publicUser.balance = 0;
  res.json(publicUser);
});

// update my profile
usersRouter.put('/me', authMiddleware, (req: Request, res: Response) => {
  const uid = (req as any).uid as string;
  const users = db.getUsers();
  const idx = users.findIndex(u => u.id === uid);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const allowed = ['nickname', 'gender', 'birthday', 'region', 'bio', 'interests', 'membershipLevel', 'membershipUntil', 'privateProfile', 'balance'] as const;
  const body = req.body || {};
  for (const k of allowed) {
    if (k in body) (users[idx] as any)[k] = body[k];
  }
  db.saveUsers(users);
  const { passwordHash, resetToken, resetExpires, ...publicUser } = users[idx] as any;
  res.json(publicUser);
});

// update any user's popularity (requires auth; in real app should require admin role)
usersRouter.put('/:id/popularity', authMiddleware, (req: Request, res: Response) => {
  const targetId = req.params.id;
  const { value } = req.body || {};
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0 || num > 1_000_000_000) {
    return res.status(400).json({ error: 'Invalid popularity value' });
  }
  const users = db.getUsers();
  const idx = users.findIndex(u => u.id === targetId);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  (users[idx] as any).popularity = Math.floor(num);
  db.saveUsers(users);
  return res.json({ id: targetId, popularity: (users[idx] as any).popularity });
});
