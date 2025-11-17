// 动态注入后端下发的多语言内容工具
// 设计目标：
// 1. 后端可以一次返回多个 key，每个 key 内含不同语言文本
// 2. 前端调用 registerDynamicTranslations 后，这些 key 能与静态 locale 一样被 t() 使用
// 3. 支持可选 namespace，避免与现有 key 冲突
// 4. 默认不覆盖已有同名 key（可通过 overwrite 选项开启覆盖）
// 5. 利用 vue-i18n mergeLocaleMessage，保证语言切换时自动生效

import { i18n, SUPPORTED_LOCALES, type LocaleCode } from './i18n'

/** 后端建议返回结构：
 * {
 *   "translations": {
 *     "vipModal.dynamicPromo": {
 *        "en": "Limited time VIP discount",
 *        "zh-CN": "限时 VIP 折扣",
 *        "zh-TW": "限時 VIP 折扣",
 *        "ja": "期間限定VIP割引",
 *        "ko": "기간 한정 VIP 할인"
 *     },
 *     "marketing.banner1": { "en": "New event", "zh-CN": "新活动" }
 *   }
 * }
 */
export type DynamicTranslationsPayload = Record<
  string, // key (可含层级，如 a.b.c)
  Partial<Record<LocaleCode, string>> // 每个 locale 的翻译（可以缺失，缺失时走 fallbackLocale）
>

export interface RegisterDynamicOptions {
  /** 可选命名空间，会被加在 key 前面 namespace.key */
  namespace?: string
  /** 是否覆盖已有同名 key（默认 false） */
  overwrite?: boolean
  /** 当目标 locale 缺失时，是否用 sourceLocale（默认 en）文本填充 */
  fillMissingFrom?: LocaleCode | false
}

/** 已注入的 key 集合（调试使用，可视化 / 去重） */
const injectedKeys = new Set<string>()
export function getInjectedDynamicKeys() { return Array.from(injectedKeys) }

function buildNestedObject(path: string[], value: string) {
  return path.reduceRight<Record<string, any>>((acc, seg, idx, arr) => {
    if (idx === arr.length - 1) return { [seg]: value }
    return { [seg]: acc }
  }, {})
}

function deepMerge<T extends Record<string, any>>(target: T, source: T) {
  for (const k in source) {
    if (Object.prototype.hasOwnProperty.call(source, k)) {
      if (typeof target[k] === 'object' && target[k] && typeof source[k] === 'object' && source[k]) {
        deepMerge(target[k], source[k])
      } else {
        target[k] = source[k]
      }
    }
  }
  return target
}

export function registerDynamicTranslations(
  payload: DynamicTranslationsPayload,
  options: RegisterDynamicOptions = {}
) {
  const { namespace, overwrite = false, fillMissingFrom = 'en' } = options

  const localeCodes: LocaleCode[] = SUPPORTED_LOCALES.map(l => l.code as LocaleCode)

  // 为每个 locale 构建要 merge 的对象
  const perLocale: Record<LocaleCode, Record<string, any>> = Object.create(null)
  localeCodes.forEach(l => { perLocale[l] = {} })

  for (const rawKey in payload) {
    const baseKey = namespace ? `${namespace}.${rawKey}` : rawKey
    const entry = payload[rawKey]
    localeCodes.forEach(loc => {
      let text = entry[loc]
      if (!text && fillMissingFrom && fillMissingFrom in entry) {
        text = entry[fillMissingFrom]
      }
      if (!text) return // 仍为空，跳过（使用 vue-i18n fallback 机制）

      // 检查覆盖策略
      const existing = i18n.global.getLocaleMessage(loc)
      const pathSegments = baseKey.split('.')
      if (!overwrite) {
        // 走一遍读取现有值
        let cursor: any = existing
        for (const seg of pathSegments) {
          if (cursor == null) break
          cursor = cursor[seg]
        }
        if (cursor !== undefined) {
          // 已存在且不覆盖 -> 跳过当前 locale
          return
        }
      }

      const nested = buildNestedObject(pathSegments, text)
      deepMerge(perLocale[loc], nested)
      injectedKeys.add(baseKey)
    })
  }

  // 合并进入 vue-i18n
  for (const loc of localeCodes) {
    const block = perLocale[loc]
    if (Object.keys(block).length > 0) {
      i18n.global.mergeLocaleMessage(loc, block)
    }
  }
}

// 一个便捷函数：后端直接把 { translations: {...} } 返回时使用
export function registerBackendResponse(resp: { translations?: DynamicTranslationsPayload }, options?: RegisterDynamicOptions) {
  if (resp && resp.translations) {
    registerDynamicTranslations(resp.translations, options)
  }
}

// 示例（请在真实代码中移除此演示或放入调用处）：
// fetch('/api/i18n/vip').then(r => r.json()).then(data => {
//   registerBackendResponse(data, { namespace: 'vipExtra', overwrite: false })
//   // 之后即可： t('vipExtra.someKey')
// })
