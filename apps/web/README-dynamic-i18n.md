# 动态多语言注入（Dynamic i18n)

本项目已支持在运行时将后端下发的文案注入到 `vue-i18n`，从而与现有静态翻译一样，随语言切换自动生效。

## 后端返回结构建议

推荐后端返回如下结构（仅需包含有的语言，其余会走 fallbackLocale 或可选择用 `en` 补齐）：

```json
{
  "translations": {
    "vipExtra.promo": {
      "en": "Limited time VIP discount",
      "zh-CN": "限时 VIP 折扣",
      "zh-TW": "限時 VIP 折扣",
      "ja": "期間限定VIP割引",
      "ko": "기간 한정 VIP 할인"
    },
    "marketing.banner1": {
      "en": "New event",
      "zh-CN": "新活动"
    }
  }
}
```

- 外层 key（如 `vipExtra.promo`、`marketing.banner1`）为 i18n key，可包含点号以表示层级。
- 内层对象是该 key 在不同语言的文本。

## 前端使用方式

在任意业务代码中（如 API 调用完成后）：

```ts
import { registerBackendResponse, registerDynamicTranslations } from './src/dynamicI18n'

// 方式一：直接用后端响应
registerBackendResponse(data, { namespace: undefined, overwrite: false, fillMissingFrom: 'en' })

// 方式二：自定义命名空间与 payload
registerDynamicTranslations(
  {
    promo: { en: 'Limited...', 'zh-CN': '限时...' }
  },
  { namespace: 'vipExtra' }
)
// 之后在组件里： t('vipExtra.promo')
```

选项说明：
- `namespace`：给所有 key 加上命名空间前缀（例如 `vipExtra.promo`）。
- `overwrite`：若为 `true`，将覆盖已有同名 key；默认不覆盖。
- `fillMissingFrom`：当某个语言缺失时，用该语言（默认 `en`）的内容填充；设为 `false` 可关闭填充。

## 在组件中演示（VipModal.vue）

`VipModal.vue` 支持一个可选 prop：`dynamicTexts`，当父组件传入时，会自动注入到命名空间 `vipExtra` 下，同时模板会在标题区域显示 `vipExtra.promo`（如存在）。

```vue
<VipModal :model-value="show" :dynamic-texts="{
  promo: { en: 'Limited...', 'zh-CN': '限时...' }
}" />
```

> 提示：如需判断某 key 是否存在，可使用 `useI18n` 提供的 `te()`。

## 注意事项
- 动态注入通过 `vue-i18n` 的 `mergeLocaleMessage` 完成，切换语言后会自动生效。
- 为避免 key 冲突，建议给后端动态文案统一加命名空间（如 `vipExtra.*` / `marketing.*`）。
- 仅对 `apps/web/src/i18n.ts` 中列出的语言生效：`zh-CN`、`zh-TW`、`en`、`ko`、`ja`。其他语言代码将被忽略。
