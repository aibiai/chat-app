import { Router, Request, Response } from 'express';
import { db } from '../store';
import { verifyToken } from '../auth';
import { processMembershipUpgrade } from '../services/membershipService';
import { emitToAdmins } from '../socketHub';
import { getQuickByUser, upsertQuickByUser } from '../services/quickTextService';
import { verifyAdminToken } from '../adminAuth';

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

  const users = filtered.map(u => ({
    id: u.id,
    nickname: u.nickname,
    gender: (u as any).gender,
    avatarUrl: (u as any).avatarUrl,
    birthday: (u as any).birthday,
    popularity: (u as any).popularity || 0,
    luckyStars: (u as any).luckyStars || 0,
  }));
  res.json(users);
});

// 单个用户公开信息（不受异性过滤影响），用于前端 Profile 页面精准获取人气与幸运星等字段
// GET /api/users/:id/public -> { id, nickname, gender, avatarUrl, birthday, popularity, luckyStars, membershipLevel? }
usersRouter.get('/:id/public', (req: Request, res: Response) => {
  const id = String(req.params.id || '').trim();
  if (!id) return res.status(400).json({ error: 'MISSING_ID' });
  const all = db.getUsers();
  const user = all.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: 'NOT_FOUND' });
  const view = {
    id: user.id,
    nickname: user.nickname,
    gender: (user as any).gender,
    avatarUrl: (user as any).avatarUrl,
    birthday: (user as any).birthday,
    popularity: (user as any).popularity || 0,
    luckyStars: (user as any).luckyStars || 0,
    membershipLevel: (user as any).membershipLevel || 'none'
  };
  res.json(view);
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

// GET /api/users/lookup?nickname=xxx  -> { id, nickname, gender }
// 鉴权后允许大小写不敏感匹配昵称，用于礼物商城按昵称送礼前校验
usersRouter.get('/lookup', authMiddleware, (req: Request, res: Response) => {
  const raw = String(req.query.nickname || '').trim();
  if (!raw) return res.status(400).json({ error: 'Nickname required' });
  const name = raw.toLowerCase();
  const users = db.getUsers();
  const target = users.find(u => (u.nickname || '').trim().toLowerCase() === name);
  if (!target) return res.status(404).json({ error: 'User not found' });
  const { id, nickname } = target as any;
  const gender = (target as any).gender;
  return res.json({ id, nickname, gender });
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
  try {
    if ('membershipLevel' in body || 'membershipUntil' in body) {
      const levelStr = String((users[idx] as any).membershipLevel || 'none');
      const levelNum = levelStr === 'crown' ? 2 : levelStr === 'purple' ? 1 : 0;
      const until = Number((users[idx] as any).membershipUntil || 0);
      const pad = (n: number) => String(n).padStart(2, '0');
      const format = (ts?: number) => {
        if (!ts || !Number.isFinite(ts)) return '—';
        const d = new Date(ts);
        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      };
      emitToAdmins('admin:member-updated', {
        id: users[idx].id,
        level: levelNum,
        crystalExpire: levelStr === 'purple' ? format(until) : '—',
        emperorExpire: levelStr === 'crown' ? format(until) : '—'
      });
    }
  } catch {}
  const { passwordHash, resetToken, resetExpires, ...publicUser } = users[idx] as any;
  res.json(publicUser);
});

// Quick text: 获取当前用户快捷短语配置（含开关）
// GET /api/users/me/quick-text -> { ok: true, data: { enabled, phrases, updatedAt } }
usersRouter.get('/me/quick-text', authMiddleware, (req: Request, res: Response) => {
  const uid = (req as any).uid as string;
  const cfg = getQuickByUser(uid);
  return res.json({ ok: true, data: { enabled: cfg.enabled, phrases: cfg.phrases, updatedAt: cfg.updatedAt } });
});

// Quick text: 用户自助保存（仅修改 phrases；enabled 由后台管理员控制时可忽略）
// PUT /api/users/me/quick-text { phrases?: string[] } -> { ok: true, data }
usersRouter.put('/me/quick-text', authMiddleware, (req: Request, res: Response) => {
  const uid = (req as any).uid as string;
  const body = req.body || {};
  const phrases = Array.isArray(body.phrases) ? body.phrases : undefined;
  const saved = upsertQuickByUser(uid, { phrases });
  return res.json({ ok: true, data: { enabled: saved.enabled, phrases: saved.phrases, updatedAt: saved.updatedAt } });
});

// Quick text: 管理员（或未来权限控制）启用/停用与设置内容
// PATCH /api/users/:id/quick-text { enabled?: boolean, phrases?: string[] }
// 为简单起见复用 authMiddleware（真实场景应有角色校验）
usersRouter.patch('/:id/quick-text', authMiddleware, (req: Request, res: Response) => {
  const targetId = req.params.id;
  const uid = (req as any).uid as string;
  if (targetId !== uid) {
    const header = String(req.headers.authorization || req.headers['x-admin-token'] || '').trim();
    const token = header.startsWith('Bearer ') ? header.slice(7) : header;
    const admin = verifyAdminToken(token);
    if (!admin) return res.status(403).json({ error: 'FORBIDDEN' });
  }
  const { enabled, phrases } = req.body || {};
  const patch: any = {};
  if (typeof enabled === 'boolean') patch.enabled = enabled;
  if (Array.isArray(phrases)) patch.phrases = phrases;
  const saved = upsertQuickByUser(targetId, patch);
  return res.json({ ok: true, data: { enabled: saved.enabled, phrases: saved.phrases, updatedAt: saved.updatedAt } });
});

usersRouter.post('/gift-membership', authMiddleware, (req: Request, res: Response) => {
  const name = typeof req.body?.nickname === 'string' ? req.body.nickname.trim() : '';
  if (!name) return res.status(400).json({ error: 'Nickname required' });
  const tier = req.body?.tier === 'crown' ? 'crown' : req.body?.tier === 'purple' ? 'purple' : null;
  if (!tier) return res.status(400).json({ error: 'Invalid tier' });
  const months = Number(req.body?.months);
  const amount = Number(req.body?.amount ?? req.body?.usd ?? months * 60);
  const method = String(req.body?.method || 'direct').trim() || 'direct';
  try {
    const result = processMembershipUpgrade({
      payerId: (req as any).uid,
      tier,
      months,
      amount,
      method,
      giftNickname: name
    });
    return res.json({
      ok: true,
      target: result.target,
      order: result.order
    });
  } catch (error) {
    const code = (error as any)?.code;
    if (code === 'USER_NOT_FOUND' || code === 'TARGET_NOT_FOUND') return res.status(404).json({ error: code });
    if (code === 'INVALID_MONTHS' || code === 'INVALID_TIER' || code === 'INVALID_AMOUNT') return res.status(400).json({ error: code });
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
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
