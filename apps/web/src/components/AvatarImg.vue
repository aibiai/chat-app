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
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'

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
// 全站统一的头像版本号：当用户更新头像后广播事件，所有头像图片追加 ?v=xxx 以绕过缓存
const ver = ref(0)
function bump(){ ver.value++ }
onMounted(() => {
  const onUpdated = () => bump()
  window.addEventListener('me-avatar-updated', onUpdated as any)
  window.addEventListener('storage', (e: StorageEvent) => { if (e.key === 'avatarVersion') bump() })
  // 初次读取持久化版本（不同标签页同步）
  const v = Number(localStorage.getItem('avatarVersion') || '0')
  if (Number.isFinite(v) && v > 0) ver.value = v
})
onUnmounted(() => { /* 无需移除 storage；me-avatar-updated 足够轻量 */ })

const currentSrc = computed(() => {
  const raw = baseSrc.value
  const useFallback = !raw || broken.value
  const src = useFallback ? genderFallback.value : raw
  // data URL 不追加参数
  if (!src || /^data:/i.test(src)) return src
  const v = Number(ver.value || 0)
  if (!v) return src
  const sep = src.includes('?') ? '&' : '?'
  return src + sep + 'v=' + v
})

function onError() {
  // 第一次错误回退到性别默认；若本身就是默认，再回退到通用
  if (!broken.value) {
    broken.value = true
  }
}

watch(() => props.src, () => { broken.value = false; bump() })

const sizePx = computed(() => props.size ?? 40)
const inlineSize = computed(() => ({ width: `${sizePx.value}px`, height: `${sizePx.value}px` }))
const classes = computed(() => [
  'rounded-full object-cover border shadow-sm',
  props.class || ''
].join(' '))
</script>

<style scoped>
/* 覆盖全局 img 的响应式限制，防止在容器收缩时被横向压扁 */
img{
  object-fit: cover;
  max-width: none;      /* 不受父元素宽度限制，否则会出现宽度被压缩但高度仍固定为 size 的椭圆 */
  aspect-ratio: 1 / 1;  /* 进一步保证为正方形/圆形 */
  display: block;       /* 消除内联图片可能的额外空隙 */
  flex-shrink: 0;       /* 在 flex 容器中不要收缩 */
}
</style>
