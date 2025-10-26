<template>
  <div :class="['relative', block ? 'w-full' : 'inline-block']">
    <div class="relative">
      <input
        v-bind="$attrs"
        :type="type"
        :value="modelValue"
        @input="onInput"
        :placeholder="floatLabel && label ? ' ' : placeholder"
        :aria-invalid="!!error || undefined"
        :aria-describedby="ariaDescribedBy"
        :class="[
          'peer w-full border bg-white text-gray-900',
          roundedClass,
          'h-11 md:h-12',
          paddedLeft,
          paddedRight,
          'transition-colors duration-200 ease-soft',
          elevated ? 'shadow-sm shadow-black/5' : '',
          error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' : 'border-gray-300 focus:border-main focus:ring-main/30',
          'focus:outline-none focus:ring-2',
          (isDate && dateShell) ? 'text-transparent selection:bg-transparent caret-transparent' : ''
        ]"
        @focus="focused = true"
        @blur="focused = false"
      />
      <!-- 伪浮动标签壳：仅在 type=date 且有值时显示覆盖文本，保证跨浏览器一致性 -->
      <div v-if="isDate && dateShell && hasValue" class="absolute inset-0 pointer-events-none flex items-center">
        <div :class="['w-full truncate whitespace-nowrap text-gray-900', paddedLeft, paddedRight]">
          {{ displayDate }}
        </div>
      </div>
      <div v-if="leftIcon" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        <slot name="leftIcon" />
      </div>
      <div v-if="rightIcon" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
        <slot name="rightIcon" />
      </div>
      <!-- 文本前后缀插槽（非图标） -->
      <div v-if="hasPrefix" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
        <slot name="prefix" />
      </div>
      <div v-if="hasSuffix" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
        <slot name="suffix" />
      </div>
    <label v-if="floatLabel && label"
         class="absolute transition-all duration-200 ease-soft pointer-events-none"
         :class="[
           (focused || hasValue)
            ? 'top-1.5 text-[11px] -translate-y-0 text-gray-500 bg-white px-1'
            : 'top-1/2 -translate-y-1/2 text-gray-400',
           labelLeftClass
         ]">
        {{ label }}
      </label>
    </div>
    <transition name="fade-slide">
      <p v-if="hint && !error" :id="hintId" key="hint" class="mt-1 text-xs text-gray-500">{{ hint }}</p>
    </transition>
    <transition name="fade-slide">
      <p v-if="error" :id="errorId" key="err" class="mt-1 text-xs text-red-600">{{ error }}</p>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useSlots, toRefs } from 'vue'
import { i18n } from '../i18n'

const props = withDefaults(defineProps<{
  modelValue?: string
  type?: string
  placeholder?: string
  hint?: string
  error?: string
  block?: boolean
  rightIcon?: boolean
  leftIcon?: boolean
  label?: string
  floatLabel?: boolean
  rounded?: 'md' | 'lg' | 'pill'
  elevated?: boolean
  // 是否启用日期输入的伪浮动标签壳（隐藏原生文本，由覆盖层渲染）
  dateShell?: boolean
  // 覆盖层日期显示策略：'iso' 使用 YYYY-MM-DD；'locale' 使用当前语言环境格式
  dateDisplay?: 'iso' | 'locale'
  // 自定义日期格式化回调，优先级最高
  formatDate?: (value: string) => string
  // 指定日期展示顺序（仅在 dateShell 覆盖层有效）：YMD、DMY、MDY，不设置则使用 locale 或 iso 策略
  dateOrder?: 'YMD' | 'DMY' | 'MDY'
  // 指定日期分隔符，默认 '/'
  dateSeparator?: string
  // v-model 修饰符支持，例如 .trim
  modelModifiers?: Record<string, boolean>
}>(), {
  modelValue: '',
  type: 'text',
  placeholder: '',
  block: true,
  rightIcon: false,
  leftIcon: false,
  floatLabel: true,
  rounded: 'lg',
  elevated: false,
  dateShell: true,
  dateDisplay: 'locale',
  dateSeparator: '/',
  modelModifiers: () => ({} as Record<string, boolean>),
})

const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const focused = ref(false)
const hasValue = computed(() => !!props.modelValue)

const { block, type, placeholder, hint, error, rightIcon, leftIcon, label, floatLabel, rounded, elevated, dateShell, dateDisplay, formatDate, dateOrder, dateSeparator, modelModifiers } = toRefs(props)
const isDate = computed(() => type.value === 'date')
const slots = useSlots()
const hasPrefix = computed(() => !!slots.prefix)
const hasSuffix = computed(() => !!slots.suffix)
const labelLeftClass = computed(() => (leftIcon.value || hasPrefix.value) ? 'left-10' : 'left-3')
const paddedLeft = computed(() => (leftIcon.value || hasPrefix.value) ? 'pl-10' : 'pl-3')
const paddedRight = computed(() => (rightIcon.value || hasSuffix.value) ? 'pr-10' : 'pr-3')
const roundedClass = computed(() => {
  switch (rounded.value) {
    case 'pill': return 'rounded-full'
    case 'md': return 'rounded-md'
    default: return 'rounded-lg'
  }
})

// 将多种日期字符串安全格式化，用于覆盖层显示
const displayDate = computed(() => {
  const v = props.modelValue?.trim() || ''
  if (!v) return ''
  // 自定义优先
  if (typeof formatDate.value === 'function') {
    try { return (formatDate.value as any)(v) } catch { /* noop */ }
  }
  const d = /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(v + 'T00:00:00') : new Date(v)
  if (isNaN(d.getTime())) return v
  if (dateDisplay.value === 'iso') {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  // locale：尽量使用浏览器当前语言环境格式
  // 若指定 dateOrder 则按顺序/分隔符输出
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  if (dateOrder.value) {
    const joiner = '\u2060' // WORD JOINER，避免断行
    const sep = ((dateSeparator.value || '/') as string) + joiner
    const map: Record<'YMD'|'DMY'|'MDY', string[]> = {
      YMD: [String(y), m, day],
      DMY: [day, m, String(y)],
      MDY: [m, day, String(y)],
    }
    return map[dateOrder.value].join(sep)
  }
  try {
    const locale = i18n?.global?.locale?.value as string | undefined
    return new Intl.DateTimeFormat(locale || undefined, { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
  } catch {
    return `${y}-${m}-${day}`
  }
})

const onInput = (e: Event) => {
  const target = e.target as HTMLInputElement | null
  let value = target?.value ?? ''
  if (modelModifiers.value?.trim && typeof value === 'string') {
    value = value.trim()
  }
  emit('update:modelValue', value)
}

// aria: describedby id 绑定
const uid = Math.random().toString(36).slice(2, 8)
const hintId = `hint-${uid}`
const errorId = `err-${uid}`
const ariaDescribedBy = computed(() => {
  if (error.value) return errorId
  if (hint.value) return hintId
  return undefined
})
</script>

<style scoped>
.fade-slide-enter-active, .fade-slide-leave-active { transition: all 120ms ease; }
.fade-slide-enter-from, .fade-slide-leave-to { opacity: 0; transform: translateY(-2px); }
/* 隐藏浏览器内置的显隐/清除按钮，避免与自定义右侧图标冲突（Edge/IE/WebKit） */
input::-ms-reveal,
input::-ms-clear {
  display: none !important;
}
input[type="password"]::-ms-reveal,
input[type="password"]::-ms-clear {
  display: none !important;
}
/* WebKit 搜索清除按钮（保险起见，仅作用于 search 类型） */
input[type="search"]::-webkit-search-cancel-button {
  -webkit-appearance: none;
}
/* 通过 :global 再加一层全局兜底，避免 scoped 作用域影响选择器匹配 */
:global(input::-ms-reveal),
:global(input::-ms-clear),
:global(input[type="password"]::-ms-reveal),
:global(input[type="password"]::-ms-clear),
:global(input::-webkit-clear-button),
:global(input::-webkit-search-cancel-button),
:global(input::-webkit-credentials-auto-fill-button),
:global(input::-webkit-contacts-auto-fill-button) {
  display: none !important;
  -webkit-appearance: none !important;
}
</style>
