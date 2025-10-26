import { Router, Request, Response } from 'express';
import { verifyToken } from '../auth';
import { db } from '../store';
import { nanoid } from 'nanoid';
import { User, VisitRecord } from '../types';

export const visitsRouter = Router();

function auth(req: Request, res: Response){
  const token = req.headers.authorization?.replace('Bearer ', '') || '';
  const payload = verifyToken(token);
  if (!payload) { res.status(401).json({ error: 'Unauthorized' }); return null; }
  return payload.uid as string;
}

// POST /api/visits/:toUserId -> record a visit
visitsRouter.post('/:toUserId', (req, res) => {
  const uid = auth(req, res); if (!uid) return;
  const toUserId = req.params.toUserId;
  if (!toUserId || toUserId === uid) return res.json({ ok: true }); // 忽略自访
  const RETENTION_MS = 90 * 24 * 60 * 60 * 1000; // 90 天
  const now = Date.now();
  const startOfToday = (() => { const d = new Date(now); d.setHours(0,0,0,0); return d.getTime(); })();
  let visits = db.getVisits();
  // 保留期清理：丢弃超过 90 天记录
  const before = visits.length;
  visits = visits.filter(v => (now - v.createdAt) <= RETENTION_MS);
  if (visits.length !== before) db.saveVisits(visits);
  // 去重：同一访问者对同一目标当天只保留一条，若已有则更新时间
  const todayIdx = visits.findIndex(v => v.fromUserId === uid && v.toUserId === toUserId && v.createdAt >= startOfToday);
  if (todayIdx !== -1) {
    visits[todayIdx].createdAt = now;
    db.saveVisits(visits);
    return res.json({ ok: true, dedup: true });
  }
  visits.push({ id: nanoid(), fromUserId: uid, toUserId, createdAt: now });
  db.saveVisits(visits);
  res.json({ ok: true });
});

// GET /api/visits/list?type=whoSeeMe|meSeeWho&page=1&pageSize=20
visitsRouter.get('/list', (req, res) => {
  const uid = auth(req, res); if (!uid) return;
  const type = (req.query.type as string) === 'meSeeWho' ? 'meSeeWho' : 'whoSeeMe';
  const page = Math.max(parseInt(String(req.query.page||'1'),10)||1,1);
  const pageSize = Math.min(Math.max(parseInt(String(req.query.pageSize||'20'),10)||20,1),50);
  const RETENTION_MS = 90 * 24 * 60 * 60 * 1000; // 90 天
  const now = Date.now();
  let all = db.getVisits();
  // 保留期清理
  const before = all.length;
  all = all.filter(v => (now - v.createdAt) <= RETENTION_MS);
  if (all.length !== before) db.saveVisits(all);
  const list = all
    .filter(v => type==='whoSeeMe' ? v.toUserId === uid : v.fromUserId === uid)
    .sort((a,b)=> b.createdAt - a.createdAt);
  const total = list.length;
  const slice = list.slice((page-1)*pageSize, (page-1)*pageSize + pageSize);
  const users = db.getUsers();
  const ids = new Set<string>();
  slice.forEach(v => { ids.add(type==='whoSeeMe' ? v.fromUserId : v.toUserId) });
  const peers = Object.fromEntries(
    users.filter(u => ids.has(u.id)).map((u: User) => [u.id, { id:u.id, nickname:u.nickname, gender:(u as any).gender, avatarUrl:(u as any).avatarUrl }])
  );
  const items = slice.map(v => {
    const pid = type==='whoSeeMe' ? v.fromUserId : v.toUserId;
    return { user: peers[pid] || { id: pid, nickname: pid, gender: 'other', avatarUrl: '' }, createdAt: v.createdAt };
  });
  res.json({ list: items, total, page, pageSize });
});
