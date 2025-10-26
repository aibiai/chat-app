import { Router, Request, Response } from 'express';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, extname } from 'path';
import multer from 'multer';

// 内容存储目录：data/info/{locale}.json
const DATA_DIR = join(process.cwd(), 'data');
const INFO_DIR = join(DATA_DIR, 'info');
const STATIC_DIR = join(DATA_DIR, 'static');
const UI_CFG_PATH = join(DATA_DIR, 'ui.json');

function ensureDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(INFO_DIR)) mkdirSync(INFO_DIR, { recursive: true });
  if (!existsSync(STATIC_DIR)) mkdirSync(STATIC_DIR, { recursive: true });
}

function localePath(locale: string) {
  ensureDir();
  return join(INFO_DIR, `${locale}.json`);
}

function readLocale(locale: string): any | null {
  const p = localePath(locale);
  if (!existsSync(p)) return null;
  try {
    const raw = readFileSync(p, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeLocale(locale: string, data: any) {
  const p = localePath(locale);
  writeFileSync(p, JSON.stringify(data, null, 2), 'utf-8');
}

// UI 配置（例如聊天背景图）
type UiConfig = { chatBackground?: string };
function readUiConfig(): UiConfig {
  try {
    if (!existsSync(UI_CFG_PATH)) return { chatBackground: '/static/chat-bg.jpg' };
    const raw = readFileSync(UI_CFG_PATH, 'utf-8');
    const data = JSON.parse(raw);
    return { chatBackground: data.chatBackground || '/static/chat-bg.jpg' };
  } catch {
    return { chatBackground: '/static/chat-bg.jpg' };
  }
}
function writeUiConfig(cfg: UiConfig) {
  const next = { chatBackground: cfg.chatBackground || '/static/chat-bg.jpg' };
  writeFileSync(UI_CFG_PATH, JSON.stringify(next, null, 2), 'utf-8');
}

// 简单的 schema：{ sections: { [key]: { title: string, content: string[] } } }
const DEFAULT_KEYS = ['about','terms','privacy','security','help','contact'];

export const contentRouter = Router();

// 优先注册主题与上传路由，避免被通配的 '/:locale' 捕获
// UI 主题配置：获取/更新聊天背景地址
contentRouter.get('/theme', (_req: Request, res: Response) => {
  const cfg = readUiConfig();
  res.json({ ok: true, data: cfg });
});
contentRouter.put('/theme', (req: Request, res: Response) => {
  const body: UiConfig = req.body || {};
  writeUiConfig(body);
  res.json({ ok: true });
});

// 上传聊天背景（multipart/form-data，字段名 file）
const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: (error: any, destination: string) => void) => { ensureDir(); cb(null, STATIC_DIR); },
  filename: (_req: Request, file: Express.Multer.File, cb: (error: any, filename: string) => void) => {
    const ext = extname(file.originalname || '') || '.jpg';
    const name = `chat-bg${ext}`; // 固定文件名，便于作为“默认背景”覆盖
    cb(null, name);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: (error: any, acceptFile?: boolean) => void) => {
    if ((file.mimetype || '').startsWith('image/')) return cb(null, true);
    return cb(new Error('Only image files are allowed'));
  }
});

contentRouter.post('/theme/upload', upload.single('file'), (req: Request, res: Response) => {
  const file = (req as any).file as Express.Multer.File | undefined;
  if (!file) return res.status(400).json({ ok: false, error: 'No file' });
  const url = `/static/${file.filename}`;
  writeUiConfig({ chatBackground: url });
  res.json({ ok: true, data: { chatBackground: url } });
});

// 获取某语言的内容
contentRouter.get('/:locale', (req: Request, res: Response) => {
  const { locale } = req.params;
  const data = readLocale(locale) || { sections: {} };
  for (const k of DEFAULT_KEYS) {
    if (!data.sections[k]) {
      data.sections[k] = { title: '', content: [] };
    }
  }
  res.json({ ok: true, data });
});

// 覆盖写入某语言内容（全量）
contentRouter.put('/:locale', (req: Request, res: Response) => {
  const { locale } = req.params;
  const body = req.body;
  if (!body || typeof body !== 'object' || !body.sections) {
    return res.status(400).json({ ok: false, error: 'Invalid body, expected { sections: {...} }' });
  }
  writeLocale(locale, body);
  res.json({ ok: true });
});

// 局部更新某语言内容（merge）
contentRouter.patch('/:locale', (req: Request, res: Response) => {
  const { locale } = req.params;
  const prev = readLocale(locale) || { sections: {} };
  const body = req.body || {};
  prev.sections = prev.sections || {};
  const incoming = body.sections || {};
  for (const key of Object.keys(incoming)) {
    const sec = incoming[key];
    if (!prev.sections[key]) prev.sections[key] = { title: '', content: [] };
    if (typeof sec?.title === 'string') prev.sections[key].title = sec.title;
    if (Array.isArray(sec?.content)) prev.sections[key].content = sec.content;
  }
  writeLocale(locale, prev);
  res.json({ ok: true });
});

// 使用开源公共翻译 API（LibreTranslate）进行翻译代理
// POST /api/content/translate { q, source, target }
// 简易内存缓存（LRU 近似）：加速重复翻译
type CacheVal = { text: string; at: number };
const TRANS_CACHE = new Map<string, CacheVal>();
const MAX_CACHE = 2000;
const TTL_MS = 1000 * 60 * 30; // 30 分钟
function cacheKey(q: string, s: string, t: string){ return `${s}|${t}|${q}` }
function getCache(q: string, s: string, t: string){
  const k = cacheKey(q, s, t);
  const v = TRANS_CACHE.get(k);
  if (!v) return null;
  if (Date.now() - v.at > TTL_MS){ TRANS_CACHE.delete(k); return null; }
  // touch: 先删后设保持最近使用在 Map 尾部
  TRANS_CACHE.delete(k); TRANS_CACHE.set(k, { text: v.text, at: Date.now() });
  return v.text;
}
function setCache(q: string, s: string, t: string, text: string){
  const k = cacheKey(q, s, t);
  TRANS_CACHE.set(k, { text, at: Date.now() });
  if (TRANS_CACHE.size > MAX_CACHE){
    // 删除最旧的一批（近似 LRU）
    const rm = Math.max(1, Math.floor(MAX_CACHE * 0.1));
    const it = TRANS_CACHE.keys();
    for (let i = 0; i < rm; i++){ const n = it.next(); if (n.done) break; TRANS_CACHE.delete(n.value as string); }
  }
}

contentRouter.post('/translate', async (req: Request, res: Response) => {
  const { q, source, target, format } = req.body || {};
  if (!q || !source || !target) {
    return res.status(400).json({ ok: false, error: 'Missing q/source/target' });
  }

  // 保持请求语种原样（区分 zh-CN / zh-TW），用于缓存与同语种判断；
  // 但对上游 LibreTranslate 调用采用 ltSource/ltTarget（将中文归一为 zh）。
  const normalizeLangKeep = (l: string) => ({ 'zh-CN': 'zh-CN', 'zh-TW': 'zh-TW' } as Record<string,string>)[l] || l;
  const requested = {
    q,
    source: normalizeLangKeep(String(source || 'auto')),
    target: normalizeLangKeep(String(target)),
    format: format || 'text'
  };
  const ltSource = requested.source === 'zh-CN' || requested.source === 'zh-TW' ? 'zh' : requested.source;
  const ltTarget = requested.target === 'zh-CN' || requested.target === 'zh-TW' ? 'zh' : requested.target;

  // 如果源和目标相同，直接返回原文（避免上游报错且更快）
  if (requested.source !== 'auto' && requested.source === requested.target){
    return res.json({ ok: true, data: { translatedText: q, upstream: 'short-circuit' } });
  }

  // 缓存命中则直接返回
  const cached = requested.source !== 'auto' ? getCache(q, requested.source, requested.target) : null;
  if (cached){
    return res.json({ ok: true, data: { translatedText: cached, upstream: 'cache' } });
  }

  // Endpoints list: env override or sensible defaults (public LibreTranslate instances)
  const envList = process.env.LIBRE_TRANSLATE_ENDPOINTS;
  const DEFAULT_LT_ENDPOINTS = [
    'https://translate.astian.org/translate',
    'https://libretranslate.com/translate',
    'https://translate.argosopentech.com/translate',
    'https://translate.terraprint.co/translate'
  ];
  const endpoints = (envList ? envList.split(',') : DEFAULT_LT_ENDPOINTS).map(s => s.trim()).filter(Boolean);
  if (!endpoints.length) {
    return res.status(500).json({ ok: false, error: 'No translate endpoints configured' });
  }

  // helper: fetch with timeout
  const fetchWithTimeout = (url: string, body: any, timeoutMs: number) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-By': 'chat-app'
      },
      body: JSON.stringify(body),
      signal: controller.signal
    }).finally(() => clearTimeout(id));
  };

  // Race all endpoints; return first successful JSON with translation field
  const perEndpointTimeout = Number(process.env.LIBRE_TRANSLATE_TIMEOUT_MS || 3500);
  const startedAt = Date.now();
  const aborters: AbortController[] = [];
  let settled = false;

  try {
    const attempts = endpoints.map((url) => (async () => {
      try {
  const resp = await fetchWithTimeout(url, { q, source: ltSource, target: ltTarget, format: requested.format }, perEndpointTimeout);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        const text = data?.translatedText ?? data?.translation ?? data?.data?.translatedText ?? null;
        if (!text || typeof text !== 'string') throw new Error('Invalid translate response');
        return { ok: true, data } as const;
      } catch (e: any) {
        return { ok: false, error: e?.message || String(e) } as const;
      }
    })());

    // Return first successful attempt immediately
    // Polyfill-like: resolve with first successful attempt (ok=true); otherwise collect errors
    const first = await new Promise<{ ok: boolean; data?: any; errors?: any[] }>((resolve) => {
      let finished = false;
      let remaining = attempts.length;
      const errors: any[] = [];
      attempts.forEach(p => {
        p.then(r => {
          if (finished) return;
          if (r.ok) { finished = true; resolve({ ok: true, data: r.data }); return; }
          errors.push(r.error);
          remaining -= 1;
          if (remaining === 0) resolve({ ok: false, errors });
        }).catch(err => {
          if (finished) return;
          errors.push(err?.message || String(err));
          remaining -= 1;
          if (remaining === 0) resolve({ ok: false, errors });
        });
      });
    });
    if (first.ok) {
      settled = true;
      let text = first.data?.translatedText ?? first.data?.data?.translatedText ?? first.data?.data?.translation;
      // 若请求目标为 zh-TW，则进行简转繁（上游 zh 常返回简体）
      if (requested.target === 'zh-TW' && typeof text === 'string') {
        text = toTraditional(text);
      }
      if (text && requested.source !== 'auto') setCache(q, requested.source, requested.target, text);
      return res.json({ ok: true, data: { translatedText: text, upstream: first.data?.upstream || 'libre' }, elapsedMs: Date.now() - startedAt });
    }

    // Fallback tier 2: Lingva (open-source frontend to Google Translate) public instances
    const LINGVA_ENDPOINTS = (process.env.LINGVA_ENDPOINTS || 'https://lingva.ml/api/v1,https://lingva.garudalinux.org/api/v1,https://lingva.pro/api/v1')
      .split(',').map(s => s.trim()).filter(Boolean);
    const lingvaTimeout = Number(process.env.LINGVA_TIMEOUT_MS || 3500);
    const tryLingva = async (base: string) => {
  const url = `${base}/${encodeURIComponent(requested.source === 'auto' ? 'auto' : requested.source)}/${encodeURIComponent(requested.target)}/${encodeURIComponent(q)}`;
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), lingvaTimeout);
      try {
        const r = await fetch(url, { headers: { 'Accept': 'application/json' }, signal: controller.signal });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const jd = await r.json();
        const text = jd?.translation || jd?.translatedText || jd?.result || null;
        if (!text || typeof text !== 'string') throw new Error('Invalid Lingva response');
        return { ok: true as const, data: { translatedText: text, upstream: 'lingva', base } };
      } catch (e: any) {
        return { ok: false as const, error: e?.message || String(e) };
      } finally { clearTimeout(id); }
    };
    for (const base of LINGVA_ENDPOINTS) {
      const r = await tryLingva(base);
      if (r.ok) {
        const text = r.data?.translatedText;
        if (text && requested.source !== 'auto') setCache(q, requested.source, requested.target, text);
        return res.json({ ok: true, data: r.data, elapsedMs: Date.now() - startedAt });
      }
    }

    // Fallback tier 3: MyMemory (free, rate limited)
    const mapForMyMemory = (code: string) => {
      const m: Record<string,string> = { 'zh': 'zh-CN', 'zh-CN': 'zh-CN', 'zh-TW': 'zh-TW' };
      return m[code] || code;
    };
    try {
  const src = mapForMyMemory(requested.source === 'auto' ? 'en' : requested.source); // MyMemory needs specific src; no auto => pick en heuristic
  const dst = mapForMyMemory(requested.target);
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=${encodeURIComponent(src)}|${encodeURIComponent(dst)}`;
      const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (r.ok) {
        const jd = await r.json();
        const text = jd?.responseData?.translatedText || null;
        if (text && typeof text === 'string') {
          const out = requested.target === 'zh-TW' ? toTraditional(text) : text;
          if (requested.source !== 'auto') setCache(q, requested.source, requested.target, out);
          return res.json({ ok: true, data: { translatedText: out, upstream: 'mymemory' }, elapsedMs: Date.now() - startedAt });
        }
      }
    } catch {}

    return res.status(502).json({ ok: false, error: 'All translate endpoints failed', detail: first.errors || [] });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err?.message || 'Translate error' });
  } finally {
    // nothing to abort explicitly as per-endpoint has its own timeout
    void settled; // keep linter calm
  }
});

// 轻量简体转繁体转换（常见字表 + 部分词语）。为保持零依赖，使用最小可维护表。
// 如需更高准确度，可换用开源库（例如 opencc-js），但需权衡体积与许可。
const SC2TC_TABLE: Record<string, string> = {
  // 常见词汇优先（长词优先替换）
  '汉语': '漢語', '登录': '登入', '注册': '註冊', '翻译': '翻譯', '设置': '設定', '消息': '訊息', '用户': '使用者', '喜欢': '喜歡', '礼物': '禮物', '后台': '後台', '主页': '主頁', '文件': '檔案', '关系': '關係', '为什么': '為什麼',
  // 常见单字
  '汉': '漢','语': '語','马': '馬','门': '門','风': '風','龙': '龍','丽': '麗','云': '雲','台': '臺','复': '復','发': '發','万': '萬','与': '與','个': '個','为': '為','义': '義','习': '習','书': '書','买': '買','东': '東','丝': '絲','两': '兩','严': '嚴','业': '業','丛': '叢','丰': '豐','临': '臨'
};
function toTraditional(input: string): string {
  if (!input || typeof input !== 'string') return input as any;
  // 先进行词语级替换（长词优先）
  const phrases = Object.keys(SC2TC_TABLE).filter(k => k.length > 1).sort((a,b)=>b.length - a.length);
  let out = input;
  for (const p of phrases) {
    const re = new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g');
    out = out.replace(re, SC2TC_TABLE[p]);
  }
  // 再进行单字级替换
  const singles = Object.keys(SC2TC_TABLE).filter(k => k.length === 1);
  if (singles.length) {
    const map: Record<string,string> = {};
    for (const k of singles) map[k] = SC2TC_TABLE[k];
    out = out.split('').map(ch => map[ch] || ch).join('');
  }
  return out;
}
