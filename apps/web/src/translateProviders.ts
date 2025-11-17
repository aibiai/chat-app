// Lightweight open-source translation provider fallbacks.
// Providers: LibreTranslate (https://libretranslate.com), MyMemory (https://mymemory.translated.net).
// NOTE: Public endpoints are rate-limited; avoid flooding with large batches.
// We keep each request under a per-call timeout and return null on failure.
// Language codes normalization: we map zh-CN -> zh, zh-TW -> zh for providers that only accept 'zh'.

export type LangCode = 'zh-CN' | 'zh-TW' | 'en' | 'ja' | 'ko' | 'auto'

const LIBRE_ENDPOINT = 'https://libretranslate.com/translate'
const MYMEMORY_ENDPOINT = 'https://api.mymemory.translated.net/get'

function normSource(c: string){
  if (/^zh(-CN)?$/i.test(c)) return 'zh'
  if (/^zh-TW$/i.test(c)) return 'zh'
  if (c === 'auto') return 'auto'
  return c
}
function normTarget(c: string){
  if (/^zh(-CN)?$/i.test(c)) return 'zh'
  if (/^zh-TW$/i.test(c)) return 'zh'
  return c
}

interface ProviderOptions { signal?: AbortSignal; timeoutMs?: number }

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T>{
  const ctrl = new AbortController()
  const t = setTimeout(()=> ctrl.abort(), ms)
  try {
    const res = await Promise.race([
      p,
      new Promise<T>((_, reject) => {
        ctrl.signal.addEventListener('abort', () => reject(new Error('timeout'))) })
    ])
    clearTimeout(t)
    return res as T
  } catch (e){
    clearTimeout(t)
    throw e
  }
}

export async function translateViaLibre(q: string, source: LangCode, target: LangCode, opts: ProviderOptions = {}): Promise<string|null>{
  const body: any = { q, source: normSource(source), target: normTarget(target), format: 'text' }
  if (body.source === body.target) return q
  try {
    const req = fetch(LIBRE_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: opts.signal })
    const resp = await withTimeout(req, opts.timeoutMs ?? 4000)
    if (!resp.ok) return null
    const data = await resp.json().catch(()=> null)
    const txt = data?.translatedText || data?.translation || null
    if (typeof txt === 'string' && txt.trim()) return txt.trim()
  } catch {}
  return null
}

export async function translateViaMyMemory(q: string, source: LangCode, target: LangCode, opts: ProviderOptions = {}): Promise<string|null>{
  const src = normSource(source)
  const tgt = normTarget(target)
  if (src === tgt) return q
  const url = new URL(MYMEMORY_ENDPOINT)
  url.searchParams.set('q', q)
  url.searchParams.set('langpair', `${src}|${tgt}`)
  try {
    const req = fetch(url.toString(), { signal: opts.signal })
    const resp = await withTimeout(req, opts.timeoutMs ?? 4500)
    if (!resp.ok) return null
    const data = await resp.json().catch(()=> null)
    const txt = data?.responseData?.translatedText || null
    if (typeof txt === 'string' && txt.trim()) return txt.trim()
  } catch {}
  return null
}

// Parallel race: ask multiple providers, return the first non-null result.
export async function translateRace(q: string, source: LangCode, target: LangCode): Promise<string|null>{
  const ctrl = new AbortController()
  const runners: Array<Promise<string|null>> = [
    translateViaLibre(q, source, target, { signal: ctrl.signal }),
    translateViaMyMemory(q, source, target, { signal: ctrl.signal })
  ]
  return new Promise(resolve => {
    let settled = 0
    runners.forEach(p => {
      p.then(r => {
        settled++
        if (r && r.trim()){ ctrl.abort(); resolve(r) }
        else if (settled === runners.length){ resolve(null) }
      }).catch(() => {
        settled++
        if (settled === runners.length){ resolve(null) }
      })
    })
  })
}
