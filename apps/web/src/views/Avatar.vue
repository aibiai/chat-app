<template>
  <div class="max-w-lg mx-auto p-4">
    <BaseCard>
  <h2 class="text-[18px] leading-6 font-semibold tracking-tighter mb-1">{{ t('avatar.title') }}</h2>
  <p class="text-gray-500 text-[12px] leading-4 mb-3">{{ t('avatar.subtitle') }}</p>

      <div class="flex items-start gap-4">
        <!-- 点击头像直接调起文件选择 -->
        <div
          class="relative group cursor-pointer select-none"
          @click="triggerAvatarPick"
          @keydown.enter.prevent="triggerAvatarPick"
          @keydown.space.prevent="triggerAvatarPick"
          tabindex="0"
          role="button"
          :aria-disabled="formDisabled ? 'true' : 'false'"
          :aria-label="t('avatar.choose')"
        >
          <AvatarImg :src="displayAvatar" :gender="gender as any" :size="96" />
          <div class="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/10 transition" aria-hidden="true"></div>
        </div>
        <div class="flex-1">
          <FileUpload ref="uploadRef" accept="image/*" :showPreview="false" @change="onPick" :drag="!formDisabled" />
          <p class="text-xs text-gray-500 mt-2">{{ t('avatar.hint') }}</p>
        </div>
      </div>

    <div class="mt-4 flex gap-3">
  <BaseButton variant="gradient" rounded="pill" :loading="loading" :disabled="formDisabled || !preview || loading" @click="submit">{{ submitLabel }}</BaseButton>
  <BaseButton variant="ghost" rounded="pill" :disabled="loading" @click="goBack">{{ t('common.back') }}</BaseButton>
    </div>
    </BaseCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import FileUpload from '../components/FileUpload.vue'
import AvatarImg from '../components/AvatarImg.vue'
import api from '../api'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const router = useRouter()
const current = ref<string>('')
const preview = ref<string>('')
const loading = ref(false)
// 基于性别的回退交由 AvatarImg 统一处理
const gender = ref<'male'|'female'|'other'|undefined>(undefined)
const aStatus = ref<'none'|'pending'|'approved'|'rejected'>('none')
let aPoll: number | null = null
const uploadRef = ref<any|null>(null)

// 提交表单禁用：仅在“审核中”时禁用；
// 已通过时允许重新选择文件并再次提交审核
const formDisabled = computed(() => aStatus.value === 'pending')
// 头像展示规则：
// - 待审核或已通过：显示当前已生效头像（避免把待审头像误当作当前头像）
// - 其他情况（未提交/被驳回）：如选择了本地预览则显示预览，否则仍显示当前头像
const displayAvatar = computed(() => {
  // 审核中：始终展示当前已生效头像，避免把待审图片误认为已生效
  if (aStatus.value === 'pending') return current.value || ''
  // 其余状态：若用户已选择新文件，则预览优先；否则仍展示当前头像
  return preview.value || current.value || ''
})
const submitLabel = computed(() => {
  if (loading.value) return t('common.submitting')
  // 审核中固定显示“审核中”
  if (aStatus.value === 'pending') return t('onboarding.status.pending')
  // 只要选择了新文件（且非审核中），按钮文案应为“提交审核”
  if (preview.value) return t('avatar.submit')
  // 未选择新文件时，根据状态显示
  if (aStatus.value === 'approved') return t('avatar.status.approved')
  // 被驳回时仍显示“提交审核”，引导用户重新选择并提交
  if (aStatus.value === 'rejected') return t('avatar.submit')
  return t('avatar.submit')
})

onMounted(async () => {
  try{
    const { data } = await api.get('/api/users/me')
    current.value = data?.avatarUrl || ''
    gender.value = (data?.gender as any) || undefined
  }catch{}
  await loadAvatarStatus();
  startAvatarPoll()
})

function onPick(file: File | null){
  if (formDisabled.value) return
  if (!file) { preview.value = ''; return }
  const r = new FileReader()
  r.onload = () => preview.value = String(r.result || '')
  r.readAsDataURL(file)
}

function triggerAvatarPick(){
  if (formDisabled.value) return
  uploadRef.value?.open?.()
}

async function submit(){
  if (!preview.value) return
  try{
    loading.value = true
  const { data } = await api.post('/api/review/avatar', { filePath: preview.value })
  const s = String(data?.status || 'pending')
  if (s === 'approved' || s === 'pending') aStatus.value = s as any
  alert(t('avatar.submitted'))
  // 提交后根据状态调整轮询；显示仍以当前已生效头像为准
  startAvatarPoll()
  } finally { loading.value = false }
}

async function loadAvatarStatus(){
  try{
    const { data } = await api.get('/api/review/status', { params: { type: 'avatar' } })
    const s = String(data?.status || 'none') as any
    if (s === 'rejected' && aStatus.value !== 'rejected'){
      // 被驳回后清空上次预览
      preview.value = ''
    }
    if (s === 'pending' || s === 'approved' || s === 'rejected') aStatus.value = s
    else aStatus.value = 'none'
    // 若审核已通过，刷新用户信息以拿到最新 avatarUrl；并清理预览
    if (aStatus.value === 'approved') {
      try {
        const { data: me } = await api.get('/api/users/me')
        if (me && typeof me.avatarUrl === 'string') {
          current.value = me.avatarUrl
          // 广播头像更新事件（同标签页 & 跨标签页）
          window.dispatchEvent(new Event('me-avatar-updated'))
          const nextVer = Date.now()
          localStorage.setItem('avatarVersion', String(nextVer))
        }
      } catch {}
      preview.value = ''
    }
  }catch{}
  // 每次状态更新后，确保轮询策略正确
  startAvatarPoll()
}
function startAvatarPoll(){
  if (aPoll) { clearInterval(aPoll as any); aPoll = null }
  if (aStatus.value === 'pending'){
    aPoll = setInterval(loadAvatarStatus, 15000) as unknown as number
  }
}
onUnmounted(() => { if (aPoll){ clearInterval(aPoll as any); aPoll = null } })

function goBack(){ router.back() }
</script>
