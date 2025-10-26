import { Router } from 'express';
import { nanoid } from 'nanoid';
import multer from 'multer';
import { join, extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { verifyToken } from '../auth';
import { db } from '../store';
import { GiftCatalogItem, GiftRecord, User } from '../types';

export const giftsRouter = Router();

// 目录持久化在 data/gifts_catalog.json
function getCatalog(): GiftCatalogItem[]{
  const list = db.getGiftCatalog();
  if (Array.isArray(list) && list.length) return list;
  // 若首次为空，注入默认演示项
  const demo: GiftCatalogItem[] = [
    { id: 'g1', name: '心动礼盒', price: 29, img: '/static/gifts/box.png' },
    { id: 'g2', name: '甜蜜鲜花', price: 39, img: '/static/gifts/flower.png' },
    { id: 'g3', name: '巧克力', price: 19, img: '/static/gifts/chocolate.png' },
    { id: 'g4', name: '幸运星', price: 9,  img: '/static/gifts/star.png' },
  ];
  db.saveGiftCatalog(demo);
  return demo;
}

// GET /api/gifts/catalog
giftsRouter.get('/catalog', (_req, res) => {
  res.json({ list: getCatalog() });
});

// POST /api/gifts/send  body: { toUserId, giftId }
giftsRouter.post('/send', (req, res) => {
  const auth = req.headers.authorization?.replace('Bearer ', '');
  const payload = verifyToken(auth);
  if (!payload) return res.status(401).json({ error: 'Unauthorized' });
  const { toUserId, giftId } = req.body as { toUserId: string; giftId: string };
  if (!toUserId || !giftId) return res.status(400).json({ error: 'Missing fields' });
  const catalog = getCatalog();
  const gift = catalog.find(g => g.id === giftId);
  if (!gift) return res.status(400).json({ error: 'Invalid giftId' });
  const gifts = db.getGifts();
  const record: GiftRecord = {
    id: nanoid(),
    fromUserId: payload.uid,
    toUserId,
    giftId: gift.id,
    giftName: gift.name,
    giftImg: gift.img,
    price: gift.price,
    createdAt: Date.now(),
  };
  gifts.push(record);
  db.saveGifts(gifts);
  res.json({ ok: true, record });
});

// GET /api/gifts/records?type=received|sent&page=1&pageSize=10
// returns { list, total, page, pageSize, peers: { userId: { id, nickname, gender } } }
giftsRouter.get('/records', (req, res) => {
  const auth = req.headers.authorization?.replace('Bearer ', '');
  const payload = verifyToken(auth);
  if (!payload) return res.status(401).json({ error: 'Unauthorized' });
  const type = (req.query.type as string) === 'sent' ? 'sent' : 'received';
  const page = Math.max(parseInt(String(req.query.page || '1'), 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(String(req.query.pageSize || '10'), 10) || 10, 1), 50);

  const all = db.getGifts();
  const filtered = all.filter(r => type === 'received' ? r.toUserId === payload.uid : r.fromUserId === payload.uid);
  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const list = filtered.sort((a,b)=> b.createdAt - a.createdAt).slice(start, start + pageSize);

  // build peers map
  const users = db.getUsers();
  const ids = new Set<string>();
  list.forEach(r => { ids.add(r.fromUserId); ids.add(r.toUserId); });
  const peers = Object.fromEntries(
    users
      .filter(u => ids.has(u.id))
      .map((u: User) => [u.id, { id: u.id, nickname: u.nickname, gender: u.gender }])
  );

  res.json({ list, total, page, pageSize, peers });
});

// ========== 管理端：上传礼物图片 & 维护礼物目录 ==========
// 简单的“管理员”判定：当前示例中，用户 email 以 admin@ 开头视为管理员
function isAdminUser(u: User | undefined | null){
  return !!u && typeof u.email === 'string' && /^admin@/i.test(u.email);
}

// 上传目录：data/static/gifts
const GIFTS_DIR = join(process.cwd(), 'data', 'static', 'gifts');
if (!existsSync(GIFTS_DIR)) mkdirSync(GIFTS_DIR, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, GIFTS_DIR),
    filename: (_req, file, cb) => {
      const id = nanoid(8);
      const ext = extname(file.originalname || '') || '.png';
      cb(null, `${id}${ext}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if ((file.mimetype || '').startsWith('image/')) return cb(null, true);
    return cb(new Error('Only image files are allowed'));
  }
});

// POST /api/gifts/upload  (admin)
// returns { ok, url }
giftsRouter.post('/upload', upload.single('file'), (req, res) => {
  const auth = req.headers.authorization?.replace('Bearer ', '');
  const payload = verifyToken(auth);
  const users = db.getUsers();
  const me = users.find(u => u.id === payload?.uid);
  if (!payload || !isAdminUser(me)) return res.status(401).json({ error: 'Unauthorized' });
  const file = (req as any).file as Express.Multer.File | undefined;
  if (!file) return res.status(400).json({ error: 'No file' });
  const url = `/static/gifts/${file.filename}`;
  res.json({ ok: true, url });
});

// POST /api/gifts/catalog  (admin) body: { name, price, img }
giftsRouter.post('/catalog', (req, res) => {
  const auth = req.headers.authorization?.replace('Bearer ', '');
  const payload = verifyToken(auth);
  const users = db.getUsers();
  const me = users.find(u => u.id === payload?.uid);
  if (!payload || !isAdminUser(me)) return res.status(401).json({ error: 'Unauthorized' });
  const { name, price, img } = req.body as Partial<GiftCatalogItem>;
  if (!name || typeof price !== 'number' || price < 0 || !img) return res.status(400).json({ error: 'Invalid fields' });
  const list = getCatalog();
  const item: GiftCatalogItem = { id: nanoid(10), name: String(name), price: Math.round(price), img: String(img) };
  db.saveGiftCatalog([item, ...list]);
  res.json({ ok: true, item });
});

// PUT /api/gifts/catalog/:id  (admin) body: { name?, price?, img? }
giftsRouter.put('/catalog/:id', (req, res) => {
  const auth = req.headers.authorization?.replace('Bearer ', '');
  const payload = verifyToken(auth);
  const users = db.getUsers();
  const me = users.find(u => u.id === payload?.uid);
  if (!payload || !isAdminUser(me)) return res.status(401).json({ error: 'Unauthorized' });
  const id = req.params.id;
  const list = getCatalog();
  const idx = list.findIndex(g => g.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const body = req.body as Partial<GiftCatalogItem>;
  const next = { ...list[idx] } as GiftCatalogItem;
  if (typeof body.name === 'string' && body.name) next.name = body.name;
  if (typeof body.price === 'number' && body.price >= 0) next.price = Math.round(body.price);
  if (typeof body.img === 'string' && body.img) next.img = body.img;
  list[idx] = next;
  db.saveGiftCatalog(list);
  res.json({ ok: true, item: next });
});

// DELETE /api/gifts/catalog/:id (admin)
giftsRouter.delete('/catalog/:id', (req, res) => {
  const auth = req.headers.authorization?.replace('Bearer ', '');
  const payload = verifyToken(auth);
  const users = db.getUsers();
  const me = users.find(u => u.id === payload?.uid);
  if (!payload || !isAdminUser(me)) return res.status(401).json({ error: 'Unauthorized' });
  const id = req.params.id;
  const list = getCatalog();
  const next = list.filter(g => g.id !== id);
  if (next.length === list.length) return res.status(404).json({ error: 'Not found' });
  db.saveGiftCatalog(next);
  res.json({ ok: true });
});
