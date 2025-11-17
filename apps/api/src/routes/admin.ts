import { Router } from 'express';
import { sify, tify } from 'chinese-conv';
import { franc } from 'franc-min';
import multer from 'multer';
import { ensureDefaultAdmin, ensureDefaultRolesIntegrity, ensureSuperAdminBinding, verifyAdminCredentials, listAdmins, listRoles, collectAdminPermissions, createRole, updateRole, deleteRoles, createAdmin, updateAdmin, recoverDefaultRoles, listAdminLogs, appendAdminLog, deleteAdminLogs, listAdminRules, createAdminRule, updateAdminRule, deleteAdminRules } from '../adminStore';
import { requirePermission, requireAnyPermission } from '../middleware/permissions';
import { signAdminToken, verifyAdminToken } from '../adminAuth';
import { db } from '../store';
import { getQuickByUser, upsertQuickByUser } from '../services/quickTextService';
import { listReviews, approveReview, rejectReview, deleteReviews } from '../services/reviewService';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';
import { User } from '../types';
// --- Orders & Coins services (新增) ---
import { listOrders, deleteOrders } from '../services/orderService';
import { listCardRedeems, updateCardRedeemStatus, deleteCardRedeems } from '../services/cardRedeemService';
import { emitToAdmins } from '../socketHub';
import { listCoinConsumptions, deleteCoinConsumptions } from '../services/coinConsumptionService';
import { getAutoReplyConfig, saveAutoReplyConfig } from '../services/autoReplyService';
// 新增：聊天背景管理所需（读写 data/ui.json）
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

export const adminRouter = Router();
// 默认头像（API 静态资源目录 data/static 映射到 /static；性别区分 PNG 目录 /web-avatars）
const DEFAULT_AVATAR_FEMALE = '/web-avatars/IMG_0819.PNG';
const DEFAULT_AVATAR_MALE = '/web-avatars/IMG_0820.PNG';
const DEFAULT_AVATAR_OTHER = '/static/defaults/avatar-default.svg';
function writeAdminLog(req: any, title: string) {
  try {
    const ua = String(req.headers['user-agent'] || '');
    const actor = (req as any).admin?.username || 'admin';
    const ip = String((req as any).ip || req.socket?.remoteAddress || '').replace('::ffff:', '') || '';
    appendAdminLog({ username: actor, title, url: req.originalUrl || req.url || '', ip, browser: ua });
  } catch {}
}

const TRANSLATE_TARGETS = ['zh-CN', 'zh-TW', 'en', 'ko', 'ja'] as const;
// 主翻译端点与备用端点：支持通过环境变量配置多个，用逗号或空格分隔
const LIBRE_ENDPOINT = process.env.LIBRE_TRANSLATE_URL || '';
const LIBRE_ENDPOINTS_RAW = process.env.LIBRE_TRANSLATE_URLS || '';
const LIBRE_API_KEY = process.env.LIBRE_TRANSLATE_API_KEY || '';
const FALLBACK_ENDPOINTS = [
  'https://translate.astian.org/translate',
  'https://libretranslate.com/translate',
  'https://translate.argosopentech.com/translate',
  'https://translate.terraprint.co/translate'
];
const CONFIGURED_ENDPOINTS = [LIBRE_ENDPOINT, ...LIBRE_ENDPOINTS_RAW.split(/[\s,]+/)].filter(e => !!e);
const LIBRE_ENDPOINTS = (CONFIGURED_ENDPOINTS.length ? CONFIGURED_ENDPOINTS : FALLBACK_ENDPOINTS).filter((v,i,a)=> a.indexOf(v)===i);
type TranslateTarget = (typeof TRANSLATE_TARGETS)[number];

const MAP_SIMPLIFIED_TO_TRADITIONAL: Record<string, string> = {
  '\u6c49': '\u6f22',
  '\u9a6c': '\u99ac',
  '\u95e8': '\u9580',
  '\u4e1c': '\u6771',
  '\u56fd': '\u570b',
  '\u53d1': '\u767c',
  '\u4e91': '\u96f2',
  '\u9f99': '\u9f8d',
  '\u7231': '\u611b',
  '\u6c14': '\u6c23',
  '\u53f0': '\u81fa',
  '\u4e07': '\u842c'
};
const MAP_TRADITIONAL_TO_SIMPLIFIED: Record<string, string> = Object.entries(MAP_SIMPLIFIED_TO_TRADITIONAL).reduce(
  (acc, [simplified, traditional]) => {
    acc[traditional] = simplified;
    return acc;
  },
  {} as Record<string, string>
);

// 统一空日期占位。也可以按你的前端约定改成 ''。
const EMPTY_DATE_LABEL = '—';

const LEVEL_TO_NUMBER: Record<'none' | 'purple' | 'crown', number> = {
  none: 0,
  purple: 1,
  crown: 2
};

const NUMBER_TO_LEVEL: Record<number, 'none' | 'purple' | 'crown'> = {
  0: 'none',
  1: 'purple',
  2: 'crown'
};

const pad2 = (num: number) => num.toString().padStart(2, '0');

function formatTimestamp(value?: number | string | null): string {
  if (value == null || value === '') return EMPTY_DATE_LABEL;
  const timestamp =
    typeof value === 'number'
      ? value
      : (() => {
          const normalized = value.includes('T') ? value : value.replace(' ', 'T');
          const v = normalized.length === 16 ? `${normalized}:00` : normalized;
          const parsed = Date.parse(v);
          return Number.isNaN(parsed) ? NaN : parsed;
        })();
  if (Number.isNaN(timestamp)) {
    return typeof value === 'string' ? value : EMPTY_DATE_LABEL;
  }
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(
    date.getMinutes()
  )}:${pad2(date.getSeconds())}`;
}

function parseDateInput(value?: string | number | null): number | undefined {
  if (value == null) return undefined;
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  const trimmed = String(value).trim();
  if (!trimmed || trimmed === EMPTY_DATE_LABEL) return undefined;
  const normalized = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T');
  const withSeconds = normalized.length === 16 ? `${normalized}:00` : normalized;
  const parsed = Date.parse(withSeconds);
  if (Number.isNaN(parsed)) return undefined;
  return parsed;
}

function normalizeDateString(value?: string): string {
  if (typeof value !== 'string' || !value.trim()) return '';
  const parsed = parseDateInput(value);
  return parsed ? formatTimestamp(parsed) : value.trim();
}

function toGenderLabel(value?: User['gender'] | string): string {
  const raw = (value ?? '').toString().trim();
  const lower = raw.toLowerCase();
  if (['male', 'm'].includes(lower) || raw === '男') return '男';
  if (['female', 'f'].includes(lower) || raw === '女') return '女';
  return '未知';
}

function normalizeGenderValue(value?: string): User['gender'] {
  const raw = (value ?? '').toString().trim();
  const lower = raw.toLowerCase();
  if (['male', 'm', 'man', 'boy'].includes(lower) || raw === '男') return 'male';
  if (['female', 'f', 'woman', 'girl'].includes(lower) || raw === '女') return 'female';
  return 'other';
}

function applyMemberMeta(user: User, payload: Record<string, unknown>) {
  const extra = user as any;
  if (typeof payload.username === 'string' && payload.username.trim()) extra.username = payload.username.trim();
  if (typeof payload.owner === 'string' && payload.owner.trim()) {
    extra.owner = payload.owner.trim();
  } else if (!extra.owner) {
    extra.owner = '系统';
  }
  if (typeof payload.nickname === 'string' && payload.nickname.trim()) user.nickname = payload.nickname.trim();
  if (typeof payload.email === 'string' && payload.email.trim()) user.email = payload.email.trim();
  if (typeof payload.gender === 'string' && payload.gender.trim()) {
    user.gender = normalizeGenderValue(payload.gender);
  }
  if (typeof payload.birthday === 'string') {
    user.birthday = payload.birthday;
  }
  if (payload.points !== undefined) {
    const numeric = Number(payload.points);
    user.balance = Number.isFinite(numeric) ? numeric : 0;
  }
  if (typeof payload.avatar === 'string' && payload.avatar.trim()) {
    const link = payload.avatar.trim();
    extra.avatar = link;
    user.avatarUrl = link;
  }
  if (typeof payload.status === 'string' && payload.status.trim()) extra.status = payload.status.trim();
  if (payload.lastLogin !== undefined) {
    extra.lastLogin = typeof payload.lastLogin === 'string' ? normalizeDateString(payload.lastLogin) : EMPTY_DATE_LABEL;
  }
  if (payload.lastIp !== undefined) extra.lastIp = String(payload.lastIp || '');
  if (payload.joinedAt !== undefined) {
    const str = typeof payload.joinedAt === 'string' ? normalizeDateString(payload.joinedAt) : '';
    extra.joinedAt = str || formatTimestamp(Date.now());
  } else if (!extra.joinedAt) {
    extra.joinedAt = formatTimestamp(Date.now());
  }
  if (payload.joinIp !== undefined) extra.joinIp = String(payload.joinIp || '');
  if (payload.remark !== undefined) extra.remark = String(payload.remark || '');
  if (payload.online !== undefined) extra.online = Boolean(payload.online);
  if (payload.hidden !== undefined) extra.hidden = Boolean(payload.hidden);
  if (payload.muted !== undefined) extra.muted = Boolean(payload.muted);
  if (payload.crystalExpire !== undefined) extra.crystalExpire = normalizeDateString(payload.crystalExpire as string);
  if (payload.emperorExpire !== undefined) extra.emperorExpire = normalizeDateString(payload.emperorExpire as string);
  const levelValue =
    payload.level !== undefined
      ? Number(payload.level)
      : extra.level !== undefined
        ? Number(extra.level)
        : LEVEL_TO_NUMBER[user.membershipLevel || 'none'];
  if (!Number.isNaN(levelValue)) {
    extra.level = levelValue;
    if (levelValue <= 0) {
      user.membershipLevel = 'none';
      delete (user as any).membershipUntil;
    } else {
      user.membershipLevel = NUMBER_TO_LEVEL[levelValue] || 'none';
      const expireSource = levelValue === 2 ? extra.emperorExpire : extra.crystalExpire;
      const parsed = parseDateInput(expireSource);
      if (parsed) {
        user.membershipUntil = parsed;
      } else {
        delete (user as any).membershipUntil;
      }
    }
  }
}

function toMemberView(user: User) {
  const extra = user as any;
  // 优先依据主记录的 membershipLevel 计算等级；仅在缺失时回退到旧的 extra.level
  let levelNumber = LEVEL_TO_NUMBER[user.membershipLevel || 'none'];
  if (!user.membershipLevel && extra.level !== undefined) {
    const candidate = Number(extra.level);
    levelNumber = Number.isFinite(candidate) ? candidate : 0;
  }
  const crystalExpire =
    extra.crystalExpire ||
    (user.membershipLevel === 'purple' ? formatTimestamp(user.membershipUntil) : '') ||
    EMPTY_DATE_LABEL;
  const emperorExpire =
    extra.emperorExpire ||
    (user.membershipLevel === 'crown' ? formatTimestamp(user.membershipUntil) : '') ||
    EMPTY_DATE_LABEL;

  return {
    id: user.id,
    owner: extra.owner || '系统',
    username: extra.username || user.email?.split('@')[0] || user.id,
    nickname: user.nickname,
    email: user.email,
    avatar: extra.avatar || user.avatarUrl || '',
    level: Number.isNaN(levelNumber) ? 0 : levelNumber,
    // 为兼容旧前端，保留 points；新增 balance 字段（与用户主记录 balance 同步）
    balance: Number(user.balance || 0),
    points: Number(user.balance || 0),
    gender: toGenderLabel(user.gender),
    crystalExpire: crystalExpire || EMPTY_DATE_LABEL,
    emperorExpire: emperorExpire || EMPTY_DATE_LABEL,
    lastLogin: extra.lastLogin || EMPTY_DATE_LABEL,
    lastIp: extra.lastIp || '0.0.0.0',
    online: Boolean(extra.online),
    hidden: Boolean(extra.hidden),
    muted: Boolean(extra.muted),
    joinedAt: extra.joinedAt || EMPTY_DATE_LABEL,
    joinIp: extra.joinIp || '0.0.0.0',
    status: extra.status || 'active',
    birthday: user.birthday || '',
    remark: extra.remark || ''
  };
}

// 语言检测缓存（避免重复计算）
const DETECT_CACHE = new Map<string, string>();
function guessSource(q: string): string {
  const text = (q || '').trim();
  if (!text) return 'auto';
  const key = text.length > 80 ? text.slice(0,80) : text; // 限制键长度
  const cached = DETECT_CACHE.get(key); if (cached) return cached;
  // 极短文本直接用简单规则
  if (text.length < 3) {
    const ruleShort = /[\u4e00-\u9fa5]/.test(text) ? 'zh' : /^[A-Za-z0-9]+$/.test(text) ? 'en' : 'auto';
    DETECT_CACHE.set(key, ruleShort); return ruleShort;
  }
  // 使用 franc-min 检测
  let lang3 = 'und';
  try { lang3 = franc(text, { minLength: 3 }); } catch {}
  let code = 'auto';
  if (lang3 && lang3 !== 'und') {
    // 映射常用 639-3 -> 我们的翻译源代码
    if (lang3 === 'eng') code = 'en';
    else if (['cmn','zho','yue','wuu','gan','lzh'].includes(lang3)) code = 'zh';
    else if (lang3 === 'jpn') code = 'ja';
    else if (lang3 === 'kor') code = 'ko';
  } else {
    // 回退简单规则
    if (/^[A-Za-z0-9\s\p{Punctuation}]+$/u.test(text)) code = 'en';
    else if (/[\u4e00-\u9fa5]/.test(text)) code = 'zh';
  }
  DETECT_CACHE.set(key, code);
  // 控制缓存大小
  if (DETECT_CACHE.size > 2000) {
    const it = DETECT_CACHE.keys();
    for (let i=0; i<500; i++){ const n = it.next(); if(n.done) break; DETECT_CACHE.delete(n.value); }
  }
  return code;
}

// ---------------- 多源翻译实现（扩展） ----------------
// 说明：保持原有 LibreTranslate 逻辑，增加 Lingva 与 MyMemory 作为后备；并提供内存缓存与 provider 标记
// 环境变量：
//   ENABLE_LINGVA=true|false        是否启用 Lingva 代理 (默认 true)
//   LINGVA_API_BASE=https://lingva.ml  Lingva 基础地址
//   ENABLE_MYMEMORY=true|false      是否启用 MyMemory (默认 true)
//   TRANSLATE_CACHE_LIMIT=500       缓存最大条目
const ENABLE_LINGVA = (process.env.ENABLE_LINGVA || 'true').toLowerCase() === 'true';
const ENABLE_MYMEMORY = (process.env.ENABLE_MYMEMORY || 'true').toLowerCase() === 'true';
const LINGVA_API_BASE = (process.env.LINGVA_API_BASE || 'https://lingva.ml').replace(/\/$/, '');
const TRANSLATE_CACHE_LIMIT = Math.max(50, Math.min(5000, Number(process.env.TRANSLATE_CACHE_LIMIT || 500) || 500));
const _translateCache: Map<string, { text: string; provider: string; at: number }> = new Map();

function cacheGet(key: string){ const v = _translateCache.get(key); return v ? { ...v, cached: true } : null; }
function cacheSet(key: string, value: { text: string; provider: string }) {
  const at = Date.now();
  _translateCache.set(key, { ...value, at });
  if (_translateCache.size > TRANSLATE_CACHE_LIMIT) {
    // 简单删除最老的 10% 以控制大小
    const entries = Array.from(_translateCache.entries()).sort((a,b)=> a[1].at - b[1].at);
    const removeCount = Math.ceil(entries.length * 0.1);
    for (let i=0;i<removeCount;i++){ _translateCache.delete(entries[i][0]); }
  }
}

async function libreTranslate(original: string, target: TranslateTarget, sourceHint?: string): Promise<{ text: string; provider: string; source?: string }> {
  const q = (original ?? '').trim();
  if (!q) return { text: '', provider: 'none' };
  const tgt = target === 'zh-CN' || target === 'zh-TW' ? 'zh' : target;
  const endpoints = LIBRE_ENDPOINTS.slice();
  let lastError: any = null;
  for (let i = 0; i < endpoints.length; i++) {
    const ep = endpoints[i];
    // 首次用 auto 源语言；若得到的结果与原文相同，再尝试使用猜测的源语言重新请求
  const g = sourceHint && sourceHint !== 'auto' ? sourceHint : guessSource(q);
  const sourcesToTry = g && g !== 'auto' ? ['auto', g] : ['auto'];
    for (const source of sourcesToTry) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      try {
        const body: any = { q, source, target: tgt, format: 'text' };
        if (LIBRE_API_KEY) body.api_key = LIBRE_API_KEY;
        const resp = await fetch(ep, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal
        });
        clearTimeout(timeout);
        if (!resp.ok) { lastError = new Error('HTTP ' + resp.status); continue; }
        const data: any = await resp.json();
        let t = data?.translatedText || data?.translation || data?.data?.translatedText || '';
        if (typeof t === 'string') t = t.trim();
        if (!t) { lastError = new Error('EMPTY_TRANSLATION'); continue; }
        if (t === q) { // 结果与原文一致，视为失败，尝试下一种源语言或端点
          lastError = new Error('UNCHANGED');
          continue;
        }
        // 若目标为繁体中文且源语言不是中文，先获得简体中文，再转换为繁体
        if (target === 'zh-TW' && guessSource(q) !== 'zh') {
          try {
            const converted = tify(t);
            return { text: converted, provider: 'libre+tify', source: source };
          } catch {
            // 转换失败则仍返回简体结果
            return { text: t, provider: 'libre', source: source };
          }
        }
        return { text: t, provider: 'libre', source: source };
      } catch (e) {
        clearTimeout(timeout);
        lastError = e;
        continue;
      }
    }
  }
  // 所有端点失败：返回占位
  return { text: `[${target.toUpperCase()}] ${q}` , provider: 'libre-fallback', source: 'auto' };
}

async function lingvaTranslate(original: string, target: TranslateTarget): Promise<{ text: string; provider: string } | null> {
  if (!ENABLE_LINGVA) return null;
  const q = (original ?? '').trim(); if (!q) return null;
  const tgt = target === 'zh-CN' || target === 'zh-TW' ? 'zh' : target;
  const src = guessSource(q) === 'auto' ? 'auto' : guessSource(q);
  const controller = new AbortController(); const timeout = setTimeout(()=> controller.abort(), 6000);
  try {
    const url = `${LINGVA_API_BASE}/api/v1/${encodeURIComponent(src)}/${encodeURIComponent(tgt)}/${encodeURIComponent(q)}`;
    const resp = await fetch(url, { headers: { 'Accept':'application/json' }, signal: controller.signal });
    clearTimeout(timeout);
    if (!resp.ok) return null;
    const data: any = await resp.json();
    let t = data?.translation || data?.translatedText || '';
    if (typeof t === 'string') t = t.trim();
    if (!t || t === q) return null;
    if (target === 'zh-TW' && src !== 'zh') {
      try { t = tify(t); return { text: t, provider: 'lingva+tify' }; } catch { /* ignore */ }
    }
    return { text: t, provider: 'lingva' };
  } catch { clearTimeout(timeout); return null; }
}

async function myMemoryTranslate(original: string, target: TranslateTarget): Promise<{ text: string; provider: string } | null> {
  if (!ENABLE_MYMEMORY) return null;
  const q = (original ?? '').trim(); if (!q) return null;
  // MyMemory 语言对：使用简化的 zh (不区分)；若源语言猜测为中文则源 zh；否则使用猜测或 en
  const tgt = target === 'zh-CN' || target === 'zh-TW' ? 'zh' : target;
  let src = guessSource(q); if (src === 'auto') src = 'en'; if (src === 'zh') src = 'zh';
  const controller = new AbortController(); const timeout = setTimeout(()=> controller.abort(), 6000);
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=${encodeURIComponent(src)}|${encodeURIComponent(tgt)}`;
    const resp = await fetch(url, { headers: { 'Accept':'application/json' }, signal: controller.signal });
    clearTimeout(timeout);
    if (!resp.ok) return null;
    const data: any = await resp.json();
    let t = data?.responseData?.translatedText || '';
    if (typeof t === 'string') t = t.trim();
    if (!t || t === q) return null;
    if (target === 'zh-TW' && src !== 'zh') {
      try { t = tify(t); return { text: t, provider: 'mymemory+tify' }; } catch { /* ignore */ }
    }
    return { text: t, provider: 'mymemory' };
  } catch { clearTimeout(timeout); return null; }
}


async function multiProviderTranslate(original: string, target: TranslateTarget): Promise<{ text: string; provider: string; cached?: boolean; source?: string }> {
  const q = (original ?? '').trim(); if (!q) return { text: '', provider: 'none' };
  const cacheKey = `${q}__${target}`;
  const cached = cacheGet(cacheKey); if (cached) return { text: cached.text, provider: cached.provider, cached: true };
  // 仅当源文本被检测为中文时才进行内部简繁转换；否则应执行真正的跨语言翻译。
  // 解决: 从英文/韩文等翻译为 "zh-CN" 时此前直接走了繁->简转换导致翻译失败。
  let srcGuess = 'auto';
  try { srcGuess = guessSource(q); } catch { srcGuess = 'auto'; }
  // 源语言与目标语言一致时直接返回原文，避免无意义请求；中文仍需考虑简繁转换所以不在此短路
  if (srcGuess && (srcGuess === 'en' || srcGuess === 'ko' || srcGuess === 'ja') && (
    (srcGuess === 'en' && target === 'en') ||
    (srcGuess === 'ko' && target === 'ko') ||
    (srcGuess === 'ja' && target === 'ja')
  )) {
    return { text: q, provider: 'noop', source: srcGuess };
  }
  if (srcGuess === 'zh' && target === 'zh-TW') {
    try {
      const converted = tify(q); // 简体 -> 繁体
      cacheSet(cacheKey, { text: converted, provider: 'chinese-conv-s2t' });
      return { text: converted, provider: 'chinese-conv-s2t', source: srcGuess };
    } catch(e){
      console.warn('[translate] chinese-conv tify failed, fallback mapping', e);
      const fallback = q.split('').map(ch => MAP_SIMPLIFIED_TO_TRADITIONAL[ch] || ch).join('');
      cacheSet(cacheKey, { text: fallback, provider: 'internal-zh-tw' });
      return { text: fallback, provider: 'internal-zh-tw', source: srcGuess };
    }
  }
  if (srcGuess === 'zh' && target === 'zh-CN') {
    try {
      const converted = sify(q); // 繁体 -> 简体
      cacheSet(cacheKey, { text: converted, provider: 'chinese-conv-t2s' });
      return { text: converted, provider: 'chinese-conv-t2s', source: srcGuess };
    } catch(e){
      console.warn('[translate] chinese-conv sify failed, fallback mapping', e);
      const fallback = q.split('').map(ch => MAP_TRADITIONAL_TO_SIMPLIFIED[ch] || ch).join('');
      cacheSet(cacheKey, { text: fallback, provider: 'internal-zh-cn' });
      return { text: fallback, provider: 'internal-zh-cn', source: srcGuess };
    }
  }
  // 外部提供者顺序：Libre -> Lingva -> MyMemory
  try {
  const srcGuess = guessSource(q);
  const libre = await libreTranslate(q, target, srcGuess); if (libre.text && !/^\[[A-Z-]+\]/.test(libre.text)) { cacheSet(cacheKey, { text: libre.text, provider: libre.provider }); return libre; }
    const lingva = await lingvaTranslate(q, target); if (lingva) { cacheSet(cacheKey, lingva); return lingva; }
    const memory = await myMemoryTranslate(q, target); if (memory) { cacheSet(cacheKey, memory); return memory; }
  } catch {}
  const fallback = { text: `[${target.toUpperCase()}] ${q}`, provider: 'multi-fallback', source: guessSource(q) };
  cacheSet(cacheKey, fallback);
  return fallback;
}

async function translateText(original: string, target: TranslateTarget): Promise<{ text: string; provider: string; cached?: boolean }> {
  const normalized = (original ?? '').trim();
  if (!normalized) return { text: '', provider: 'none' };
  return multiProviderTranslate(normalized, target);
}

// 调整登录逻辑：仅需要 username + password；返回聚合权限列表
adminRouter.post('/login', (req, res) => {
  // 登录前做一次数据自检与修复，避免因误删角色或解绑导致无法进入后台
  ensureDefaultAdmin();
  ensureDefaultRolesIntegrity();
  ensureSuperAdminBinding();
  const { username, password } = req.body || {};
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'INVALID_PAYLOAD' });
  }
  const record = verifyAdminCredentials({ username, password });
  if (!record) return res.status(401).json({ error: 'UNAUTHORIZED' });
  const token = signAdminToken(record);
  const permissions = collectAdminPermissions(record);
  try {
    appendAdminLog({
      username: record.username,
      title: '管理员登录',
      url: '/admin/api/login',
      ip: String((req as any).ip || req.socket?.remoteAddress || '').replace('::ffff:', ''),
      browser: String(req.headers['user-agent'] || '')
    });
  } catch {}
  return res.json({
    token,
    admin: {
      username: record.username,
      email: record.email,
      nickname: record.nickname,
      roles: record.roles,
      permissions
    }
  });
});

adminRouter.use((req, res, next) => {
  const header = String(req.headers.authorization || req.headers['x-admin-token'] || '').trim();
  const token = header.startsWith('Bearer ') ? header.slice(7) : header;
  const payload = verifyAdminToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }
  (req as any).admin = payload;
  next();
});

// 登出端点：仅用于记录日志
adminRouter.post('/logout', (req, res) => {
  const payload: any = (req as any).admin;
  if (payload?.username) {
    try {
      appendAdminLog({
        username: payload.username,
        title: '管理员登出',
        url: '/admin/api/logout',
        ip: String((req as any).ip || req.socket?.remoteAddress || '').replace('::ffff:', ''),
        browser: String(req.headers['user-agent'] || '')
      });
    } catch {}
  }
  res.json({ ok: true });
});

// ---- Chat message helpers ----
// 后端“客服”身份同时兼容旧数据中的 'admin' 与对外暴露的 'support'
const ADMIN_IDS = ['admin', 'support'];
const DEFAULT_ADMIN_SENDER = 'support';
const isAdminId = (id: string) => ADMIN_IDS.includes(id);

// ---- Chat attachments upload (images) ----
// Store under data/static/chat and expose as /static/chat/<filename>
const { existsSync: _existsSync, mkdirSync: _mkdirSync } = require('fs');
const { join: _join, extname: _extname } = require('path');
const CHAT_ATTACH_DIR = _join(process.cwd(), 'data', 'static', 'chat');
try { if (!_existsSync(CHAT_ATTACH_DIR)) _mkdirSync(CHAT_ATTACH_DIR, { recursive: true }); } catch {}
const chatUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, CHAT_ATTACH_DIR),
    filename: (_req, file, cb) => {
      const ts = Date.now().toString(36);
      const rnd = Math.random().toString(36).slice(2,8);
      const ext = _extname(file.originalname || '') || '.jpg';
      cb(null, `att_${ts}_${rnd}${ext}`);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    // Restrict to images for now
    if ((file.mimetype || '').startsWith('image/')) return cb(null, true);
    return cb(new Error('Only image files are allowed'));
  }
});

// POST /admin/api/upload  -> { ok, url }
adminRouter.post('/upload', requirePermission('members/customer-service'), (req, res) => {
  chatUpload.single('file')(req as any, res as any, (err: any) => {
    if (err) return res.status(400).json({ error: String(err?.message || err) });
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) return res.status(400).json({ error: 'NO_FILE' });
    const url = `/static/chat/${file.filename}`;
    writeAdminLog(req, `客服上传图片:${file.originalname || file.filename}`);
    res.json({ ok: true, url, name: file.originalname || file.filename, size: file.size, type: file.mimetype });
  });
});

adminRouter.get('/messages', requirePermission('members/customer-service'), (req, res) => {
  const userId = String(req.query.userId || '').trim();
  if (!userId) return res.status(400).json({ error: 'MISSING_USER_ID' });
  // 仅返回“客服(任一 adminId)”与指定用户之间的对话
  const list = db
    .getMessages()
    .filter((msg) => (isAdminId(msg.fromUserId) && msg.toUserId === userId) || (isAdminId(msg.toUserId) && msg.fromUserId === userId))
    .sort((a, b) => a.createdAt - b.createdAt);
  res.json({ ok: true, list });
});

adminRouter.post('/messages/update', requirePermission('members/customer-service'), (req, res) => {
  const { id, content } = (req.body ?? {}) as { id?: string; content?: string };
  if (!id || typeof content !== 'string' || !content.trim()) return res.status(400).json({ error: 'INVALID_PAYLOAD' });
  const msgs = db.getMessages();
  const idx = msgs.findIndex((msg) => msg.id === id);
  if (idx < 0) return res.status(404).json({ error: 'NOT_FOUND' });
  msgs[idx].content = content.trim();
  db.saveMessages(msgs);
  writeAdminLog(req, `客服更新消息:${id}`);
  res.json({ ok: true, item: msgs[idx] });
});

adminRouter.post('/messages/delete', requirePermission('members/customer-service'), (req, res) => {
  const { ids } = (req.body ?? {}) as { ids?: unknown };
  const normalized = Array.isArray(ids) ? ids.map((id) => String(id || '').trim()).filter(Boolean) : [];
  if (!normalized.length) return res.status(400).json({ error: 'INVALID_PAYLOAD' });
  const msgs = db.getMessages();
  const remained = msgs.filter((msg) => !normalized.includes(msg.id));
  db.saveMessages(remained);
  writeAdminLog(req, `客服删除消息:${normalized.length}条`);
  res.json({ ok: true, deleted: normalized });
});

adminRouter.post('/messages/send', requirePermission('members/customer-service'), (req, res) => {
  const { fromUserId, toUserId, content } = (req.body ?? {}) as {
    fromUserId?: string;
    toUserId?: string;
    content?: string;
  };
  if (!toUserId || typeof content !== 'string') return res.status(400).json({ error: 'INVALID_PAYLOAD' });
  const payload = content.trim();
  if (!payload) return res.status(400).json({ error: 'EMPTY_CONTENT' });
  const msgs = db.getMessages();
  const msg = {
    id: nanoid(),
    fromUserId: fromUserId || DEFAULT_ADMIN_SENDER,
    toUserId,
    content: payload,
    createdAt: Date.now()
  };
  msgs.push(msg);
  db.saveMessages(msgs);
  writeAdminLog(req, `客服发送消息:to:${toUserId}`);
  res.json({ ok: true, item: msg });
});

adminRouter.get('/messages/recent', requirePermission('members/customer-service'), (_req, res) => {
  const all = db.getMessages().filter((msg) => isAdminId(msg.fromUserId) || isAdminId(msg.toUserId));
  const reads = db.getReads().filter((r) => isAdminId(r.userId));
  const lastReadMap = new Map(reads.map((r) => [r.peerId, r.lastReadAt]));
  const latest = new Map<string, typeof all[number]>();
  for (const msg of all) {
    const peer = isAdminId(msg.fromUserId) ? msg.toUserId : msg.fromUserId;
    const existing = latest.get(peer);
    if (!existing || existing.createdAt < msg.createdAt) latest.set(peer, msg);
  }
  const users = db.getUsers();
  const peerMeta = (peerId: string) => {
    const user = users.find((u) => u.id === peerId);
    if (!user) return undefined;
    return {
      id: user.id,
      nickname: user.nickname,
      avatar: (user as any).avatarUrl || ''
    };
  };
  const list = Array.from(latest.entries())
    .map(([peerId, message]) => {
      const lastReadAt = lastReadMap.get(peerId) || 0;
      const unread = all.filter(
        (msg) => msg.fromUserId === peerId && isAdminId(msg.toUserId) && msg.createdAt > lastReadAt
      ).length;
      return {
        peerId,
        lastContent: message.content,
        lastAt: message.createdAt,
        unread,
        peer: peerMeta(peerId)
      };
    })
    .sort((a, b) => b.lastAt - a.lastAt)
    .slice(0, 50);
  // 不再强制插入虚拟“support”会话，统一真实数据来源
  res.json({ ok: true, list });
});

adminRouter.post('/messages/read', requirePermission('members/customer-service'), (req, res) => {
  const { peerId } = (req.body ?? {}) as { peerId?: string };
  const pid = String(peerId || '').trim();
  if (!pid) return res.status(400).json({ error: 'MISSING_PEER_ID' });
  const reads = db.getReads();
  // 以 'support' 作为已读标记主体，便于与前台用户的对接
  const idx = reads.findIndex((r) => r.userId === DEFAULT_ADMIN_SENDER && r.peerId === pid);
  const now = Date.now();
  if (idx >= 0) {
    reads[idx].lastReadAt = now;
  } else {
    reads.push({ userId: DEFAULT_ADMIN_SENDER, peerId: pid, lastReadAt: now });
  }
  db.saveReads(reads);
  writeAdminLog(req, `客服标记已读:${pid}`);
  res.json({ ok: true, peerId: pid, lastReadAt: now });
});

// ---------------- 自动回复配置（管理员端） ----------------
// GET /admin/api/auto-reply/config -> { ok, data: { enabled, rules, updatedAt } }
adminRouter.get('/auto-reply/config', requirePermission('members/customer-service'), (_req, res) => {
  const cfg = getAutoReplyConfig();
  res.json({ ok: true, data: cfg });
});

// PUT /admin/api/auto-reply/config { enabled?: boolean, rules?: [{ minutes, text, enabled }] }
adminRouter.put('/auto-reply/config', requirePermission('members/customer-service'), (req, res) => {
  const body = req.body || {};
  const enabled = typeof body.enabled === 'boolean' ? body.enabled : undefined;
  let rules = Array.isArray(body.rules) ? body.rules : undefined;
  if (rules) {
    rules = rules
      .map((r: any) => ({ minutes: Math.max(1, Math.floor(Number(r?.minutes || 0))), text: String(r?.text || '').trim(), enabled: r?.enabled !== false }))
      .filter((r: any) => r.text);
    if (rules.length > 50) rules = rules.slice(0, 50);
  }
  const saved = saveAutoReplyConfig({ enabled, rules } as any);
  writeAdminLog(req, `更新自动回复配置: enabled=${saved.enabled}, rules=${saved.rules.length}`);
  res.json({ ok: true, data: saved });
});

adminRouter.post('/messages/translate', requirePermission('members/customer-service'), async (req, res) => {
  const { text, target } = (req.body ?? {}) as { text?: string; target?: string };
  if (typeof text !== 'string' || !text.trim()) return res.status(400).json({ error: 'EMPTY_TEXT' });
  if (!TRANSLATE_TARGETS.includes(String(target) as TranslateTarget)) return res.status(400).json({ error: 'UNSUPPORTED_TARGET' });
  try {
    const srcDetected = guessSource(text);
    const { text: translated, provider, cached } = await translateText(text, String(target) as TranslateTarget);
    writeAdminLog(req, `客服翻译消息:(${srcDetected})->${String(target).toUpperCase()} via ${provider}${cached ? ' (cache)' : ''}`);
    res.json({ ok: true, original: text.trim(), translated, target, provider, source: srcDetected, cached: Boolean(cached) });
  } catch (e) {
    res.status(500).json({ error: 'TRANSLATE_FAIL' });
  }
});

adminRouter.post('/messages/translate/batch', requirePermission('members/customer-service'), async (req, res) => {
  const { items, target } = (req.body ?? {}) as { items?: Array<{ id?: string; text?: string }>; target?: string };
  if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: 'EMPTY_ITEMS' });
  if (!TRANSLATE_TARGETS.includes(String(target) as TranslateTarget)) return res.status(400).json({ error: 'UNSUPPORTED_TARGET' });
  const targetCode = String(target) as TranslateTarget;
  const filtered = items.filter((it) => it && typeof it.text === 'string' && String(it.id || '').trim() && it.text.trim());
  if (!filtered.length) return res.status(400).json({ error: 'NO_VALID_ITEMS' });
  try {
    const list = await Promise.all(
      filtered.map(async (item) => {
        const id = String(item.id).trim();
        const original = String(item.text).trim();
        const srcDetected = guessSource(original);
        const { text: translated, provider, cached } = await translateText(original, targetCode);
        return { id, original, translated, provider, source: srcDetected, cached: Boolean(cached) };
      })
    );
    writeAdminLog(req, `客服批量翻译:${list.length}条->${targetCode.toUpperCase()} providers(multi)`);
    res.json({ ok: true, list, target: targetCode });
  } catch (e) {
    res.status(500).json({ error: 'TRANSLATE_FAIL' });
  }
});

// 搜索用户（客服权限）
// GET /admin/api/messages/search-users?keyword=&limit=
adminRouter.get('/messages/search-users', requirePermission('members/customer-service'), (req, res) => {
  const keyword = String(req.query.keyword || '').trim().toLowerCase();
  const limit = Math.max(1, Math.min(50, Number(req.query.limit || 20) || 20));
  if (!keyword) return res.json({ ok: true, list: [] });
  const users = db.getUsers();
  const matched = users.filter((u) => {
    const id = u.id.toLowerCase();
    const nickname = String(u.nickname || '').toLowerCase();
    const email = String(u.email || '').toLowerCase();
    const username = String((u as any).username || '').toLowerCase();
    return id.includes(keyword) || nickname.includes(keyword) || email.includes(keyword) || username.includes(keyword);
  }).slice(0, limit);
  const list = matched.map((u) => ({
    id: u.id,
    nickname: u.nickname || u.email || u.id,
    avatar: (u as any).avatarUrl || (u as any).avatar || '',
    membershipLevel: (u as any).membershipLevel || u.membershipLevel || 'none',
    gender: String((u as any).gender || u.gender || 'other')
  }));
  res.json({ ok: true, list });
});

// ---- Members ----
adminRouter.get('/members', requirePermission('members/members'), (req, res) => {
  const keyword = String(req.query.keyword || '').trim().toLowerCase();
  const page = Number(req.query.page || 1) || 1;
  const pageSize = Number(req.query.pageSize || 0) || 0;
  const users = db.getUsers();
  const filtered = users.filter((user) => {
    if (!keyword) return true;
    const username = String((user as any).username || '').toLowerCase();
    const nickname = String(user.nickname || '').toLowerCase();
    const email = String(user.email || '').toLowerCase();
    return (
      user.id.toLowerCase().includes(keyword) || username.includes(keyword) || nickname.includes(keyword) || email.includes(keyword)
    );
  });
  const views = filtered.map((user) => toMemberView(user));
  const list = pageSize > 0 ? views.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize) : views;
  res.json({ ok: true, list, total: views.length, page, pageSize: pageSize || views.length });
});

adminRouter.post('/members', requirePermission('members/members'), (req, res) => {
  const payload = req.body ?? {};
  const email = String(payload.email || '').trim();
  const nickname = String(payload.nickname || payload.username || email).trim();
  const username = String(payload.username || email.split('@')[0] || nickname || 'user').trim();
  if (!email || !nickname) return res.status(400).json({ error: 'INVALID_PAYLOAD' });

  const users = db.getUsers();
  if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ error: 'EMAIL_EXISTS' });
  }

  const passwordSource =
    typeof payload.password === 'string' && payload.password.trim() ? payload.password.trim() : nanoid(10);

  const user: User = {
    id: nanoid(),
    email,
    nickname,
    gender: normalizeGenderValue(payload.gender),
    passwordHash: bcrypt.hashSync(passwordSource, 10)
  };

  applyMemberMeta(user, { ...payload, username });
  // 如果没有提供头像，按性别设置默认头像
  if (!(user as any).avatarUrl) {
    const g = String((user as any).gender || '').toLowerCase();
    (user as any).avatarUrl = g === 'male' ? DEFAULT_AVATAR_MALE : g === 'female' ? DEFAULT_AVATAR_FEMALE : DEFAULT_AVATAR_OTHER;
  }
  users.push(user);
  db.saveUsers(users);
  const view = toMemberView(user);
  // 广播给管理员端：有新会员/会员信息变更
  try { emitToAdmins('admin:member-updated', view); } catch {}
  res.json({ ok: true, item: view });
});

adminRouter.put('/members/:id', requirePermission('members/members'), (req, res) => {
  const id = String(req.params.id || '').trim();
  if (!id) return res.status(400).json({ error: 'MISSING_ID' });
  const users = db.getUsers();
  const target = users.find((u) => u.id === id);
  if (!target) return res.status(404).json({ error: 'NOT_FOUND' });
  const payload = req.body ?? {};
  if (payload.email) {
    const email = String(payload.email).trim();
    if (!email) return res.status(400).json({ error: 'INVALID_EMAIL' });
    if (users.some((u) => u.id !== id && u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(409).json({ error: 'EMAIL_EXISTS' });
    }
  }
  if (typeof payload.password === 'string' && payload.password.trim()) {
    (target as User).passwordHash = bcrypt.hashSync(payload.password.trim(), 10);
  }
  applyMemberMeta(target as User, payload);
  db.saveUsers(users);
  const view = toMemberView(target as User);
  try { emitToAdmins('admin:member-updated', view); } catch {}
  res.json({ ok: true, item: view });
});

adminRouter.post('/members/delete', requirePermission('members/members'), (req, res) => {
  const { ids } = (req.body ?? {}) as { ids?: unknown };
  const normalized = Array.isArray(ids)
    ? Array.from(new Set(ids.map((id) => String(id || '').trim()).filter(Boolean)))
    : [];
  if (!normalized.length) return res.status(400).json({ error: 'INVALID_IDS' });
  const users = db.getUsers();
  const remained = users.filter((user) => !normalized.includes(user.id));
  if (remained.length === users.length) {
    return res.status(404).json({ error: 'NOT_FOUND' });
  }
  db.saveUsers(remained);
  res.json({ ok: true, deleted: normalized });
});

adminRouter.post('/members/batch', requirePermission('members/members'), (req, res) => {
  const { ids } = (req.body ?? {}) as { ids?: unknown };
  const normalized = Array.isArray(ids)
    ? Array.from(new Set(ids.map((id) => String(id || '').trim()).filter(Boolean)))
    : [];
  if (!normalized.length) return res.status(400).json({ error: 'INVALID_IDS' });
  const users = db.getUsers();
  const list = normalized
    .map((id) => {
      const user = users.find((u) => u.id === id);
      if (!user) return null;
      return toMemberView(user);
    })
    .filter((item): item is ReturnType<typeof toMemberView> => Boolean(item));
  res.json({ ok: true, list });
});

adminRouter.get('/admins', requirePermission('auth/admins'), (_req, res) => {
  const roles = listRoles();
  const roleNameMap = new Map(roles.map(r => [String(r.id), r.name]));
  const admins = listAdmins();
  const list = admins.map((record, index) => ({
    id: record.username,
    username: record.username,
    nickname: record.nickname,
    email: record.email,
    roles: record.roles.map(rid => roleNameMap.get(String(rid)) || rid),
    roleIds: record.roles,
    status: 'active',
    lastLogin: record.updatedAt,
    order: index + 1
  }));
  res.json({ ok: true, list });
});

// 创建管理员
adminRouter.post('/admins', requirePermission('auth/admins'), (req, res) => {
  const { username, email, nickname, password, roleIds } = (req.body || {}) as { username?: string; email?: string; nickname?: string; password?: string; roleIds?: unknown };
  if (typeof username !== 'string' || !username.trim() || typeof password !== 'string' || !password.trim()) {
    return res.status(400).json({ error: 'INVALID_PAYLOAD' });
  }
  const normalizedRoleIds = Array.isArray(roleIds) ? roleIds.map(r => Number(r)).filter(n => Number.isFinite(n)) : [];
  try {
    const record = createAdmin({ username: username.trim(), email: typeof email === 'string' ? email.trim() : undefined, nickname: typeof nickname === 'string' ? nickname.trim() : undefined, password: password.trim(), roleIds: normalizedRoleIds });
    const permissions = collectAdminPermissions(record);
    writeAdminLog(req, `创建管理员:${record.username}`);
    res.json({ ok: true, item: { username: record.username, email: record.email, nickname: record.nickname, roles: record.roles, permissions } });
  } catch (err: any) {
    if (err && err.message === 'USERNAME_EXISTS') return res.status(409).json({ error: 'USERNAME_EXISTS' });
    res.status(500).json({ error: 'CREATE_FAILED' });
  }
});

// 更新管理员（角色/密码/昵称/email）
adminRouter.put('/admins/:username', requirePermission('auth/admins'), (req, res) => {
  const uname = String(req.params.username || '').trim();
  if (!uname) return res.status(400).json({ error: 'MISSING_USERNAME' });
  const { email, nickname, password, roleIds } = (req.body || {}) as { email?: string; nickname?: string; password?: string; roleIds?: unknown };
  const normalizedRoleIds = Array.isArray(roleIds) ? roleIds.map(r => Number(r)).filter(n => Number.isFinite(n)) : undefined;
  const record = updateAdmin(uname, { email, nickname, password, roleIds: normalizedRoleIds });
  if (!record) return res.status(404).json({ error: 'NOT_FOUND' });
  const permissions = collectAdminPermissions(record);
  writeAdminLog(req, `更新管理员:${record.username}`);
  res.json({ ok: true, item: { username: record.username, email: record.email, nickname: record.nickname, roles: record.roles, permissions } });
});

adminRouter.post('/admins/delete', requirePermission('auth/admins'), (req, res) => {
  const { usernames } = (req.body || {}) as { usernames?: unknown };
  const ids = Array.isArray(usernames) ? usernames.map(u => String(u || '').trim()).filter(Boolean) : [];
  if (!ids.length) return res.status(400).json({ error: 'INVALID_USERNAMES' });
  // 保护默认管理员 admin
  if (ids.includes('admin')) return res.status(403).json({ error: 'PROTECTED_ADMIN' });
  const all = listAdmins();
  const remained = all.filter(a => !ids.includes(a.username));
  if (remained.length === all.length) return res.status(404).json({ error: 'NOT_FOUND' });
  // 直接用 updateAdmin 无法批量删除，这里复用 adminStore 的保存函数不对外暴露，改为简单写回
  const fs = require('fs');
  const path = require('path');
  const ADMINS_FILE = path.join(process.cwd(), 'data', 'admin', 'admins.json');
  fs.writeFileSync(ADMINS_FILE, JSON.stringify({ admins: remained }, null, 2), 'utf8');
  writeAdminLog(req, `删除管理员:${ids.join(',')}`);
  res.json({ ok: true, deleted: ids });
});

// ---------------- 客服管理（列表 & 删除） ----------------
// 数据文件：data/admin/customer_service.json 结构 { list: ServiceRep[] }
interface ServiceRepRecord {
  id: number; // 数字主键
  owner: string; // 所属人/创建人标识
  username: string; // 用户名
  nickname: string; // 昵称
  email: string;
  avatar: string;
  level: string; // 会员等级展示（示例：帝皇会员）
  gender: string;
  balance: string; // 余额字符串化（与演示一致）
  crystalExpire: string;
  emperorExpire: string;
  lastLogin: string;
  lastIp: string;
  joinedAt: string;
  joinIp: string;
  status: 'active' | 'inactive' | 'disabled';
}
function ensureCustomerServiceFile(){
  const fs = require('fs');
  const path = require('path');
  const FILE = path.join(process.cwd(),'data','admin','customer_service.json');
  if(!fs.existsSync(FILE)){
    const seed: ServiceRepRecord[] = [
      { id:143, owner:'Customer Service Manager', username:'Customer Service Manager', nickname:'Customer Service Manager', email:'145612@qq.com', avatar:'https://i.pravatar.cc/64?img=45', level:'帝皇会员', gender:'女', balance:'0.00', crystalExpire:'无', emperorExpire:'无', lastLogin:'2025-08-25 18:14:05', lastIp:'83.147.15.3', joinedAt:'2022-04-09 15:24:02', joinIp:'83.147.15.3', status:'active' },
      { id:142, owner:'customer service', username:'customer service', nickname:'customer service', email:'458109018@qq.com', avatar:'https://i.pravatar.cc/64?img=36', level:'帝皇会员', gender:'女', balance:'1387.00', crystalExpire:'无', emperorExpire:'2025-10-28 15:34:18', lastLogin:'2025-10-08 00:41:21', lastIp:'39.163.178.90', joinedAt:'2022-04-09 15:21:41', joinIp:'39.163.178.90', status:'active' }
    ];
    fs.mkdirSync(path.dirname(FILE), { recursive:true });
    fs.writeFileSync(FILE, JSON.stringify({ list: seed }, null, 2), 'utf8');
  }
  return FILE;
}
function loadCustomerServiceList(): ServiceRepRecord[] {
  const fs = require('fs');
  const FILE = ensureCustomerServiceFile();
  try{ const raw = fs.readFileSync(FILE,'utf8'); const j = JSON.parse(raw); if(j && Array.isArray(j.list)) return j.list; }catch{}
  return [];
}
function saveCustomerServiceList(list: ServiceRepRecord[]) {
  const fs = require('fs');
  const FILE = ensureCustomerServiceFile();
  fs.writeFileSync(FILE, JSON.stringify({ list }, null, 2), 'utf8');
}

// GET /admin/api/customer-service?keyword=&page=&pageSize=
adminRouter.get('/customer-service', requirePermission('members/customer-service'), (req, res) => {
  const keyword = String(req.query.keyword || '').trim().toLowerCase();
  const page = Number(req.query.page || 1) || 1;
  const pageSize = Number(req.query.pageSize || 20) || 20;
  let list = loadCustomerServiceList();
  if(keyword){ list = list.filter(r =>
    r.username.toLowerCase().includes(keyword) ||
    r.nickname.toLowerCase().includes(keyword) ||
    r.email.toLowerCase().includes(keyword) ||
    String(r.id).includes(keyword)
  ); }
  const total = list.length;
  const paged = list.slice((page-1)*pageSize, (page-1)*pageSize + pageSize);
  res.json({ ok:true, list: paged, total, page, pageSize });
});

// POST /admin/api/customer-service/delete  { ids: [number] }
adminRouter.post('/customer-service/delete', requirePermission('members/customer-service'), (req, res) => {
  const { ids } = (req.body || {}) as { ids?: unknown };
  const delIds = Array.isArray(ids) ? ids.map(i => Number(i)).filter(n => Number.isFinite(n)) : [];
  if(!delIds.length) return res.status(400).json({ error:'INVALID_IDS' });
  let list = loadCustomerServiceList();
  const existed = list.filter(r => delIds.includes(r.id));
  if(!existed.length) return res.status(404).json({ error:'NOT_FOUND' });
  list = list.filter(r => !delIds.includes(r.id));
  saveCustomerServiceList(list);
  writeAdminLog(req, `删除客服:${delIds.join(',')}`);
  res.json({ ok:true, deleted: delIds, remained: list.length });
});

// 实时获取当前管理员资料与聚合权限
adminRouter.get('/profile', (req, res) => {
  const payload: any = (req as any).admin;
  if (!payload || !payload.username) return res.status(401).json({ error: 'UNAUTHORIZED' });
  const record = verifyAdminCredentials({ username: payload.username, password: '' as any });
  // 不能用 verify 比对密码，这里直接查找
  const { findAdminByUsername } = require('../adminStore');
  const admin = findAdminByUsername(payload.username);
  if (!admin) return res.status(404).json({ error: 'NOT_FOUND' });
  const permissions = collectAdminPermissions(admin);
  res.json({ ok: true, admin: { username: admin.username, email: admin.email, nickname: admin.nickname, roles: admin.roles, permissions } });
});

// -------- 角色组管理 --------
adminRouter.get('/roles', requirePermission('auth/roles'), (_req, res) => {
  const roles = listRoles();
  res.json({ ok: true, list: roles });
});

adminRouter.post('/roles', requirePermission('auth/roles'), (req, res) => {
  const { name, parentId, status, permissions } = (req.body || {}) as any;
  if (typeof name !== 'string' || !name.trim()) return res.status(400).json({ error: 'INVALID_NAME' });
  const record = createRole({ name: name.trim(), parentId: Number(parentId) || 0, status, permissions: Array.isArray(permissions) ? permissions : [] });
  writeAdminLog(req, `创建角色:${record.name}#${record.id}`);
  res.json({ ok: true, item: record });
});

adminRouter.put('/roles/:id', requirePermission('auth/roles'), (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'INVALID_ID' });
  const { name, parentId, status, permissions } = (req.body || {}) as any;
  const record = updateRole(id, { name, parentId: Number(parentId), status, permissions: Array.isArray(permissions) ? permissions : undefined });
  if (!record) return res.status(404).json({ error: 'NOT_FOUND' });
  writeAdminLog(req, `更新角色:#${id}`);
  res.json({ ok: true, item: record });
});

adminRouter.post('/roles/delete', requirePermission('auth/roles'), (req, res) => {
  const { ids } = (req.body || {}) as { ids?: unknown };
  const normalized = Array.isArray(ids) ? ids.map(i => Number(i)).filter(n => Number.isFinite(n)) : [];
  if (!normalized.length) return res.status(400).json({ error: 'INVALID_IDS' });
  const result = deleteRoles(normalized);
  if (result.deleted) writeAdminLog(req, `删除角色:${normalized.join(',')}`);
  res.json({ ok: true, ...result });
});

// 恢复默认角色组（修复误删）
adminRouter.post('/roles/recover', requirePermission('auth/roles'), (_req, res) => {
  const list = recoverDefaultRoles();
  writeAdminLog(_req, '恢复默认角色');
  res.json({ ok: true, list });
});

const ALLOWED_REVIEW_TYPES = new Set(['avatar', 'profile', 'identity', 'confession', 'all']);
const ALLOWED_REVIEW_STATUS = new Set(['pending', 'approved', 'rejected', 'all']);

adminRouter.get('/reviews', requireAnyPermission(['review','review/attachments','review/avatar-review','review/identity-review','review/confession-review']), (req, res) => {
  const type = String(req.query.type || 'all');
  const status = String(req.query.status || 'all');
  const keyword = String(req.query.keyword || '').trim();
  const page = Number(req.query.page || 1) || 1;
  const pageSize = Number(req.query.pageSize || 20) || 20;
  if (!ALLOWED_REVIEW_TYPES.has(type)) return res.status(400).json({ error: 'INVALID_TYPE' });
  if (!ALLOWED_REVIEW_STATUS.has(status)) return res.status(400).json({ error: 'INVALID_STATUS' });
  const result = listReviews({
    type: type === 'all' ? undefined : (type as any),
    status: status === 'all' ? undefined : (status as any),
    keyword,
    page,
    pageSize
  });
  res.json(result);
});

adminRouter.post('/reviews/:id/approve', requireAnyPermission(['review','review/attachments','review/avatar-review','review/identity-review','review/confession-review']), (req, res) => {
  const id = String(req.params.id || '').trim();
  if (!id) return res.status(400).json({ error: 'MISSING_ID' });
  const result = approveReview(id);
  if (!result) return res.status(404).json({ error: 'NOT_FOUND' });
  writeAdminLog(req, `审核通过:${id}`);
  res.json({ ok: true, item: result });
});

adminRouter.post('/reviews/:id/reject', requireAnyPermission(['review','review/attachments','review/avatar-review','review/identity-review','review/confession-review']), (req, res) => {
  const id = String(req.params.id || '').trim();
  if (!id) return res.status(400).json({ error: 'MISSING_ID' });
  const { reason } = (req.body || {}) as { reason?: string };
  const result = rejectReview(id, typeof reason === 'string' ? reason : undefined);
  if (!result) return res.status(404).json({ error: 'NOT_FOUND' });
  writeAdminLog(req, `审核拒绝:${id}`);
  res.json({ ok: true, item: result });
});

adminRouter.post('/reviews/delete', requireAnyPermission(['review','review/attachments','review/avatar-review','review/identity-review','review/confession-review']), (req, res) => {
  const { ids } = (req.body || {}) as { ids?: unknown };
  const normalized = Array.isArray(ids)
    ? Array.from(new Set(ids.map((item) => String(item || '').trim()).filter(Boolean)))
    : [];
  if (!normalized.length) return res.status(400).json({ error: 'INVALID_IDS' });
  const result = deleteReviews(normalized);
  if (result.deleted) writeAdminLog(req, `审核删除:${result.deleted}条`);
  res.json({ ok: true, ...result });
});

// ---------------- 用户参数修改（前端管理） ----------------
// luckyStars 策略：优先读取用户对象上的 luckyStars；若无则统计 gifts.json 中该用户收到 giftName === '幸运星' 的数量
// quickTextEnabled 来源：quickTextService 配置 enabled 字段

function computeLuckyStars(userId: string): number {
  const users = db.getUsers();
  const u = users.find(u => u.id === userId) as any;
  if (u && typeof u.luckyStars === 'number' && Number.isFinite(u.luckyStars)) return u.luckyStars;
  const gifts = db.getGifts();
  return gifts.filter(g => g.toUserId === userId && (g.giftName === '幸运星' || g.giftId === 'g4')).length;
}

function toUserConfigView(user: User) {
  const quick = getQuickByUser(user.id);
  return {
    id: user.id,
    nickname: user.nickname || '',
    email: user.email || '',
    avatarUrl: (user as any).avatarUrl || (user as any).avatar || '',
    gender: (user as any).gender || 'other',
    membershipLevel: user.membershipLevel || 'none',
    popularity: (user as any).popularity || 0,
    luckyStars: computeLuckyStars(user.id),
    quickTextEnabled: quick.enabled,
  };
}

// GET /admin/api/user-config?keyword=&page=&pageSize=
adminRouter.get('/user-config', requirePermission('frontend/frontend-user-config'), (req, res) => {
  const keyword = String(req.query.keyword || '').trim().toLowerCase();
  const page = Number(req.query.page || 1) || 1;
  const pageSize = Number(req.query.pageSize || 0) || 0;
  const users = db.getUsers();
  const filtered = users.filter(u => {
    if (!keyword) return true;
    return (
      u.id.toLowerCase().includes(keyword) ||
      (u.nickname || '').toLowerCase().includes(keyword) ||
      (u.email || '').toLowerCase().includes(keyword)
    );
  });
  const views = filtered.map(toUserConfigView);
  const list = pageSize > 0 ? views.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize) : views;
  res.json({ ok: true, list, total: views.length, page, pageSize: pageSize || views.length });
});

// POST /admin/api/user-config  新增用户（最简必填：email 或 nickname）
adminRouter.post('/user-config', requirePermission('frontend/frontend-user-config'), (req, res) => {
  const payload = req.body ?? {};
  let email = String(payload.email || '').trim();
  const nickname = String(payload.nickname || '').trim();
  if (!email && !nickname) return res.status(400).json({ error: 'INVALID_PAYLOAD' });
  if (!email) email = `${Date.now()}_${Math.random().toString(36).slice(2,8)}@example.com`;

  const users = db.getUsers();
  if (users.find(u => (u.email || '').toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ error: 'EMAIL_EXISTS' });
  }

  const user: User = {
    id: nanoid(),
    email,
    nickname: nickname || email.split('@')[0],
    gender: normalizeGenderValue(String(payload.gender || 'other')),
    passwordHash: bcrypt.hashSync(nanoid(10), 10),
  } as User;

  // 可选字段
  if (typeof payload.avatarUrl === 'string') (user as any).avatarUrl = String(payload.avatarUrl).trim();
  // 默认头像兜底（性别区分）
  if (!(user as any).avatarUrl) {
    const g = String((user as any).gender || '').toLowerCase();
    (user as any).avatarUrl = g === 'male' ? DEFAULT_AVATAR_MALE : g === 'female' ? DEFAULT_AVATAR_FEMALE : DEFAULT_AVATAR_OTHER;
  }
  if (payload.membershipLevel && ['none','purple','crown'].includes(String(payload.membershipLevel))) {
    user.membershipLevel = payload.membershipLevel as any;
  }
  if (payload.popularity !== undefined) {
    const num = Number(payload.popularity);
    (user as any).popularity = Number.isFinite(num) && num >= 0 ? Math.floor(num) : 0;
  }
  if (payload.luckyStars !== undefined) {
    const ls = Number(payload.luckyStars);
    (user as any).luckyStars = Number.isFinite(ls) && ls >= 0 ? Math.floor(ls) : 0;
  }

  users.push(user);
  db.saveUsers(users);

  // 配置快捷内容开关
  if (typeof payload.quickTextEnabled === 'boolean') {
    upsertQuickByUser(user.id, { enabled: payload.quickTextEnabled });
  }

  try { emitToAdmins('admin:member-updated', toMemberView(user)); } catch {}
  res.json({ ok: true, item: toUserConfigView(user) });
});

// PUT /admin/api/user-config/:id  更新基础字段
adminRouter.put('/user-config/:id', requirePermission('frontend/frontend-user-config'), (req, res) => {
  const id = String(req.params.id || '').trim();
  if (!id) return res.status(400).json({ error: 'MISSING_ID' });
  const users = db.getUsers();
  const target = users.find(u => u.id === id) as User | undefined;
  if (!target) return res.status(404).json({ error: 'NOT_FOUND' });
  const { nickname, email, avatarUrl, membershipLevel, popularity, luckyStars, quickTextEnabled, gender } = (req.body || {}) as any;
  if (typeof nickname === 'string' && nickname.trim()) target.nickname = nickname.trim();
  if (typeof email === 'string' && email.trim()) {
    const exists = users.some(u => u.id !== id && (u.email || '').toLowerCase() === email.trim().toLowerCase());
    if (exists) return res.status(409).json({ error: 'EMAIL_EXISTS' });
    target.email = email.trim();
  }
  if (typeof avatarUrl === 'string') {
    (target as any).avatarUrl = avatarUrl.trim();
    (target as any).avatar = avatarUrl.trim();
  }
  if (typeof gender === 'string' && gender.trim()) {
    target.gender = normalizeGenderValue(gender);
  }
  if (membershipLevel && ['none','purple','crown'].includes(String(membershipLevel))) {
    target.membershipLevel = membershipLevel as User['membershipLevel'];
  }
  if (popularity !== undefined) {
    const num = Number(popularity);
    if (!Number.isFinite(num) || num < 0) return res.status(400).json({ error: 'INVALID_POPULARITY' });
    (target as any).popularity = Math.floor(num);
  }
  if (luckyStars !== undefined) {
    const ls = Number(luckyStars);
    if (!Number.isFinite(ls) || ls < 0) return res.status(400).json({ error: 'INVALID_LUCKY_STARS' });
    (target as any).luckyStars = Math.floor(ls);
  }
  db.saveUsers(users);
  if (quickTextEnabled !== undefined) {
    if (typeof quickTextEnabled !== 'boolean') return res.status(400).json({ error: 'INVALID_QUICK_FLAG' });
    upsertQuickByUser(id, { enabled: quickTextEnabled });
  }
  try { emitToAdmins('admin:member-updated', toMemberView(target)); } catch {}
  res.json({ ok: true, item: toUserConfigView(target) });
});

// PATCH /admin/api/user-config/:id/quick-text { enabled?: boolean }
adminRouter.patch('/user-config/:id/quick-text', requirePermission('frontend/frontend-user-config'), (req, res) => {
  const id = String(req.params.id || '').trim();
  if (!id) return res.status(400).json({ error: 'MISSING_ID' });
  const { enabled } = (req.body || {}) as { enabled?: unknown };
  if (enabled === undefined) return res.status(400).json({ error: 'MISSING_ENABLED' });
  if (typeof enabled !== 'boolean') return res.status(400).json({ error: 'INVALID_ENABLED' });
  const saved = upsertQuickByUser(id, { enabled });
  const users = db.getUsers();
  const target = users.find(u => u.id === id);
  res.json({ ok: true, item: target ? toUserConfigView(target) : { id, quickTextEnabled: saved.enabled } });
});

// POST /admin/api/user-config/delete { ids: string[] }
adminRouter.post('/user-config/delete', requirePermission('frontend/frontend-user-config'), (req, res) => {
  const { ids } = (req.body || {}) as { ids?: unknown };
  const normalized = Array.isArray(ids) ? Array.from(new Set(ids.map(i => String(i || '').trim()).filter(Boolean))) : [];
  if (!normalized.length) return res.status(400).json({ error: 'INVALID_IDS' });
  const users = db.getUsers();
  const remained = users.filter(u => !normalized.includes(u.id));
  const deleted = users.length - remained.length;
  if (!deleted) return res.status(404).json({ error: 'NOT_FOUND' });
  db.saveUsers(remained);
  res.json({ ok: true, deleted: normalized });
});

// -------- 管理员日志 --------
adminRouter.get('/admin-logs', requirePermission('auth/admin-logs'), (req, res) => {
  const keyword = String(req.query.keyword || '').trim().toLowerCase();
  const username = String(req.query.username || '').trim().toLowerCase();
  const page = Number(req.query.page || 1) || 1;
  const pageSize = Number(req.query.pageSize || 20) || 20;
  const start = String(req.query.start || '').trim() || undefined;
  const end = String(req.query.end || '').trim() || undefined;
  const all = listAdminLogs(start, end);
  const filtered = all.filter((log) => {
    const kwPass = !keyword || (
      String(log.id).includes(keyword) ||
      log.username.toLowerCase().includes(keyword) ||
      log.title.toLowerCase().includes(keyword) ||
      log.url.toLowerCase().includes(keyword) ||
      log.ip.toLowerCase().includes(keyword) ||
      log.browser.toLowerCase().includes(keyword)
    );
    const userPass = !username || log.username.toLowerCase() === username;
    return kwPass && userPass;
  });
  const total = filtered.length;
  const list = filtered.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);
  res.json({ ok: true, list, total, page, pageSize, start, end, username });
});

// 导出 CSV
adminRouter.get('/admin-logs/export', requirePermission('auth/admin-logs'), (req, res) => {
  const keyword = String(req.query.keyword || '').trim().toLowerCase();
  const username = String(req.query.username || '').trim().toLowerCase();
  const start = String(req.query.start || '').trim() || undefined;
  const end = String(req.query.end || '').trim() || undefined;
  const all = listAdminLogs(start, end).filter((log) => {
    const kwPass = !keyword || (
      String(log.id).includes(keyword) ||
      log.username.toLowerCase().includes(keyword) ||
      log.title.toLowerCase().includes(keyword) ||
      log.url.toLowerCase().includes(keyword) ||
      log.ip.toLowerCase().includes(keyword) ||
      log.browser.toLowerCase().includes(keyword)
    );
    const userPass = !username || log.username.toLowerCase() === username;
    return kwPass && userPass;
  });
  const header = ['id','username','title','url','ip','browser','createdAt'];
  const rows = all.map(l => [l.id,l.username,l.title,l.url,l.ip,l.browser,l.createdAt].map(v => `"${String(v).replace(/"/g,'""')}"`).join(','));
  const csv = [header.join(','), ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  const ts = new Date().toISOString().slice(0,10);
  res.setHeader('Content-Disposition', `attachment; filename="admin_logs_${start||''}_${end||''}_${ts}.csv"`);
  res.send(csv);
});

adminRouter.post('/admin-logs', requirePermission('auth/admin-logs'), (req, res) => {
  const payload = req.body || {};
  const ua = String(req.headers['user-agent'] || '');
  const admin = (req as any).admin as { username?: string };
  const title = String(payload.title || '').trim() || '操作';
  const url = String(payload.url || '').trim() || '';
  const ip = String(payload.ip || (req as any).ip || req.socket?.remoteAddress || '').replace('::ffff:', '') || '';
  const browser = String(payload.browser || ua || '');
  const username = String(payload.username || admin?.username || 'admin');
  const record = appendAdminLog({ username, title, url, ip, browser });
  res.json({ ok: true, item: record });
});

adminRouter.post('/admin-logs/delete', requirePermission('auth/admin-logs'), (_req, res) => {
  // 管理员日志禁止删除，统一返回 403
  return res.status(403).json({ error: 'LOG_DELETE_DISABLED' });
});

// -------- 菜单规则 --------
adminRouter.get('/rules', requirePermission('auth/rules'), (_req, res) => {
  const list = listAdminRules();
  res.json({ ok: true, list });
});

adminRouter.post('/rules', requirePermission('auth/rules'), (req, res) => {
  const { title, icon, rule, permCount, status, menu } = (req.body || {}) as any;
  if (typeof title !== 'string' || !title.trim()) return res.status(400).json({ error: 'INVALID_TITLE' });
  if (typeof rule !== 'string' || !rule.trim()) return res.status(400).json({ error: 'INVALID_RULE' });
  const record = createAdminRule({ title: String(title).trim(), icon: String(icon || '').trim(), rule: String(rule).trim(), permCount: Number(permCount), status: status === 'hidden' ? 'hidden' : 'active', menu: Boolean(menu) });
  writeAdminLog(req, `创建规则:${record.title}#${record.id}`);
  res.json({ ok: true, item: record });
});

adminRouter.put('/rules/:id', requirePermission('auth/rules'), (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'INVALID_ID' });
  const patch = req.body || {};
  const record = updateAdminRule(id, patch);
  if (!record) return res.status(404).json({ error: 'NOT_FOUND' });
  writeAdminLog(req, `更新规则:#${id}`);
  res.json({ ok: true, item: record });
});

adminRouter.post('/rules/delete', requirePermission('auth/rules'), (req, res) => {
  const { ids } = (req.body || {}) as { ids?: unknown };
  const normalized = Array.isArray(ids) ? ids.map((i) => Number(i)).filter((n) => Number.isFinite(n)) : [];
  if (!normalized.length) return res.status(400).json({ error: 'INVALID_IDS' });
  const result = deleteAdminRules(normalized);
  if (result.deleted) writeAdminLog(req, `删除规则:${normalized.join(',')}`);
  res.json({ ok: true, ...result });
});

export default adminRouter;

// ---------------- 聊天背景管理（统一权限控制） ----------------
const UI_CFG_PATH = join(process.cwd(), 'data', 'ui.json');
function readUiRaw(): any { try { if (!existsSync(UI_CFG_PATH)) return {}; return JSON.parse(readFileSync(UI_CFG_PATH, 'utf-8')); } catch { return {}; } }
function writeUiRaw(data: any){ try { const dir = join(process.cwd(), 'data'); if (!existsSync(dir)) mkdirSync(dir, { recursive: true }); writeFileSync(UI_CFG_PATH, JSON.stringify(data, null, 2), 'utf-8'); } catch {} }

// 列表
adminRouter.get('/chat-backgrounds', requirePermission('frontend/frontend-chat-backgrounds'), (_req, res) => {
  const raw = readUiRaw();
  res.json({ ok: true, list: raw.chatBackgrounds || [], activeId: raw.chatBackgroundActiveId || '', activeUrl: raw.chatBackground || '' });
});
// 启用
adminRouter.post('/chat-backgrounds/activate', requirePermission('frontend/frontend-chat-backgrounds'), (req, res) => {
  const { id } = (req.body || {}) as { id?: string };
  const targetId = String(id || '').trim();
  if (!targetId) return res.status(400).json({ error: 'MISSING_ID' });
  const raw = readUiRaw();
  const list: any[] = Array.isArray(raw.chatBackgrounds) ? raw.chatBackgrounds : [];
  const found = list.find(it => it.id === targetId);
  if (!found) return res.status(404).json({ error: 'NOT_FOUND' });
  raw.chatBackgroundActiveId = targetId;
  raw.chatBackground = found.url;
  raw.chatBackgrounds = list.map(it => ({ ...it, active: it.id === targetId }));
  writeUiRaw(raw);
  writeAdminLog(req, `启用聊天背景:${targetId}`);
  res.json({ ok: true, activeId: targetId, chatBackground: found.url });
});
// 删除（不能删除当前启用项）
adminRouter.post('/chat-backgrounds/delete', requirePermission('frontend/frontend-chat-backgrounds'), (req, res) => {
  const { ids } = (req.body || {}) as { ids?: unknown };
  const normalized = Array.isArray(ids) ? ids.map(i => String(i || '').trim()).filter(Boolean) : [];
  if (!normalized.length) return res.status(400).json({ error: 'INVALID_IDS' });
  const raw = readUiRaw();
  const list: any[] = Array.isArray(raw.chatBackgrounds) ? raw.chatBackgrounds : [];
  const remained = list.filter(it => !normalized.includes(it.id));
  if (!remained.find(it => it.id === raw.chatBackgroundActiveId)) {
    const active = list.find(it => it.id === raw.chatBackgroundActiveId);
    if (active) remained.unshift(active);
  }
  raw.chatBackgrounds = remained;
  writeUiRaw(raw);
  writeAdminLog(req, `删除聊天背景:${normalized.join(',')}`);
  res.json({ ok: true, deleted: normalized });
});

// -------------------- 控制台实时汇总（新增） --------------------
// GET /admin/api/dashboard/summary -> { ok: true, data }
// data 结构参见 public/admin/dashboard.js 渲染所需字段
adminRouter.get('/dashboard/summary', (req, res) => {
  // 基础数据读取（每次请求实时汇总，避免缓存带来的“非实时”）
  const users = db.getUsers();
  const messages = db.getMessages();
  const giftsCatalog = db.getGiftCatalog();
  const reviews = db.getReviews();
  const orders = (db as any).getOrders ? (db as any).getOrders() as import('../types').OrderRecord[] : [];

  // 管理员数量
  const admins = listAdmins();

  // 基础指标卡片
  const metrics = {
    members: users.length,
    messages: messages.length,
    gifts: giftsCatalog.length, // 实际为礼物分类数
    vip: admins.length // 这里展示为管理员总数
  } as const;

  // 快速统计（受限于现有数据结构，User 无注册/登录时间戳，这里给出保守计算与 0 回退）
  const startOfToday = (() => { const d = new Date(); d.setHours(0,0,0,0); return d.getTime(); })();
  const endOfToday = (() => { const d = new Date(); d.setHours(23,59,59,999); return d.getTime(); })();
  // 可用的数据源：消息/订单/点赞/访问等都有 createdAt，可用于活跃度侧写
  const todayMessages = messages.filter(m => m.createdAt >= startOfToday && m.createdAt <= endOfToday).length;
  const todayOrders = orders.filter(o => o.createdAt >= startOfToday && o.createdAt <= endOfToday && o.status === 'success').length;
  const quickStats = {
    todayRegister: 0, // 暂无注册时间，保留占位
    todayLogin: todayMessages, // 以“今日产生消息的次数”粗略侧写登录活跃
    threeIncrease: 0,
    sevenIncrease: 0,
    sevenActive: messages.filter(m => m.createdAt >= (Date.now() - 7*24*3600*1000)).length,
    monthActive: messages.filter(m => m.createdAt >= (Date.now() - 30*24*3600*1000)).length
  };

  // 数据集与静态资源概览
  const fs = require('fs');
  const path = require('path');
  const DATA_DIR = path.join(process.cwd(), 'data');
  const STATIC_DIR = path.join(DATA_DIR, 'static');

  function formatBytes(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes < 0) return '--';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0; let v = bytes;
    while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
    return `${v.toFixed(v >= 100 ? 0 : v >= 10 ? 1 : 2)} ${units[i]}`;
  }

  function walkFiles(dir: string, predicate?: (full: string, stat: any) => boolean): { count: number; size: number } {
    let total = 0; let size = 0;
    if (!fs.existsSync(dir)) return { count: 0, size: 0 };
    const stack: string[] = [dir];
    while (stack.length) {
      const d = stack.pop()!;
      const entries = fs.readdirSync(d, { withFileTypes: true });
      for (const ent of entries) {
        const full = path.join(d, ent.name);
        if (ent.isDirectory()) stack.push(full);
        else if (ent.isFile()) {
          const st = fs.statSync(full);
          if (!predicate || predicate(full, st)) {
            total++; size += st.size;
          }
        }
      }
    }
    return { count: total, size };
  }

  // 数据文件（.json）数量与总体积
  const dataJson = fs.existsSync(DATA_DIR)
    ? fs.readdirSync(DATA_DIR).filter((f: string) => f.endsWith('.json'))
    : [];
  const datasets = dataJson.length;
  const datasetSize = dataJson.reduce((sum: number, f: string) => {
    try { return sum + fs.statSync(path.join(DATA_DIR, f)).size; } catch { return sum; }
  }, 0);

  // 静态资源统计（附件/图片等）：统计 data/static 下所有文件，另单独统计常见图片格式
  const allStatic = walkFiles(STATIC_DIR);
  const imageExt = new Set(['.png','.jpg','.jpeg','.gif','.webp','.svg']);
  const images = walkFiles(STATIC_DIR, (full) => imageExt.has(path.extname(full).toLowerCase()));

  const summary = {
    categories: giftsCatalog.length,
    datasets,
    datasetSize: formatBytes(datasetSize),
    attachments: allStatic.count,
    attachmentsSize: formatBytes(allStatic.size),
    images: images.count,
    imagesSize: formatBytes(images.size)
  } as const;

  // Meta：待审核数量与更新时间
  const meta = {
    reviewPending: reviews.filter(r => r.status === 'pending').length,
    lastUpdated: new Date().toLocaleString('zh-CN')
  } as const;

  // 趋势：最近 7 日消息发送量
  const trend: Array<{ label: string; value: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(); day.setHours(0,0,0,0); day.setDate(day.getDate() - i);
    const start = day.getTime(); const end = start + 24*3600*1000 - 1;
    const label = `${String(day.getMonth()+1).padStart(2,'0')}-${String(day.getDate()).padStart(2,'0')}`;
    const value = messages.filter(m => m.createdAt >= start && m.createdAt <= end).length;
    trend.push({ label, value });
  }

  // 活动提醒：根据当前数据生成 3~5 条待办（示例）
  const pendingAvatar = reviews.filter(r => r.status === 'pending' && r.type === 'avatar').length;
  const pendingIdentity = reviews.filter(r => r.status === 'pending' && r.type === 'identity').length;
  const todaySuccessOrders = todayOrders;
  const activity = [
    { title: '待审核头像', detail: `共有 ${pendingAvatar} 条头像待审核`, meta: '审核中心 / 头像审核' },
    { title: '待审核身份', detail: `共有 ${pendingIdentity} 条身份待审核`, meta: '审核中心 / 身份审核' },
    { title: '今日消息量', detail: `今日收发消息 ${todayMessages} 条`, meta: '活跃概览' },
    { title: '今日成交', detail: `今日成功订单 ${todaySuccessOrders} 笔`, meta: '订单概览' }
  ];

  return res.json({ ok: true, data: { metrics, quickStats, summary, meta, trend, activity } });
});

// -------------------- 订单 & 金币消费管理（新增） --------------------
// 说明：前端页面 /admin/order-overview, /admin/recharge-records, /admin/coin-consumption
// 使用 /admin/api/orders 与 /admin/api/coins 相关端点获取数据与导出 CSV

// 统一的权限校验：分别对应超级管理员组内的
// 'orders/order-overview', 'orders/recharge-records', 'orders/coin-consumption'
function requireOrderOverviewPerm(req: any, res: any, next: any) {
  return requireAnyPermission(['orders/order-overview','orders/recharge-records'])(req, res, next);
}
function requireRechargePerm(req: any, res: any, next: any) {
  return requirePermission('orders/recharge-records')(req, res, next);
}
function requireCoinPerm(req: any, res: any, next: any) {
  return requirePermission('orders/coin-consumption')(req, res, next);
}

// 解析日期参数：
// - 支持时间戳（字符串或数字）
// - 支持 "YYYY-MM-DD"（start 为 00:00:00.000，end 为 23:59:59.999）
// - 支持其他 Date.parse 可识别的格式（含 "YYYY-MM-DD HH:mm" / ISO）
function parseDateParam(raw: unknown, isEnd = false): number | undefined {
  if (raw === undefined || raw === null) return undefined;
  const str = String(raw).trim();
  if (!str) return undefined;
  // 纯数字视为时间戳
  if (/^\d{10,13}$/.test(str)) {
    const n = Number(str.length === 10 ? Number(str) * 1000 : Number(str));
    return Number.isFinite(n) ? n : undefined;
  }
  // 仅日期
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d] = str.split('-').map((s) => Number(s));
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return undefined;
    const dt = new Date(y, m - 1, d, 0, 0, 0, 0);
    if (isEnd) {
      dt.setHours(23, 59, 59, 999);
    }
    const ts = dt.getTime();
    return Number.isFinite(ts) ? ts : undefined;
  }
  // 其他可解析格式（允许 "YYYY-MM-DD HH:mm"）
  const normalized = str.includes('T') ? str : str.replace(' ', 'T');
  const withSeconds = normalized.length === 16 ? `${normalized}:00` : normalized;
  const parsed = Date.parse(withSeconds);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function buildDateRangeFromQuery(qs: any): { start?: number; end?: number } {
  const start = parseDateParam(qs?.start, false);
  const end = parseDateParam(qs?.end, true);
  return { start, end };
}

// GET /admin/api/orders 订单/充值/升级记录列表（分页 + 过滤）
adminRouter.get('/orders', requireOrderOverviewPerm, (req, res) => {
  const page = Number(req.query.page || 1) || 1;
  const pageSize = Number(req.query.pageSize || 20) || 20;
  const keyword = String(req.query.keyword || '').trim();
  const statusRaw = String(req.query.status || 'all').trim();
  const typeRaw = String(req.query.type || 'all').trim();
  const status = ['success','failed','pending','all'].includes(statusRaw) ? statusRaw as any : 'all';
  const type = ['recharge','upgrade','all'].includes(typeRaw) ? typeRaw as any : 'all';
  const { start, end } = buildDateRangeFromQuery(req.query);
  const result = listOrders({ page, pageSize, keyword, status, type, start, end });
  res.json(result);
});

// -------------------- 点卡审核管理（新增） --------------------
// 权限：'orders/card-review'
function requireCardReviewPerm(req: any, res: any, next: any) {
  return requirePermission('orders/card-review')(req, res, next);
}

// GET /admin/api/cards 列表
adminRouter.get('/cards', requireCardReviewPerm, (req, res) => {
  const page = Number(req.query.page || 1) || 1;
  const pageSize = Number(req.query.pageSize || 20) || 20;
  const keyword = String(req.query.keyword || '').trim();
  const statusRaw = String(req.query.status || 'all').trim();
  const status = ['pending','approved','rejected','all'].includes(statusRaw) ? statusRaw as any : 'all';
  const result = listCardRedeems({ page, pageSize, keyword, status });
  // 增补会员等级字段：前端点卡审核需要展示用户最新会员等级
  try {
    const users = db.getUsers();
    const itemsWithLevels = result.items.map((r) => {
      const user = users.find((u) => u.id === r.userId);
      let membershipLevel: 'none'|'purple'|'crown' = (user as any)?.membershipLevel;
      if (!membershipLevel) {
        const legacy = (user as any)?.extra?.level;
        membershipLevel = legacy === 2 ? 'crown' : legacy === 1 ? 'purple' : 'none';
      }
      // 头像优先级：avatarUrl -> avatar -> 兼容旧结构 extra.avatar；若仍为空则交由前端用首字母占位
      const avatar = (user as any)?.avatarUrl || (user as any)?.avatar || (user as any)?.extra?.avatar || '';
      return { ...r, membershipLevel, avatar } as any; // 扩展字段：会员等级 + 头像
    });
    return res.json({ ...result, items: itemsWithLevels });
  } catch (e) {
    console.warn('[cards:list] augment membershipLevel failed:', e);
    return res.json(result);
  }
});

// POST /admin/api/cards/:id/approve
adminRouter.post('/cards/:id/approve', requireCardReviewPerm, (req, res) => {
  const id = String(req.params.id || '').trim();
  if (!id) return res.status(400).json({ error: 'MISSING_ID' });
  const updated = updateCardRedeemStatus(id, 'approved', (req as any).admin?.username);
  if (!updated) return res.status(404).json({ error: 'NOT_FOUND' });
  writeAdminLog(req, `点卡审核通过:${id}`);
  res.json({ ok: true, item: updated });
});

// POST /admin/api/cards/:id/reject
adminRouter.post('/cards/:id/reject', requireCardReviewPerm, (req, res) => {
  const id = String(req.params.id || '').trim();
  if (!id) return res.status(400).json({ error: 'MISSING_ID' });
  const { reason } = (req.body || {}) as { reason?: string };
  const updated = updateCardRedeemStatus(id, 'rejected', (req as any).admin?.username, reason);
  if (!updated) return res.status(404).json({ error: 'NOT_FOUND' });
  writeAdminLog(req, `点卡审核驳回:${id}`);
  res.json({ ok: true, item: updated });
});

// POST /admin/api/cards/delete 批量删除
adminRouter.post('/cards/delete', requireCardReviewPerm, (req, res) => {
  const { ids } = (req.body || {}) as { ids?: unknown };
  const normalized = Array.isArray(ids)
    ? Array.from(new Set(ids.map((item) => String(item || '').trim()).filter(Boolean)))
    : [];
  if (!normalized.length) return res.status(400).json({ error: 'INVALID_IDS' });
  const result = deleteCardRedeems(normalized);
  if (result.deleted.length) writeAdminLog(req, `点卡审核删除:${result.deleted.length}条`);
  res.json({ ok: true, ...result });
});

// POST /admin/api/orders/delete  删除订单（仅用于演示，实际生产慎重）
adminRouter.post('/orders/delete', requireRechargePerm, (req, res) => {
  const ids = Array.isArray((req.body||{}).ids) ? (req.body.ids as any[]).map(id => String(id||'').trim()).filter(Boolean) : [];
  if (!ids.length) return res.status(400).json({ error: 'INVALID_IDS' });
  const result = deleteOrders(ids);
  res.json({ ok: true, ...result });
});

// GET /admin/api/orders/summary 订单汇总（总营业额）
adminRouter.get('/orders/summary', requireOrderOverviewPerm, (req, res) => {
  const { start, end } = buildDateRangeFromQuery(req.query);
  const all = listOrders({ page:1, pageSize: 100000, start, end }).items; // 取全部（文件存储，性能可接受）
  let rechargePaid = 0;
  let upgradePaid = 0;
  let rechargeCount = 0;
  let upgradeCount = 0;
  let successCount = 0;
  for (const o of all) {
    if (o.type === 'recharge') {
      rechargeCount++; if (o.status === 'success') rechargePaid += o.paidAmount; }
    if (o.type === 'upgrade') {
      upgradeCount++; if (o.status === 'success') upgradePaid += o.paidAmount; }
    if (o.status === 'success') successCount++;
  }
  const totalPaid = rechargePaid + upgradePaid;
  res.json({
    ok: true,
    totalPaid,
    rechargePaid,
    upgradePaid,
    rechargeCount,
    upgradeCount,
    successRate: all.length ? +(successCount / all.length * 100).toFixed(2) : 0,
    orderCount: all.length
  });
});

// GET /admin/api/orders/export 导出 CSV（支持 keyword/status/type 过滤）
adminRouter.get('/orders/export', requireOrderOverviewPerm, (req, res) => {
  const keyword = String(req.query.keyword || '').trim();
  const statusRaw = String(req.query.status || 'all').trim();
  const typeRaw = String(req.query.type || 'all').trim();
  const status = ['success','failed','pending','all'].includes(statusRaw) ? statusRaw as any : 'all';
  const type = ['recharge','upgrade','all'].includes(typeRaw) ? typeRaw as any : 'all';
  const { start, end } = buildDateRangeFromQuery(req.query);
  const list = listOrders({ page:1, pageSize: 100000, keyword, status, type, start, end }).items;
  const header = ['id','orderNo','email','account','owner','amount','paidAmount','type','method','status','note','createdAt','paidAt'];
  const rows = list.map(o => [
    o.id, o.orderNo, o.email, o.account, o.owner, o.amount, o.paidAmount, o.type, o.method, o.status, o.note||'', o.createdAt, o.paidAt||''
  ].map(v => '"'+String(v).replace(/"/g,'""')+'"').join(','));
  const csv = [header.join(','), ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  const ts = new Date().toISOString().slice(0,10);
  const startLabel = req.query.start ? String(req.query.start).replace(/[^\dT: -]/g,'').replace('T','_') : '';
  const endLabel = req.query.end ? String(req.query.end).replace(/[^\dT: -]/g,'').replace('T','_') : '';
  const range = startLabel || endLabel ? `_${startLabel||''}_${endLabel||''}` : '';
  res.setHeader('Content-Disposition', `attachment; filename="orders${range}_${ts}.csv"`);
  res.send(csv);
});

// GET /admin/api/coins 金币消费记录（分页 + keyword + status）
adminRouter.get('/coins', requireCoinPerm, (req, res) => {
  const page = Number(req.query.page || 1) || 1;
  const pageSize = Number(req.query.pageSize || 20) || 20;
  const keyword = String(req.query.keyword || '').trim();
  const statusRaw = String(req.query.status || 'all').trim();
  const status = ['success','failed','pending','all'].includes(statusRaw) ? statusRaw as any : 'all';
  const { start, end } = buildDateRangeFromQuery(req.query);
  const result = listCoinConsumptions({ page, pageSize, keyword, status, start, end });
  res.json(result);
});

// POST /admin/api/coins/delete 删除金币消费记录
adminRouter.post('/coins/delete', requireCoinPerm, (req, res) => {
  const ids = Array.isArray((req.body||{}).ids) ? (req.body.ids as any[]).map(id => String(id||'').trim()).filter(Boolean) : [];
  if (!ids.length) return res.status(400).json({ error: 'INVALID_IDS' });
  const result = deleteCoinConsumptions(ids);
  res.json({ ok: true, ...result });
});

// GET /admin/api/coins/export 导出金币消费 CSV
adminRouter.get('/coins/export', requireCoinPerm, (req, res) => {
  const keyword = String(req.query.keyword || '').trim();
  const statusRaw = String(req.query.status || 'all').trim();
  const status = ['success','failed','pending','all'].includes(statusRaw) ? statusRaw as any : 'all';
  const { start, end } = buildDateRangeFromQuery(req.query);
  const list = listCoinConsumptions({ page:1, pageSize:100000, keyword, status, start, end }).items;
  const header = ['id','orderNo','account','owner','target','item','amount','status','note','createdAt'];
  const rows = list.map(r => [r.id,r.orderNo,r.account,r.owner,r.target||'',r.item,r.amount,r.status,r.note||'',r.createdAt]
    .map(v => '"'+String(v).replace(/"/g,'""')+'"').join(','));
  const csv = [header.join(','), ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  const ts = new Date().toISOString().slice(0,10);
  const startLabel = req.query.start ? String(req.query.start).replace(/[^\dT: -]/g,'').replace('T','_') : '';
  const endLabel = req.query.end ? String(req.query.end).replace(/[^\dT: -]/g,'').replace('T','_') : '';
  const range = startLabel || endLabel ? `_${startLabel||''}_${endLabel||''}` : '';
  res.setHeader('Content-Disposition', `attachment; filename="coin_consumption${range}_${ts}.csv"`);
  res.send(csv);
});

