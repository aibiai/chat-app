import { Router, Request, Response } from 'express';
import { verifyToken } from '../auth';
import { db } from '../store';
import { createCardRedeemRecord, saveRedeemImage } from '../services/cardRedeemService';

export const cardsRouter = Router();

function authMiddleware(req: Request, res: Response, next: Function) {
  const header = String(req.headers.authorization || '').trim();
  const token = header.startsWith('Bearer ') ? header.slice(7) : header;
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'UNAUTHORIZED' });
  (req as any).uid = (payload as any).uid;
  next();
}

cardsRouter.post('/redeem', authMiddleware, (req, res) => {
  const uid = (req as any).uid as string;
  const users = db.getUsers();
  const user = users.find((u) => u.id === uid);
  if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });

  const body = req.body as {
    images?: { name?: string; data: string }[];
    username?: string;
    email?: string;
    gender?: string;
    balance?: number;
  };

  const images = Array.isArray(body.images) ? body.images : [];
  if (!images.length || typeof images[0]?.data !== 'string' || !images[0].data.trim()) {
    return res.status(400).json({ error: 'IMAGE_REQUIRED' });
  }

  let imageUrl = '';
  const savedImages: string[] = [];
  try {
    // 兼容：首图保存为 imageUrl；同时最多保存 4 张到 images 数组
    for (let i = 0; i < Math.min(4, images.length); i += 1) {
      const saved = saveRedeemImage({ dataUrl: images[i].data, name: images[i].name });
      if (i === 0) imageUrl = saved;
      savedImages.push(saved);
    }
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: 'IMAGE_INVALID' });
  }

  const record = createCardRedeemRecord({
    userId: user.id,
    username: body.username || user.nickname || user.email || user.id,
    email: body.email || user.email,
    gender: body.gender || (user as any).gender,
    balance: Number.isFinite(body.balance) ? Number(body.balance) : Number((user as any).balance || 0),
    imageUrl,
    images: savedImages,
    note: undefined
  });

  return res.json({ ok: true, record });
});

// 查询当前用户最近一次点卡兑换的审核状态
cardsRouter.get('/redeem/status', authMiddleware, (req, res) => {
  const uid = (req as any).uid as string;
  const list = db.getCardRedeems();
  const items = list.filter((it) => it.userId === uid);
  if (!items.length) return res.json({ status: 'none' });
  // 最新一条
  const latest = items.sort((a, b) => b.uploadedAt - a.uploadedAt)[0];
  return res.json({
    status: latest.status,
    reviewedAt: latest.reviewedAt || null,
    note: latest.note || '',
    imageUrl: latest.imageUrl || '',
    images: Array.isArray(latest.images) && latest.images.length ? latest.images : (latest.imageUrl ? [latest.imageUrl] : [])
  });
});


