<template>
  <div
    class="w-full"
  >
    <div
      class="flex items-center gap-3"
      :class="drag ? 'group' : ''"
      @dragover.prevent="onDragOver"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
    >
      <!-- 预览缩略图 -->
      <img
        v-if="showPreview && fileUrl"
        :src="fileUrl"
        :alt="fileName || 'preview'"
        class="rounded-md object-cover border"
        :style="{ width: previewSizePx, height: previewSizePx }"
      />

      <!-- 选择按钮 -->
      <label
        class="inline-flex items-center px-3 h-9 rounded-lg border bg-white text-gray-800 text-sm cursor-pointer hover:bg-gray-50 transition-colors duration-150 select-none whitespace-nowrap min-w-max"
        :class="[
          isDragging ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-300'
        ]"
      >
        <input ref="fileEl" type="file" class="hidden" :accept="accept" @change="onInputChange" />
        <slot name="icon">
          <svg class="mr-2 w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19 15v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-4H3l9-9 9 9h-2zM13 6.41 18.59 12H16v6H8v-6H5.41L11 6.41V4h2v2.41z"/></svg>
        </slot>
        <span>{{ displayButtonText }}</span>
      </label>

      <!-- 文件名/占位 -->
      <span class="text-sm text-gray-500 truncate max-w-[240px]" :aria-live="ariaLive">{{ fileName || displayNoFileText }}</span>

      <!-- 移除按钮 -->
      <button
        v-if="clearable && hasFile"
        type="button"
        class="ml-1 text-xs text-gray-500 hover:text-red-600"
        @click="clearFile"
      >{{ t('onboarding.upload.remove') }}</button>
    </div>

    <!-- 拖拽提示 -->
    <p v-if="drag" class="mt-1 text-xs text-gray-400">{{ t('onboarding.upload.dragDrop') }}</p>

    <!-- 错误提示 -->
    <p v-if="error" class="mt-1 text-xs text-red-600">{{ error }}</p>
  </div>
  <input v-if="false" aria-hidden="true" />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = withDefaults(defineProps<{
  accept?: string
  buttonText?: string
  noFileText?: string
  modelValue?: File | null
  ariaLive?: 'polite' | 'assertive' | 'off'
  maxSizeMB?: number
  drag?: boolean
  showPreview?: boolean
  clearable?: boolean
  previewSize?: number
}>(), {
  accept: '',
  buttonText: '',
  noFileText: '',
  modelValue: null,
  ariaLive: 'polite',
  maxSizeMB: 5,
  drag: true,
  showPreview: false,
  clearable: true,
  previewSize: 48,
})

const emit = defineEmits<{
  (e: 'update:modelValue', v: File | null): void
  (e: 'change', v: File | null): void
}>()

const { t } = useI18n()
const fileEl = ref<HTMLInputElement | null>(null)
const fileName = ref<string>('')
const fileUrl = ref<string>('')
const error = ref<string>('')
const isDragging = ref(false)

const displayButtonText = computed(() => props.buttonText || t('onboarding.chooseFile'))
const displayNoFileText = computed(() => props.noFileText || t('onboarding.noFile'))
const hasFile = computed(() => !!(props.modelValue))
const previewSizePx = computed(() => `${props.previewSize}px`)

function parseAccept(accept: string): ((f: File) => boolean) | null {
  if (!accept) return null
  const parts = accept.split(',').map(s => s.trim()).filter(Boolean)
  if (!parts.length) return null
  return (f: File) => {
    return parts.some(p => {
      if (p === '*/*') return true
      if (p.endsWith('/*')) {
        const typePrefix = p.slice(0, -2)
        return f.type.startsWith(typePrefix + '/')
      }
      // exact mime or extension
      if (p.includes('/')) return f.type === p
      if (p.startsWith('.')) return f.name.toLowerCase().endsWith(p.toLowerCase())
      return false
    })
  }
}

const acceptTester = computed(() => parseAccept(props.accept))

function validate(f: File): string | '' {
  if (props.maxSizeMB && f.size > props.maxSizeMB * 1024 * 1024) {
    return t('onboarding.upload.tooLarge', { max: props.maxSizeMB })
  }
  const tester = acceptTester.value
  if (tester && !tester(f)) {
    return t('onboarding.upload.invalidType')
  }
  return ''
}

function handleFile(f: File | null) {
  error.value = ''
  if (!f) {
    fileName.value = ''
    fileUrl.value = ''
    emit('update:modelValue', null)
    emit('change', null)
    return
  }
  const err = validate(f)
  if (err) {
    error.value = err
    return
  }
  fileName.value = f.name
  if (props.showPreview && f.type.startsWith('image/')) {
    fileUrl.value = URL.createObjectURL(f)
  } else {
    fileUrl.value = ''
  }
  emit('update:modelValue', f)
  emit('change', f)
}

const onInputChange = (e: Event) => {
  const target = e.target as HTMLInputElement | null
  const f = target?.files?.[0] || null
  handleFile(f)
}

function clearFile() {
  if (fileEl.value) fileEl.value.value = ''
  handleFile(null)
}

function onDragOver() { if (props.drag) isDragging.value = true }
function onDragLeave() { if (props.drag) isDragging.value = false }
function onDrop(e: DragEvent) {
  if (!props.drag) return
  isDragging.value = false
  const f = e.dataTransfer?.files?.[0] || null
  handleFile(f)
}

watch(() => props.modelValue, (f) => {
  fileName.value = f?.name || ''
  if (!f) {
    fileUrl.value = ''
  } else if (props.showPreview && f.type.startsWith('image/')) {
    fileUrl.value = URL.createObjectURL(f)
  } else {
    fileUrl.value = ''
  }
})

// 供父组件调用以主动打开文件选择框（用于点击头像触发）
defineExpose({
  open: () => { fileEl.value?.click() }
})
</script>

<style scoped>
</style>
