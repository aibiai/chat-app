import { Router } from 'express'
import multer from 'multer'
import { join, extname } from 'path'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { verifyAdminToken } from '../adminAuth'
import { nanoid } from 'nanoid'
import { db } from '../store'
import { verifyToken } from '../auth'
import type { ConfessionPost, ConfessionReviewRequest, User } from '../types'
import { ensureHeartWallFile, readHeartWall, saveHeartWall, assignUserHeartImage } from '../services/heartWallService'

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
  // 追加 heart wall 布局中的图片（便于前端兼容旧接口直接看到后台上传的心墙图片）
  let heartWall: string[] = []
  try {
    const hwRaw = readFileSync(join(process.cwd(), 'data', 'confession_heart_wall.json'), 'utf-8')
    const hwJson = JSON.parse(hwRaw)
    if (hwJson && Array.isArray(hwJson.cells)) {
      heartWall = hwJson.cells.map((c: any) => typeof c?.img === 'string' ? c.img : '').filter((s: string) => s)
    }
  } catch {}
  const images: string[] = []
  for (const p of posts){ if ((p as any)?.img) images.push(String((p as any).img)) }
  for (const s of sweet){ if (s) images.push(String(s)) }
  for (const h of heartWall){ images.push(String(h)) }
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

// POST /api/confession/submit { img, text } -> 创建一条待审核请求（需后台审核通过后才展示）
confessionRouter.post('/submit', auth, (req, res) => {
  const { img, text } = req.body as { img: string; text?: string }
  if (!img) return res.status(400).json({ error: 'Missing fields' })
  // 存入 reviews（沿用审核体系）
  const list = db.getReviews() as any[]
  const item: ConfessionReviewRequest = { id: nanoid(), userId: (req as any).uid, type: 'confession', status: 'pending', createdAt: Date.now(), img: String(img), text: String(text ?? '') }
  list.push(item)
  db.saveReviews(list as any)
  // 由后台审核流程决定是否通过。此处仅返回待审核状态
  return res.json({ ok: true, requestId: item.id, status: 'pending' })
})

// GET /api/confession/list -> 已审核通过的帖子
confessionRouter.get('/list', (_req, res) => {
  const list = db.getConfessions()
  // 最新在前
  res.json({ ok: true, list: list.sort((a,b)=> b.approvedAt! - a.approvedAt!) })
})

// 管理员审核通过接口（简化权限：email 以 admin@ 开头）
function isAdminUser(u: User | undefined | null){ return !!u && typeof u.email === 'string' && /^admin@/i.test(u.email) }
// 统一后台鉴权（支持普通用户管理员邮箱 + admin token）
function isPrivileged(req: any): boolean {
  const rawAuth = (req.headers.authorization || req.headers['x-admin-token'] || '') as string
  const token = rawAuth.replace(/^Bearer\s+/i, '')
  if (!token) return false
  const payload = verifyToken(token)
  if (payload) {
    const me = db.getUsers().find(u => u.id === payload?.uid)
    return isAdminUser(me)
  }
  // 尝试后台管理员 token（adminAuth）
  const admin = verifyAdminToken(token)
  return !!admin
}
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
  const assigned = assignUserHeartImage(post.img)
  res.json({ ok: true, post, heartAssigned: assigned })
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

// ========== Heart Wall 布局精细控制（后台专用） ==========
// 统一抽取到 services/heartWallService，供路由与后台审核复用
ensureHeartWallFile()

// GET /api/confession/heart/layout -> { ok, cells }
confessionRouter.get('/heart/layout', (_req, res) => {
  const { cells, meta } = readHeartWall()
  res.json({ ok: true, cells, meta })
})

// POST /api/confession/heart/layout/save { cells } （管理员）
confessionRouter.post('/heart/layout/save', (req, res) => {
  if (!isPrivileged(req)) return res.status(401).json({ error: 'Unauthorized' })
  const { cells } = req.body as { cells: any[] }
  if (!Array.isArray(cells)) return res.status(400).json({ error: 'Invalid cells' })
  // 轻度校验坐标与字段
  const existing = readHeartWall()
  const normalized: { id:string; x:number; y:number; type:'square'|'heart'; img:string|null; source?:'admin'|'user' }[] = cells.map((c,i)=> ({
    id: typeof c.id === 'string' && c.id ? c.id : `c${i}`,
    x: Number(c.x) || 0,
    y: Number(c.y) || 0,
    type: c.type === 'heart' ? 'heart' : 'square',
    img: typeof c.img === 'string' && c.img ? c.img : null,
    source: (typeof c.source === 'string' && (c.source === 'admin' || c.source === 'user')) ? c.source : existing.cells.find(ec=> ec.id === (typeof c.id === 'string' && c.id ? c.id : `c${i}`))?.source
  }))
  saveHeartWall({ cells: normalized, meta: existing.meta })
  res.json({ ok: true, count: normalized.length })
})

// 批量上传：POST /api/confession/heart/upload-batch (multipart/form-data)
// fields: files[], optional: positions=["c1","c2"] 指定填充到哪些 cell（按文件顺序对应）；未指定则填充空位
const HEART_DIR = join(process.cwd(), 'data', 'static', 'heartwall')
if (!existsSync(HEART_DIR)) mkdirSync(HEART_DIR, { recursive: true })
const heartUpload = multer({
  storage: multer.diskStorage({
    destination: (_req,_file,cb)=> cb(null, HEART_DIR),
    filename: (_req,file,cb)=> { const id = nanoid(10); const ext = extname(file.originalname||'') || '.jpg'; cb(null, `${id}${ext}`) }
  }),
  limits: { fileSize: 8*1024*1024 },
  fileFilter: (_req,file,cb)=> { if ((file.mimetype||'').startsWith('image/')) return cb(null,true); return cb(new Error('Only image files')) }
}).array('files', 50)

confessionRouter.post('/heart/upload-batch', (req, res) => {
  if (!isPrivileged(req)) return res.status(401).json({ error: 'Unauthorized' })
  heartUpload(req as any, res as any, (err: any) => {
    if (err) return res.status(400).json({ error: String(err?.message || err) })
    const files = (req as any).files as Express.Multer.File[] || []
    const positionsRaw = (req.body?.positions || '') as string
    let specifiedIds: string[] = []
    if (positionsRaw) {
      try {
        const parsed = JSON.parse(positionsRaw)
        if (Array.isArray(parsed)) {
          specifiedIds = parsed.filter((x:any)=> typeof x === 'string') as string[]
        }
      } catch {
        // ignore invalid positions payload to avoid 500
        specifiedIds = []
      }
    }
    const data = readHeartWall(); const cells = data.cells.slice()
    const emptyCells = cells.filter(c => !c.img)
    const updated: { id:string; url:string }[] = []
    let idx = 0
    for (const f of files){
      const url = `/static/heartwall/${f.filename}`
      let target: any
      if (specifiedIds[idx]){ target = cells.find(c=> c.id === specifiedIds[idx]) }
      if (!target){ target = emptyCells.shift() }
      if (!target){ break }
      target.img = url; (target as any).source = 'admin'; updated.push({ id: target.id, url })
      idx++
    }
    saveHeartWall({ cells, meta: data.meta })
    res.json({ ok: true, updated })
  })
})

// 批量删除：POST /api/confession/heart/delete { ids: string[] }
confessionRouter.post('/heart/delete', (req, res) => {
  if (!isPrivileged(req)) return res.status(401).json({ error: 'Unauthorized' })
  const { ids } = req.body as { ids: string[] }
  if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'Empty ids' })
  const data = readHeartWall();
  for (const id of ids){ const cell = data.cells.find(c=> c.id === id); if (cell){ cell.img = null; delete (cell as any).source } }
  saveHeartWall({ cells: data.cells, meta: data.meta })
  res.json({ ok: true, cleared: ids.length })
})
