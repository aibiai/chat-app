<template>
  <div class="flex flex-wrap gap-2">
    <button v-for="item in items" :key="item" type="button"
            @click="toggle(item)"
            :aria-pressed="selectedSet.has(item) ? 'true' : 'false'"
            class="px-3 h-9 rounded-pill border text-sm transition-all duration-250 ease-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-main/30"
            :class="selectedSet.has(item)
              ? 'bg-main text-white border-main shadow-brand hover:shadow-brandHover'
              : 'bg-white text-gray-700 border-gray-300 hover:border-main hover:shadow-sm active:scale-[0.98]'">
      {{ item }}
    </button>
  </div>
 </template>

<script setup lang="ts">
import { computed } from 'vue'
const props = withDefaults(defineProps<{ items: string[]; modelValue?: string[] }>(), { modelValue: () => [] })
const emit = defineEmits<{ (e: 'update:modelValue', v: string[]): void }>()
const selectedSet = computed(() => new Set(props.modelValue))
function toggle(v: string) {
  const set = new Set(props.modelValue)
  if (set.has(v)) set.delete(v); else set.add(v)
  emit('update:modelValue', Array.from(set))
}
</script>


