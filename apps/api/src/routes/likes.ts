import { Router, Request, Response } from 'express';
import { verifyToken } from '../auth';
import { db } from '../store';
import { LikeRecord, User } from '../types';
import { nanoid } from 'nanoid';

export const likesRouter = Router();

function auth(req: Request, res: Response){
  const auth = req.headers.authorization?.replace('Bearer ', '');
  const payload = verifyToken(auth);
  if (!payload) { res.status(401).json({ error: 'Unauthorized' }); return null; }
  return payload.uid;
}

// POST /api/likes/:toUserId -> like
likesRouter.post('/:toUserId', (req, res) => {
  const uid = auth(req, res); if (!uid) return;
  const toUserId = req.params.toUserId;
  if (!toUserId || toUserId === uid) return res.status(400).json({ error: 'Invalid toUserId' });
  const likes = db.getLikes();
  const exists = likes.find(l => l.fromUserId === uid && l.toUserId === toUserId);
  if (exists) return res.json({ ok: true, id: exists.id });
  const rec: LikeRecord = { id: nanoid(), fromUserId: uid, toUserId, createdAt: Date.now() };
  likes.push(rec);
  db.saveLikes(likes);
  res.json({ ok: true, id: rec.id });
});

// DELETE /api/likes/:toUserId -> unlike
likesRouter.delete('/:toUserId', (req, res) => {
  const uid = auth(req, res); if (!uid) return;
  const toUserId = req.params.toUserId;
  let likes = db.getLikes();
  const before = likes.length;
  likes = likes.filter(l => !(l.fromUserId === uid && l.toUserId === toUserId));
  db.saveLikes(likes);
  res.json({ ok: true, removed: before - likes.length });
});

// GET /api/likes/list?type=likedMe|myLikes&page=1&pageSize=12
likesRouter.get('/list', (req, res) => {
  const uid = auth(req, res); if (!uid) return;
  const type = (req.query.type as string) === 'likedMe' ? 'likedMe' : 'myLikes';
  const page = Math.max(parseInt(String(req.query.page||'1'),10)||1,1);
  const pageSize = Math.min(Math.max(parseInt(String(req.query.pageSize||'12'),10)||12,1),50);
  const all = db.getLikes();
  const list = all.filter(l => type==='likedMe' ? l.toUserId === uid : l.fromUserId === uid)
                  .sort((a,b)=> b.createdAt - a.createdAt);
  const total = list.length;
  const slice = list.slice((page-1)*pageSize, (page-1)*pageSize + pageSize);
  const users = db.getUsers();
  const ids = new Set<string>();
  slice.forEach(l => { ids.add(type==='likedMe'? l.fromUserId : l.toUserId) })
  const peers = Object.fromEntries(
    users.filter(u => ids.has(u.id)).map((u: User) => [u.id, { id:u.id, nickname:u.nickname, gender:u.gender, avatarUrl:(u as any).avatarUrl }])
  );
  const items = slice.map(l => {
    const pid = type==='likedMe' ? l.fromUserId : l.toUserId;
    return { user: peers[pid] || { id: pid, nickname: pid, gender: 'other', avatarUrl: '' }, createdAt: l.createdAt };
  });
  res.json({ list: items, total, page, pageSize });
});

// GET /api/likes/status/:userId -> whether current user liked the target
likesRouter.get('/status/:userId', (req, res) => {
  const uid = auth(req, res); if (!uid) return;
  const targetId = req.params.userId;
  const likes = db.getLikes();
  const liked = likes.some(l => l.fromUserId === uid && l.toUserId === targetId);
  res.json({ liked });
});
