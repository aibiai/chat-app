import { Router } from 'express'
import { nanoid } from 'nanoid'
import { db } from '../store'
import { verifyToken } from '../auth'
import { approveReview, rejectReview } from '../services/reviewService'
import type { AvatarReviewRequest, ProfileReviewRequest, IdentityReviewRequest } from '../types'

export const reviewRouter = Router()

// auth middleware for HTTP routes
function auth(req: any, res: any, next: any) {
  const token = (req.headers.authorization || '').replace('Bearer ', '')
  const payload = verifyToken(token)
  if (!payload) return res.status(401).json({ error: 'Unauthorized' })
  req.uid = payload.uid
  next()
}

// 提交头像审核（此处仅保存一个占�?filePath，真实项目需�?multer 处理文件上传�?
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
  // 将提交的资料作为草稿立即保存在用户对象中，便于前端立即展�?
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

// 查询当前用户指定类型的最新审核状�?
reviewRouter.get('/status', auth, (req, res) => {
  const type = String((req.query.type || '').toString() as any)
  // 支持 avatar/profile/identity/confession 四类
  if (!type || !['avatar','profile','identity','confession'].includes(type)) {
    return res.status(400).json({ error: 'Invalid type' })
  }
  const list = db.getReviews()
  const uid = (req as any).uid
  const items = list.filter(r => r.userId === uid && r.type === type)
  if (!items.length) return res.json({ status: 'none' })
  const latest = items.sort((a, b) => b.createdAt - a.createdAt)[0]
  res.json({ status: latest.status, reviewedAt: latest.reviewedAt || null, reason: (latest as any).reason || '' })
})

// 管理员模拟接口（demo 环境保留以便测试）
reviewRouter.post('/:id/approve', (req, res) => {
  const id = req.params.id
  const result = approveReview(id)
  if (!result) return res.status(404).json({ error: 'Not found' })
  res.json({ ok: true })
})

reviewRouter.post('/:id/reject', (req, res) => {
  const id = req.params.id
  const { reason } = req.body as { reason?: string }
  const result = rejectReview(id, reason)
  if (!result) return res.status(404).json({ error: 'Not found' })
  res.json({ ok: true })
})
