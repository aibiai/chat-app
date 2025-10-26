<template>
  <img
    :src="currentSrc"
    :alt="alt || 'avatar'"
    :class="classes"
    :style="inlineSize"
    @error="onError"
    loading="lazy"
    decoding="async"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface Props {
  src?: string | null
  gender?: 'male'|'female'|'other'
  size?: number // square px
  alt?: string
  class?: string
}
const props = defineProps<Props>()

const defaultAvatarGeneric = 'https://placehold.co/128x128/png'
const defaultAvatarFemale = '/avatars/IMG_0819.PNG'
const defaultAvatarMale = '/avatars/IMG_0820.PNG'

const broken = ref(false)
const baseSrc = computed(() => props.src || '')
const genderFallback = computed(() => props.gender === 'female' ? defaultAvatarFemale : (props.gender === 'male' ? defaultAvatarMale : defaultAvatarGeneric))
const currentSrc = computed(() => {
  if (!baseSrc.value) return genderFallback.value
  return broken.value ? genderFallback.value : baseSrc.value
})

function onError() {
  // 第一次错误回退到性别默认；若本身就是默认，再回退到通用
  if (!broken.value) {
    broken.value = true
  }
}

watch(() => props.src, () => { broken.value = false })

const sizePx = computed(() => props.size ?? 40)
const inlineSize = computed(() => ({ width: `${sizePx.value}px`, height: `${sizePx.value}px` }))
const classes = computed(() => [
  'rounded-full object-cover border shadow-sm',
  props.class || ''
].join(' '))
</script>

<style scoped>
img{ object-fit: cover; }
</style>
