import { Router } from 'express'
import multer from 'multer'
import { join, extname } from 'path'
import { existsSync, mkdirSync } from 'fs'
import { nanoid } from 'nanoid'
import { db } from '../store'
import { verifyToken } from '../auth'
import type { ConfessionPost, ConfessionReviewRequest, User } from '../types'

export const confessionRouter = Router()

// 登录校验
function auth(req: any, res: any, next: any){
  const token = (req.headers.authorization || '').replace('Bearer ', '')
  const payload = verifyToken(token)
  if (!payload) return res.status(401).json({ error: 'Unauthorized' })
  req.uid = payload.uid
  next()
}

// 上传目录：表白审核图片
const DIR = join(process.cwd(), 'data', 'static', 'confess')
if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true })
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, DIR),
    filename: (_req, file, cb) => {
      const id = nanoid(10); const ext = extname(file.originalname || '') || '.jpg'
      cb(null, `${id}${ext}`)
    }
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if ((file.mimetype || '').startsWith('image/')) return cb(null, true)
    return cb(new Error('Only image files are allowed'))
  }
})

// POST /api/confession/upload  -> { ok, url }
confessionRouter.post('/upload', auth, upload.single('file'), (req, res) => {
  const file = (req as any).file as Express.Multer.File | undefined
  if (!file) return res.status(400).json({ error: 'No file' })
  const url = `/static/confess/${file.filename}`
  res.json({ ok: true, url })
})

// ========== 甜蜜时刻（Sweet Moments）图库 ==========
// 目录 /static/sweet
const SWEET_DIR = join(process.cwd(), 'data', 'static', 'sweet')
if (!existsSync(SWEET_DIR)) mkdirSync(SWEET_DIR, { recursive: true })
const sweetUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, SWEET_DIR),
    filename: (_req, file, cb) => { const id = nanoid(10); const ext = extname(file.originalname || '') || '.jpg'; cb(null, `${id}${ext}`) }
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => { if ((file.mimetype || '').startsWith('image/')) return cb(null, true); return cb(new Error('Only image files are allowed')) }
})

// GET /api/confession/sweet/list  -> { ok, list: string[] }
confessionRouter.get('/sweet/list', (_req, res) => {
  res.json({ ok: true, list: db.getSweetGallery() })
})

// POST /api/confession/sweet/upload  (admin only)
confessionRouter.post('/sweet/upload', (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '')
  const payload = verifyToken(token)
  const me = db.getUsers().find(u => u.id === payload?.uid)
  if (!payload || !isAdminUser(me)) return res.status(401).json({ error: 'Unauthorized' })
  sweetUpload.single('file')(req as any, res as any, (err: any) => {
    if (err) return res.status(400).json({ error: String(err?.message || err) })
    const file = (req as any).file as Express.Multer.File | undefined
    if (!file) return res.status(400).json({ error: 'No file' })
    const url = `/static/sweet/${file.filename}`
    const list = db.getSweetGallery(); list.push(url); db.saveSweetGallery(list)
    res.json({ ok: true, url })
  })
})

// ========== Heart Wall 统一接口（供前端心形网格与上升心形使用） ==========
// GET /api/confession/heart/images?limit=90 -> { ok, images: string[] }
confessionRouter.get('/heart/images', (req, res) => {
  const limit = Math.max(1, Math.min(200, parseInt(String((req.query as any).limit ?? '90')) || 90))
  const posts = db.getConfessions()
  const sweet = db.getSweetGallery()
  const images: string[] = []
  for (const p of posts){ if ((p as any)?.img) images.push(String((p as any).img)) }
  for (const s of sweet){ if (s) images.push(String(s)) }
  res.json({ ok: true, images: images.slice(0, limit) })
})

// POST /api/confession/heart/upload  -> 复用 sweet 上传（admin only）
confessionRouter.post('/heart/upload', (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '')
  const payload = verifyToken(token)
  const me = db.getUsers().find(u => u.id === payload?.uid)
  if (!payload || !isAdminUser(me)) return res.status(401).json({ error: 'Unauthorized' })
  sweetUpload.single('file')(req as any, res as any, (err: any) => {
    if (err) return res.status(400).json({ error: String(err?.message || err) })
    const file = (req as any).file as Express.Multer.File | undefined
    if (!file) return res.status(400).json({ error: 'No file' })
    const url = `/static/sweet/${file.filename}`
    const list = db.getSweetGallery(); list.push(url); db.saveSweetGallery(list)
    res.json({ ok: true, url })
  })
})

// POST /api/confession/submit { img, text } -> 创建一条待审核请求
confessionRouter.post('/submit', auth, (req, res) => {
  const { img, text } = req.body as { img: string; text?: string }
  if (!img) return res.status(400).json({ error: 'Missing fields' })
  // 存入 reviews（沿用审核体系）
  const list = db.getReviews() as any[]
  const item: ConfessionReviewRequest = { id: nanoid(), userId: (req as any).uid, type: 'confession', status: 'pending', createdAt: Date.now(), img: String(img), text: String(text ?? '') }
  list.push(item)
  db.saveReviews(list as any)
  // 模拟后端自动审核：基础校验通过后立即批准并发布
  try{
    // 简单内容安全检查（示例，可按需扩展）
    if (!/^\/(static\/confess|static\/sweet)\//.test(item.img)){
      return res.status(400).json({ error: 'Invalid image path' })
    }
    // 标记审核通过
    item.status = 'approved'; (item as any).reviewedAt = Date.now()
    db.saveReviews(list as any)
    // 入库公开列表
    const posts = db.getConfessions()
    const post: ConfessionPost = { id: nanoid(), userId: item.userId, img: item.img, text: item.text, createdAt: Date.now(), approvedAt: Date.now() }
    posts.unshift(post)
    db.saveConfessions(posts)
    return res.json({ ok: true, requestId: item.id, status: 'approved', post })
  }catch(e:any){
    return res.status(500).json({ error: 'Approve failed' })
  }
})

// GET /api/confession/list -> 已审核通过的帖子
confessionRouter.get('/list', (_req, res) => {
  const list = db.getConfessions()
  // 最新在前
  res.json({ ok: true, list: list.sort((a,b)=> b.approvedAt! - a.approvedAt!) })
})

// 管理员审核通过接口（简化权限：email 以 admin@ 开头）
function isAdminUser(u: User | undefined | null){ return !!u && typeof u.email === 'string' && /^admin@/i.test(u.email) }
confessionRouter.post('/:id/approve', (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '')
  const payload = verifyToken(token)
  const me = db.getUsers().find(u => u.id === payload?.uid)
  if (!payload || !isAdminUser(me)) return res.status(401).json({ error: 'Unauthorized' })
  const id = req.params.id
  const reviews = db.getReviews() as any[]
  const idx = reviews.findIndex(r => r.id === id && r.type === 'confession')
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  const r = reviews[idx] as ConfessionReviewRequest
  r.status = 'approved'; (r as any).reviewedAt = Date.now()
  db.saveReviews(reviews as any)
  // 入库公开列表
  const posts = db.getConfessions()
  const post: ConfessionPost = { id: nanoid(), userId: r.userId, img: r.img, text: r.text, createdAt: Date.now(), approvedAt: Date.now() }
  posts.unshift(post)
  db.saveConfessions(posts)
  res.json({ ok: true, post })
})

// 管理员驳回
confessionRouter.post('/:id/reject', (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '')
  const payload = verifyToken(token)
  const me = db.getUsers().find(u => u.id === payload?.uid)
  if (!payload || !isAdminUser(me)) return res.status(401).json({ error: 'Unauthorized' })
  const id = req.params.id
  const { reason } = req.body as { reason?: string }
  const reviews = db.getReviews() as any[]
  const idx = reviews.findIndex(r => r.id === id && r.type === 'confession')
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  reviews[idx].status = 'rejected'; (reviews[idx] as any).reviewedAt = Date.now(); (reviews[idx] as any).reason = reason || 'Rejected'
  db.saveReviews(reviews as any)
  res.json({ ok: true })
})
