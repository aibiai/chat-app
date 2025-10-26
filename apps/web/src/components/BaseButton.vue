<template>
  <button
    :class="[
      'inline-flex items-center justify-center rounded-lg font-medium select-none',
      'transition-colors duration-250 ease-soft',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-main/40',
      sizeClass,
      variantClass,
      disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-brandHover hover:-translate-y-0.5'
    ]"
    :disabled="disabled"
    v-bind="$attrs"
  >
    <svg v-if="loading" class="animate-spin mr-2" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M22 12a10 10 0 00-10-10"/></svg>
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'outline' | 'ghost' | 'gradient'
  disabled?: boolean
  loading?: boolean
  rounded?: 'md' | 'lg' | 'pill'
}>(), {
  size: 'md',
  variant: 'primary',
  disabled: false,
  loading: false,
  rounded: 'lg',
})

const sizeClass = computed(() => ({
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-base',
  lg: 'h-12 px-5 text-base',
}[props.size]))

const roundedClass = computed(() => ({
  md: 'rounded-md',
  lg: 'rounded-lg',
  pill: 'rounded-full',
}[props.rounded]))

const variantClass = computed(() => {
  const rc = roundedClass.value
  const map: Record<string, string> = {
    primary: `bg-main text-white shadow-sm ${rc}`,
    outline: `border border-main text-main bg-white ${rc}`,
    ghost: `text-main bg-transparent ${rc}`,
    gradient: `bg-gradient-to-r from-brandFrom to-brandTo text-white shadow-brand hover:shadow-brandHover ${rc}`,
  }
  return map[props.variant]
})
</script>
