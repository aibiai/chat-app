#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

// 轻量繁简转换：使用 chinese-conv（不依赖原生组件，纯 JS）
// 兼容 ESM/CJS 加载
let chineseConv
try {
  const { createRequire } = await import('node:module')
  const req = createRequire(import.meta.url)
  // 先解析入口路径，再用 import() 动态加载，兼容 ESM/CJS
  const resolved = req.resolve('chinese-conv')
  const url = pathToFileURL(resolved).href
  const m = await import(url)
  chineseConv = m?.default || m
} catch (e1) {
  try {
    const m = await import('chinese-conv')
    chineseConv = m?.default || m
  } catch (e2) {
    try {
      const { createRequire } = await import('node:module')
      const req = createRequire(import.meta.url)
      const m = req('chinese-conv')
      chineseConv = m?.default || m
    } catch (e3) {
      console.warn('[build-info] chinese-conv 不可用，将跳过简体转换。')
    }
  }
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, '..')
const contentDir = path.join(root, 'content')
const zhTWDir = path.join(contentDir, 'zh-TW')
const localesDir = path.join(root, 'src', 'locales')

const targets = [
  { key: 'about', file: 'about.txt' },
  { key: 'terms', file: 'terms.txt' },
  { key: 'privacy', file: 'privacy.txt' },
  { key: 'security', file: 'security.txt' },
  { key: 'help', file: 'help.txt' },
  { key: 'contact', file: 'contact.txt' },
]

function readTxtAsParagraphs(fp) {
  if (!fs.existsSync(fp)) return null
  const raw = fs.readFileSync(fp, 'utf8')
  // 统一换行
  const norm = raw.replace(/\r\n?/g, '\n').trim()
  if (!norm) return []
  // 用空行分段；单行换行折叠为空格
  return norm
    .split(/\n{2,}/)
    .map(p => p.split(/\n+/).map(s => s.trim()).filter(Boolean).join(' '))
    .filter(Boolean)
}

function loadLocaleJSON(name) {
  const fp = path.join(localesDir, name)
  const json = JSON.parse(fs.readFileSync(fp, 'utf8'))
  return { fp, json }
}

function saveLocaleJSON(fp, json) {
  fs.writeFileSync(fp, JSON.stringify(json, null, 2), 'utf8')
}

function ensureInfoPath(json, sectionKey) {
  json.info = json.info || {}
  json.info.sections = json.info.sections || {}
  json.info.sections[sectionKey] = json.info.sections[sectionKey] || { title: json.info.sections?.[sectionKey]?.title || '', content: [] }
}

async function translateDeepL(texts, targetLang) {
  const key = process.env.DEEPL_API_KEY
  if (!key) return null
  try {
    const body = new URLSearchParams()
    for (const t of texts) {
      body.append('text', t)
    }
    body.append('target_lang', targetLang)
    const resp = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: { 'Authorization': `DeepL-Auth-Key ${key}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    })
    if (!resp.ok) {
      console.warn('[build-info] DeepL 请求失败', resp.status, await resp.text())
      return null
    }
    const data = await resp.json()
    const list = data.translations?.map(x => x.text) || null
    return list
  } catch (err) {
    console.warn('[build-info] DeepL 翻译异常', err)
    return null
  }
}

function polish(text, code) {
  let s = (text || '').trim()
  // 统一多空格
  s = s.replace(/\s{2,}/g, ' ')
  if (code === 'en') {
    // 句点后确保有空格
    s = s.replace(/([\.!?])(?!\s|$)/g, '$1 ')
    s = s.replace(/\s+([,;:])/g, '$1')
  } else if (code === 'ja' || code === 'ko') {
    // 去除与 CJK 标点相邻的多余空格
    s = s.replace(/\s+([、。！？；：，])/g, '$1')
    s = s.replace(/([、。！？；：，])\s+/g, '$1')
  }
  return s
}

function zhTWtoZHCNParagraphs(paragraphs) {
  if (!paragraphs) return null
  if (!chineseConv || typeof chineseConv.sify !== 'function') return paragraphs // 无转换库时，直接复用繁体
  try {
    // sify: 繁 -> 简
    return paragraphs.map(p => chineseConv.sify(p))
  } catch {
    // 兜底：原文
    return paragraphs
  }
}

async function main() {
  if (!fs.existsSync(zhTWDir)) {
    console.log('[build-info] 未找到 content/zh-TW 目录，跳过导入。')
    return
  }

  const { fp: zhTWfp, json: zhTW } = loadLocaleJSON('zh-TW.json')
  const { fp: zhCNfp, json: zhCN } = loadLocaleJSON('zh-CN.json')
  const langs = {
    en: loadLocaleJSON('en.json'),
    ja: loadLocaleJSON('ja.json'),
    ko: loadLocaleJSON('ko.json'),
  }

  const collected = {}
  for (const { key, file } of targets) {
    const txtPath = path.join(zhTWDir, file)
    const twParas = readTxtAsParagraphs(txtPath)
    if (!twParas) {
      console.log(`[build-info] 缺少 ${file}，已跳过該段落。`)
      continue
    }
    collected[key] = { tw: twParas, cn: zhTWtoZHCNParagraphs(twParas) }
  }

  // 写入繁体与简体 content
  for (const [k, val] of Object.entries(collected)) {
    ensureInfoPath(zhTW, k)
    ensureInfoPath(zhCN, k)
    zhTW.info.sections[k].content = val.tw
    zhCN.info.sections[k].content = val.cn || val.tw
  }

  // 可选：机翻到 en/ja/ko（仅在提供 DEEPL_API_KEY 时执行）
  const deeplTargets = [ ['en','EN-US'], ['ja','JA'], ['ko','KO'] ]
  if (process.env.DEEPL_API_KEY) {
    const cnAll = Object.values(collected).flatMap(v => v.cn || v.tw)
    if (cnAll.length) {
      for (const [code, target] of deeplTargets) {
        const res = await translateDeepL(cnAll, target)
        if (res && res.length === cnAll.length) {
          // 重新按照每节长度切分
          let idx = 0
          for (const [sectionKey, v] of Object.entries(collected)) {
            const len = (v.cn || v.tw).length
            const arr = res.slice(idx, idx + len).map(s => polish(s, code))
            idx += len
            const lang = langs[code]
            ensureInfoPath(lang.json, sectionKey)
            lang.json.info.sections[sectionKey].content = arr
          }
        } else {
          console.warn(`[build-info] ${code} 翻译失败或返回长度不一致，已跳过覆写。`)
        }
      }
    }
  } else {
    console.log('[build-info] 未配置 DEEPL_API_KEY，跳过 en/ja/ko 机翻。')
  }

  // 保存
  saveLocaleJSON(zhTWfp, zhTW)
  saveLocaleJSON(zhCNfp, zhCN)
  for (const k of Object.keys(langs)) saveLocaleJSON(langs[k].fp, langs[k].json)

  console.log('[build-info] 已完成 Info 文案导入。')
}

main().catch(e => {
  console.error('[build-info] 发生错误：', e)
  process.exitCode = 1
})
