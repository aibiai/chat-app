<template>
  <teleport to="body">
    <div v-if="modelValue" class="redeem-overlay" @click.self="close">
      <div class="redeem-modal" role="dialog" aria-modal="true">
        <button type="button" class="close" :aria-label="t('common.close')" @click="close">×</button>

        <header class="redeem-heading">
          <h2>{{ title }}</h2>
        </header>

        <section class="redeem-message">
          <p class="message" v-html="messageHtml"></p>
        </section>

        <section class="upload-grid">
          <label v-for="(slot, index) in slots" :key="index" class="upload-card" :class="{ disabled: disabledUpload }">
            <input
              class="file-input"
              type="file"
              accept="image/*"
              :aria-label="uploadAria(index + 1)"
              :disabled="disabledUpload"
              @change="onFileChange(index, $event)"
            />

            <div v-if="slot.preview" class="preview" :style="{ backgroundImage: `url(${slot.preview})` }" />
            <div v-else class="placeholder" aria-hidden="true">
              <svg viewBox="0 0 48 48" width="60" height="60" fill="currentColor">
                <path
                  d="M8 6h20a4 4 0 0 1 4 4v8h8a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4H20a4 4 0 0 1-4-4v-8h-8a4 4 0 0 1-4-4V10a4 4 0 0 1 4-4Zm12 30v4a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2V22a2 2 0 0 0-2-2h-8v10a4 4 0 0 1-4 4ZM8 8a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2ZM12 12h8v4h-8Zm0 8h8v4h-8Z"
                />
              </svg>
            </div>
            <span class="upload-tip">{{ slot.preview ? uploadReplaceLabel : uploadEmptyLabel }}</span>
          </label>
        </section>

        <footer class="actions">
          <button
            v-if="status === 'idle' || status === 'rejected'"
            type="button"
            class="btn primary"
            :disabled="disabledSubmit && status !== 'rejected'"
            @click="status === 'rejected' ? resetForResubmit() : confirm()"
          >{{ submitText }}</button>
          <button
            v-if="status === 'pending'"
            type="button"
            class="btn primary pending"
            disabled
          >{{ pendingText }}</button>
          <button
            v-if="status === 'pending'"
            type="button"
            class="btn secondary"
            disabled
          >{{ waitingText }}</button>
          <button
            v-if="status === 'approved'"
            type="button"
            class="btn primary"
            :disabled="disabledSubmit"
            @click="onApprovedClick"
          >{{ approvedText }}</button>
          <!-- 已移除“继续添加”按钮，上传补图逻辑保留（若需要可在空 slot 点击） -->
        </footer>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch, withDefaults, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getCardRedeemMessage } from '../content'
import api from '../api'

interface SlotState {
  file: File | null
  preview: string | null
}

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    maxSlots?: number
  }>(),
  {
    maxSlots: 4
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', files: File[]): void
}>()

// 同时获取 locale 以便监听语言切换
const { t, locale: activeLocale } = useI18n()

const title = computed(() => t('cardRedeemModal.title'))
// 动态后端覆盖：若存在 sections.cardRedeem.content[0] 则优先使用（支持 HTML）
const dynamicMessage = ref<string>('')
const messageHtml = computed(() => dynamicMessage.value || t('cardRedeemModal.message'))
const uploadEmptyLabel = computed(() => t('cardRedeemModal.uploadEmpty'))
const uploadReplaceLabel = computed(() => t('cardRedeemModal.uploadReplace'))
const confirmLabel = computed(() => t('cardRedeemModal.confirm'))
// 新增状态相关文案
const pendingText = computed(() => t('cardRedeemModal.pending') || t('onboarding.status.pending'))
const waitingText = computed(() => t('cardRedeemModal.waiting') || t('cardRedeemModal.submittedSuccess'))
const retryText = computed(() => t('cardRedeemModal.retry') || t('settings.verify.resubmit') || '重新提交')
const approvedText = computed(() => t('cardRedeemModal.approved') || t('onboarding.status.approved') || '已通过')
const failedText = computed(() => t('cardRedeemModal.failed') || t('onboarding.status.rejected') || '兑换失败')
const uploadAria = (index: number) => t('cardRedeemModal.uploadAria', { index })

const slots = ref<SlotState[]>(Array.from({ length: props.maxSlots }, () => ({ file: null, preview: null })))

// 状态：idle 初始；pending 审核中；approved 审核通过；rejected 审核失败
const status = ref<'idle' | 'pending' | 'approved' | 'rejected'>('idle')
let pollTimer: number | null = null

const disabledUpload = computed(() => status.value === 'pending')
const disabledSubmit = computed(() => status.value === 'pending' || !slots.value.some(s => s.file))
const submitText = computed(() => {
  if (status.value === 'rejected') return failedText.value
  return confirmLabel.value
})

watch(
  () => props.maxSlots,
  (count) => {
    const next: SlotState[] = []
    for (let i = 0; i < count; i += 1) {
      next.push(slots.value[i] ?? { file: null, preview: null })
    }
    slots.value = next
  }
)

async function refreshDynamicMessage(localeCode: string | number | undefined) {
  const code = typeof localeCode === 'string' ? localeCode : String(localeCode || 'zh-CN')
  try {
    const html = await getCardRedeemMessage(code)
    dynamicMessage.value = html || ''
  } catch {
    dynamicMessage.value = ''
  }
}

watch(
  () => props.modelValue,
  async (open) => {
    if (!open) {
      slots.value = Array.from({ length: props.maxSlots }, () => ({ file: null, preview: null }))
      status.value = 'idle'
      stopPoll()
      return
    }
    // 弹窗打开时尝试加载动态文案（按当前语言）
    await refreshDynamicMessage(activeLocale.value as string)
    // 打开时立即取一次状态
    await fetchStatus()
    startPoll()
  }
)

// 语言切换时刷新动态文案（避免仍显示旧语言）
watch(activeLocale, async (code) => {
  await refreshDynamicMessage(code)
})

function close() {
  emit('update:modelValue', false)
  slots.value = Array.from({ length: props.maxSlots }, () => ({ file: null, preview: null }))
  stopPoll()
}

function onFileChange(index: number, event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    slots.value[index] = {
      file,
      preview: typeof reader.result === 'string' ? reader.result : null
    }
  }
  reader.readAsDataURL(file)
  input.value = ''
}

function collectFiles(): File[] {
  return slots.value.map((slot) => slot.file).filter((file): file is File => Boolean(file))
}

function confirm() {
  const files = collectFiles()
  emit('confirm', files)
  // 不立即关闭；转为 pending 状态并禁用交互，保留预览
  status.value = 'pending'
  startPoll()
}

// continueUpload 已移除

function resetAndClose() {
  close()
}

function onApprovedClick() {
  // 已审核通过时，只有当再次选择了图片才触发提交；否则无动作
  if (disabledSubmit.value) return
  confirm()
}

function resetForResubmit() {
  // 清空失败的图片并回到初始
  slots.value = Array.from({ length: props.maxSlots }, () => ({ file: null, preview: null }))
  status.value = 'idle'
}

async function fetchStatus() {
  try {
    const { data } = await api.get('/api/cards/redeem/status')
    const s = String(data?.status || 'none')
    if (s === 'pending') status.value = 'pending'
    else if (s === 'approved') status.value = 'approved'
    else if (s === 'rejected') status.value = 'rejected'
    else if (s === 'none') status.value = 'idle'
    // 若后端返回了上一轮提交的图片，且当前本地还没有预览，则用于展示
    const imgs: string[] = Array.isArray(data?.images) ? data.images.filter((x: any) => typeof x === 'string' && x) : []
    if ((status.value === 'pending' || status.value === 'rejected') && imgs.length && slots.value.every(s => !s.preview)) {
      const next: SlotState[] = Array.from({ length: props.maxSlots }, () => ({ file: null, preview: null }))
      for (let i = 0; i < Math.min(imgs.length, next.length); i += 1) {
        next[i] = { file: null, preview: imgs[i] }
      }
      slots.value = next
    }
  } catch {}
}

function startPoll() {
  stopPoll()
  if (status.value === 'pending') {
    pollTimer = window.setInterval(() => {
      fetchStatus().then(() => {
        if (status.value !== 'pending') stopPoll()
      })
    }, 5000)
  }
}
function stopPoll() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

onUnmounted(() => stopPoll())

defineExpose({ close })
</script>

<style scoped>
.redeem-overlay {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.45);
  z-index: 10000;
}

.redeem-modal {
  position: relative;
  width: min(92vw, 640px);
  border-radius: 24px;
  padding: 28px 26px 32px;
  background: linear-gradient(160deg, #ffe0ef 0%, #ffd4f2 50%, #ffc9e7 100%);
  box-shadow: 0 24px 60px rgba(255, 115, 166, 0.35);
  overflow: hidden;
}

.redeem-modal::before {
  content: '';
  position: absolute;
  width: 520px;
  height: 520px;
  right: -220px;
  bottom: -260px;
  background: radial-gradient(circle at center, rgba(255, 133, 195, 0.45), rgba(255, 133, 195, 0));
  pointer-events: none;
}

.close {
  position: absolute;
  top: 16px;
  right: 20px;
  border: 0;
  background: transparent;
  font-size: 26px;
  line-height: 1;
  color: rgba(120, 49, 86, 0.85);
  cursor: pointer;
}

.close:hover {
  color: rgba(120, 49, 86, 1);
}

.redeem-heading {
  text-align: center;
  margin-bottom: 18px;
}

.redeem-heading h2 {
  font-size: 26px;
  font-weight: 800;
  letter-spacing: 1.6px;
  color: #a0185d;
}

.redeem-message {
  position: relative;
  padding: 16px 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.78);
  border: 2px solid rgba(255, 143, 196, 0.6);
  color: #5a1f36;
  font-weight: 600;
  line-height: 1.6;
  margin-bottom: 26px;
  box-shadow: 0 12px 30px rgba(255, 174, 212, 0.25);
  /* 适配不同语言的长词与链接，避免溢出 */
  word-break: break-word;
  overflow-wrap: anywhere;
}

.message {
  margin: 0;
}

.message .highlight {
  color: #d9166f;
  font-weight: 800;
}

.upload-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 18px;
  margin-bottom: 24px;
}

.upload-card {
  position: relative;
  display: grid;
  justify-items: center;
  padding: 18px 12px 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.9);
  border: 2px dashed rgba(255, 141, 198, 0.6);
  color: #a0185d;
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  overflow: hidden;
}

.upload-card.disabled { cursor: not-allowed; opacity: .65; }
.upload-card.disabled:hover { transform:none; box-shadow:none; border-color: rgba(255, 141, 198, 0.6); }

.upload-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 36px rgba(255, 123, 191, 0.28);
  border-color: rgba(255, 98, 180, 0.9);
}

.file-input {
  display: none;
}

.placeholder svg {
  color: #ff4fa7;
  opacity: 0.92;
}

.preview {
  width: 72px;
  height: 72px;
  border-radius: 12px;
  background-position: center;
  background-size: cover;
  border: 3px solid rgba(255, 109, 189, 0.6);
  box-shadow: 0 6px 16px rgba(255, 130, 200, 0.35);
}

.upload-tip {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 1px;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 26px;
  flex-wrap: wrap;
}

.btn {
  min-width: 160px;
  height: 46px;
  border-radius: 999px;
  border: 0;
  font-weight: 800;
  letter-spacing: 3px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
}

.btn.primary {
  background: linear-gradient(135deg, #ff3e9e 0%, #ff70c5 100%);
  color: #fff;
  box-shadow: 0 16px 36px rgba(255, 97, 175, 0.3);
}

.btn.secondary {
  background: linear-gradient(135deg, #ff78c7 0%, #ffa3dd 100%);
  color: #fff;
  box-shadow: 0 16px 36px rgba(255, 160, 212, 0.28);
}

.btn:hover {
  transform: translateY(-1px);
  filter: brightness(0.98);
}

@media (max-width: 520px) {
  .redeem-modal {
    width: min(94vw, 420px);
    padding: 24px 20px 28px;
    border-radius: 20px;
  }

  .redeem-heading h2 {
    font-size: 22px;
  }

  .upload-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
