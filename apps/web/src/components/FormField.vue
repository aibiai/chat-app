<template>
  <label class="block">
    <span v-if="label" class="block mb-1 text-sm text-gray-700 tracking-tighter font-medium">{{ label }}</span>
    <slot />
    <transition name="fade-slide">
      <p v-if="help && !error" key="help" class="mt-1 text-xs text-gray-500">{{ help }}</p>
    </transition>
    <transition name="fade-slide">
      <p v-if="error" key="error" class="mt-1 text-xs text-red-600">{{ error }}</p>
    </transition>
  </label>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ label?: string; help?: string; error?: string }>(), {
  label: '',
  help: '',
  error: '',
})
</script>

<style scoped>
.fade-slide-enter-active, .fade-slide-leave-active { transition: all 150ms var(--ease, cubic-bezier(0.22, 1, 0.36, 1)); }
.fade-slide-enter-from, .fade-slide-leave-to { opacity: 0; transform: translateY(-2px); }
</style>
