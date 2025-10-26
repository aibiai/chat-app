import { Router } from 'express'
import { nanoid } from 'nanoid'
import { db } from '../store'
import { verifyToken } from '../auth'
import type { ReviewRequest, AvatarReviewRequest, ProfileReviewRequest, IdentityReviewRequest, User } from '../types'

export const reviewRouter = Router()

// auth middleware for HTTP routes
function auth(req: any, res: any, next: any) {
  const token = (req.headers.authorization || '').replace('Bearer ', '')
  const payload = verifyToken(token)
  if (!payload) return res.status(401).json({ error: 'Unauthorized' })
  req.uid = payload.uid
  next()
}

// 提交头像审核（此处仅保存一个占位 filePath，真实项目需用 multer 处理文件上传）
reviewRouter.post('/avatar', auth, (req, res) => {
  const { filePath } = req.body as { filePath: string }
  if (!filePath) return res.status(400).json({ error: 'Missing fields' })
  const list = db.getReviews()
  const item: AvatarReviewRequest = { id: nanoid(), userId: (req as any).uid, type: 'avatar', status: 'pending', createdAt: Date.now(), filePath }
  list.push(item)
  db.saveReviews(list)
  res.json({ ok: true, requestId: item.id, status: item.status })
})

// 提交身高/体重修改申请
reviewRouter.post('/profile', auth, (req, res) => {
  const { height, weight, nickname, birthday, weightRange, zodiac, education, maritalStatus } = req.body as { height?: number; weight?: number; nickname?: string; birthday?: string; weightRange?: [number, number]; zodiac?: string; education?: string; maritalStatus?: 'single'|'married' }
  if (height == null && weight == null && !nickname && !birthday && !weightRange && !zodiac && !education && !maritalStatus) return res.status(400).json({ error: 'Missing fields' })
  const list = db.getReviews()
  const item: ProfileReviewRequest = { id: nanoid(), userId: (req as any).uid, type: 'profile', status: 'pending', createdAt: Date.now(), payload: {} as any }
  if (height != null) (item.payload.height = Number(height))
  if (weight != null) (item.payload.weight = Number(weight))
  if (nickname) (item.payload.nickname = String(nickname))
  if (birthday) (item.payload.birthday = String(birthday))
  if (Array.isArray(weightRange) && weightRange.length === 2) (item.payload.weightRange = [Number(weightRange[0]), Number(weightRange[1])])
  if (zodiac) (item.payload.zodiac = String(zodiac))
  if (education) (item.payload.education = String(education))
  if (maritalStatus) (item.payload.maritalStatus = maritalStatus)
  list.push(item)
  db.saveReviews(list)
  // 将提交的资料作为草稿立即保存在用户对象中，便于前端立即展示
  try {
    const users = db.getUsers()
    const uidx = users.findIndex(u => u.id === (req as any).uid)
    if (uidx !== -1) {
      const draft: any = { ...(users[uidx] as any).profileDraft }
      for (const k of Object.keys(item.payload)) {
        (draft as any)[k] = (item.payload as any)[k]
      }
      ;(users[uidx] as any).profileDraft = draft
      db.saveUsers(users)
    }
  } catch {}
  res.json({ ok: true, requestId: item.id, status: item.status })
})

// 提交实名认证资料
reviewRouter.post('/identity', auth, (req, res) => {
  const { idFrontPath, idBackPath, selfiePath, realName } = req.body as { idFrontPath: string; idBackPath: string; selfiePath: string; realName?: string }
  if (!idFrontPath || !idBackPath || !selfiePath) return res.status(400).json({ error: 'Missing fields' })
  const list = db.getReviews()
  const item: IdentityReviewRequest = { id: nanoid(), userId: (req as any).uid, type: 'identity', status: 'pending', createdAt: Date.now(), idFrontPath, idBackPath, selfiePath }
  if (realName) (item as any).realName = String(realName)
  list.push(item)
  db.saveReviews(list)
  res.json({ ok: true, requestId: item.id, status: item.status })
})

// 查询当前用户指定类型的最新审核状态
reviewRouter.get('/status', auth, (req, res) => {
  const type = String((req.query.type || '').toString() as any)
  if (!type || !['avatar','profile','identity'].includes(type)) {
    return res.status(400).json({ error: 'Invalid type' })
  }
  const list = db.getReviews()
  const uid = (req as any).uid
  const items = list.filter(r => r.userId === uid && r.type === type)
  if (!items.length) return res.json({ status: 'none' })
  const latest = items.sort((a, b) => b.createdAt - a.createdAt)[0]
  res.json({ status: latest.status, reviewedAt: latest.reviewedAt || null, reason: (latest as any).reason || '' })
})

// 下面是管理员审核模拟接口：approve 或 reject
reviewRouter.post('/:id/approve', (req, res) => {
  const id = req.params.id
  const list = db.getReviews()
  const idx = list.findIndex(r => r.id === id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  const item = list[idx]
  item.status = 'approved'
  item.reviewedAt = Date.now()
  // 同步用户数据
  const users = db.getUsers()
  const uidx = users.findIndex(u => u.id === item.userId)
  if (uidx !== -1) {
    const user = users[uidx]
    if (item.type === 'avatar') {
      (user as User).avatarUrl = (item as any).filePath
    } else if (item.type === 'profile') {
      const p = (item as any).payload || {}
      if (p.height != null) (user as any).height = p.height
      if (p.weight != null) (user as any).weight = p.weight
      if (p.weightRange && Array.isArray(p.weightRange) && p.weightRange.length === 2) (user as any).weightRange = p.weightRange
      if (p.nickname) (user as any).nickname = p.nickname
      if (p.birthday) (user as any).birthday = p.birthday
      if (p.zodiac) (user as any).zodiac = p.zodiac
      if (p.education) (user as any).education = p.education
      if (p.maritalStatus) (user as any).maritalStatus = p.maritalStatus
      // 审核通过后清除草稿
      if ((user as any).profileDraft) delete (user as any).profileDraft
    } else if (item.type === 'identity') {
      (user as any).identityVerified = true
      if ((item as any).realName) (user as any).realName = (item as any).realName
    }
    db.saveUsers(users)
  }
  db.saveReviews(list)
  res.json({ ok: true })
})

reviewRouter.post('/:id/reject', (req, res) => {
  const id = req.params.id
  const { reason } = req.body as { reason?: string }
  const list = db.getReviews()
  const idx = list.findIndex(r => r.id === id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  list[idx].status = 'rejected'
  list[idx].reviewedAt = Date.now()
  list[idx].reason = reason || 'Rejected'
  db.saveReviews(list)
  res.json({ ok: true })
})
