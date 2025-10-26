<template>
  <div :class="[
    'bg-white border border-[color:var(--border-muted,rgba(17,24,39,0.08))] rounded-xl transition-shadow duration-250 ease-soft',
    dense ? 'p-4' : 'p-6',
    shadow ? 'shadow-brand hover:shadow-brandHover' : 'shadow-sm'
  ]">
    <slot />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ dense?: boolean; shadow?: boolean }>(), {
  dense: false,
  shadow: true,
})
</script>
