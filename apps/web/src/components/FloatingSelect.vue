<template>
  <div :class="['relative', block ? 'w-full' : 'inline-block']">
    <select
      v-bind="$attrs"
      :value="modelValue"
      @change="onChange"
      :aria-invalid="!!error || undefined"
      :aria-describedby="ariaDescribedBy"
      :class="[
        'peer w-full border bg-white text-gray-900 appearance-none',
        roundedClass,
        sizeClass,
        'pl-3 pr-10',
        'transition-colors duration-200 ease-soft',
        elevated ? 'shadow-sm shadow-black/5' : '',
        error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' : 'border-gray-300 focus:border-main focus:ring-main/30',
        'focus:outline-none focus:ring-2'
      ]"
      @focus="focused = true"
      @blur="focused = false"
    >
      <option v-if="placeholder && !modelValue" disabled value="">{{ placeholder }}</option>
      <slot />
    </select>
    <!-- 自定义下拉箭头 -->
    <svg class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 10l5 5 5-5z"/></svg>
    <label v-if="floatLabel && label"
      class="absolute transition-all duration-200 ease-soft pointer-events-none"
      :class="[
        (focused || hasValue) ? 'top-1.5 text-[11px] -translate-y-0 text-gray-500 bg-white px-1' : 'top-1/2 -translate-y-1/2 text-gray-400',
        labelLeftClass
      ]"
    >
      {{ label }}
    </label>
    <transition name="fade-slide">
      <p v-if="hint && !error" :id="hintId" key="hint" class="mt-1 text-xs text-gray-500">{{ hint }}</p>
    </transition>
    <transition name="fade-slide">
      <p v-if="error" :id="errorId" key="err" class="mt-1 text-xs text-red-600">{{ error }}</p>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, toRefs } from 'vue'

const props = withDefaults(defineProps<{
  modelValue?: string
  placeholder?: string
  hint?: string
  error?: string
  block?: boolean
  label?: string
  floatLabel?: boolean
  rounded?: 'md' | 'lg' | 'pill'
  size?: 'sm' | 'md' | 'lg'
  elevated?: boolean
}>(), {
  modelValue: '',
  placeholder: '',
  block: true,
  floatLabel: true,
  rounded: 'lg',
  size: 'md',
  elevated: false,
})

const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const focused = ref(false)
const hasValue = computed(() => !!props.modelValue)

const { block, placeholder, hint, error, label, floatLabel } = toRefs(props)
const labelLeftClass = computed(() => 'left-3')

const roundedClass = computed(() => {
  switch (props.rounded) {
    case 'pill': return 'rounded-full'
    case 'md': return 'rounded-md'
    default: return 'rounded-lg'
  }
})

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm': return 'h-10 text-sm'
    case 'lg': return 'h-12'
    default: return 'h-11 md:h-12'
  }
})

const onChange = (e: Event) => {
  const target = e.target as HTMLSelectElement | null
  emit('update:modelValue', target?.value ?? '')
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
</style>
