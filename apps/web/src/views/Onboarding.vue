<template>
  <div class="max-w-3xl mx-auto onboarding-page">
    <BaseCard>
      <h2 class="text-[18px] leading-6 font-semibold tracking-tighter mb-1">{{ t('onboarding.title') }}</h2>
      <p class="text-gray-500 text-[12px] leading-4 mb-3">{{ t('onboarding.subtitle') }}</p>

      <!-- 顶部两栏 Tab -->
  <div class="inline-flex rounded-full border border-gray-200 bg-gray-50 p-0.5 mb-4 text-[13px]">
        <button type="button"
                class="px-3 py-1 rounded-full transition-colors"
                :class="activeTab==='basic' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'"
                @click="activeTab='basic'">
          {{ t('onboarding.tabs.basic') }}
        </button>
        <button type="button"
                class="px-3 py-1 rounded-full transition-colors"
                :class="activeTab==='verify' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'"
                @click="activeTab='verify'">
          {{ t('onboarding.tabs.verify') }}
        </button>
      </div>

      <!-- 基本资料 Tab -->
  <form v-if="activeTab==='basic'" class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-2" @submit.prevent="onSubmitBasic">
        <!-- 头像上传（提交审核），沿用之前格式效果 -->
        <FormField :label="t('onboarding.avatar')" class="md:col-span-2">
          <div class="grid grid-cols-1 md:grid-cols-2 items-center gap-3 sm:gap-2">
            <div class="flex flex-col items-start md:justify-start py-0.5 gap-1">
              <img
                :src="avatarDisplaySrc"
                alt="avatar"
                class="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full object-cover border shadow-sm"
                @error="onAvatarImgError"
              />
              <!-- 头像审核状态提示 -->
              <div v-if="avatarStatus !== 'none'" class="mt-1">
                <span
                  class="inline-flex items-center gap-2 text-xs px-2.5 py-0.5 rounded-full"
                  :class="{
                    'bg-yellow-50 text-yellow-700 border border-yellow-200': avatarStatus==='pending',
                    'bg-green-50 text-green-700 border border-green-200': avatarStatus==='approved',
                    'bg-red-50 text-red-700 border border-red-200': avatarStatus==='rejected',
                  }"
                >
                  <span v-if="avatarStatus==='pending'">{{ t('onboarding.status.pending') }}</span>
                  <span v-else-if="avatarStatus==='approved'">{{ t('onboarding.status.approved') }}</span>
                  <span v-else>{{ t('onboarding.status.rejected') }}</span>
                </span>
                <p v-if="avatarStatus==='rejected' && avatarReason" class="text-[11px] leading-4 text-red-500 mt-1">{{ t('onboarding.avatarRejectedHint') }}: {{ avatarReason }}</p>
              </div>
            </div>
            <div class="flex items-center">
              <FileUpload accept="image/*" :showPreview="false" @change="onAvatarChangeFile" />
            </div>
          </div>
          <p class="text-xs text-gray-500 mt-1.5 hidden-[height-640]">{{ t('onboarding.avatarNote') }}</p>
        </FormField>

        <!-- 昵称（注册信息，申请修改走审核） -->
        <FormField :label="t('onboarding.nickname')">
          <BaseInput v-model="form.nickname" :placeholder="t('onboarding.nickname')" :leftIcon="true" :floatLabel="true" />
        </FormField>
        <!-- 性别（注册信息，不可更改） -->
        <FormField :label="t('onboarding.gender')">
          <FloatingSelect v-model="form.gender" :floatLabel="false" disabled>
            <option value="male">{{ t('auth.gender.male') }}</option>
            <option value="female">{{ t('auth.gender.female') }}</option>
            <option value="other">{{ t('auth.gender.other') }}</option>
          </FloatingSelect>
        </FormField>
        <!-- 生日（注册信息，申请修改走审核） -->
        <FormField :label="t('onboarding.birthday')">
          <div class="grid grid-cols-3 gap-2">
            <FloatingSelect v-model="birthYear" :placeholder="t('form.placeholder.selectYear')" :floatLabel="false">
              <option v-for="y in years" :key="y" :value="String(y)">{{ y }}</option>
            </FloatingSelect>
            <FloatingSelect v-model="birthMonth" :placeholder="t('form.placeholder.selectMonth')" :floatLabel="false">
              <option v-for="m in months" :key="m" :value="String(m)">{{ m }}</option>
            </FloatingSelect>
            <FloatingSelect v-model="birthDay" :placeholder="t('form.placeholder.selectDay')" :floatLabel="false">
              <option v-for="d in days" :key="d" :value="String(d)">{{ d }}</option>
            </FloatingSelect>
          </div>
        </FormField>

        

        <!-- 星座 下拉 -->
        <FormField :label="t('onboarding.zodiac')">
          <FloatingSelect v-model="zodiac" :floatLabel="false">
            <option :value="''" disabled>{{ t('onboarding.zodiac') }}</option>
            <option v-for="code in zodiacCodes" :key="code" :value="code">{{ t(`onboarding.zodiacOptions.${code}`) }}</option>
          </FloatingSelect>
        </FormField>

        <!-- 身高/体重（提交审核） -->
        <FormField :label="t('onboarding.height')">
          <FloatingSelect v-model="heightSelect" :floatLabel="false">
            <option :value="''" disabled>{{ t('onboarding.height') }}</option>
            <option v-for="h in heightOptions" :key="h" :value="String(h)">{{ h }} cm</option>
          </FloatingSelect>
        </FormField>
        <FormField :label="t('onboarding.weight')">
          <FloatingSelect v-model="weightSelect" :floatLabel="false">
            <option :value="''" disabled>{{ t('onboarding.weight') }}</option>
            <option v-for="opt in weightOptions" :key="opt.value" :value="String(opt.value)">{{ opt.label }}</option>
          </FloatingSelect>
        </FormField>

        <!-- 学历 下拉 -->
        <FormField :label="t('onboarding.education')">
          <FloatingSelect v-model="education" :floatLabel="false">
            <option :value="''" disabled>{{ t('onboarding.education') }}</option>
            <option v-for="code in educationCodes" :key="code" :value="code">{{ t(`onboarding.educationOptions.${code}`) }}</option>
          </FloatingSelect>
        </FormField>

        <!-- 婚姻状况 下拉 -->
        <FormField :label="t('onboarding.marital')">
          <FloatingSelect v-model="marital" :floatLabel="false">
            <option :value="''" disabled>{{ t('onboarding.marital') }}</option>
            <option v-for="code in maritalCodes" :key="code" :value="code">{{ t(`onboarding.maritalOptions.${code}`) }}</option>
          </FloatingSelect>
        </FormField>

        <div class="md:col-span-2 flex gap-3 sticky-actions">
          <BaseButton variant="gradient" rounded="pill" :loading="loading" :disabled="loading" type="submit">{{ t('onboarding.save') }}</BaseButton>
        </div>
      </form>

      <!-- 认证 Tab -->
  <form v-else class="grid grid-cols-1 gap-4 sm:gap-3" @submit.prevent="onSubmitIdentity">
        <!-- 审核状态提示 -->
        <div v-if="identityStatus !== 'none'" class="md:col-span-1">
          <span
            class="inline-flex items-center gap-2 text-sm px-3 py-1 rounded-full"
            :class="{
              'bg-yellow-50 text-yellow-700 border border-yellow-200': identityStatus==='pending',
              'bg-green-50 text-green-700 border border-green-200': identityStatus==='approved',
              'bg-red-50 text-red-700 border border-red-200': identityStatus==='rejected',
            }"
          >
            <span v-if="identityStatus==='pending'">{{ t('onboarding.status.pending') }}</span>
            <span v-else-if="identityStatus==='approved'">{{ t('onboarding.status.approved') }}</span>
            <span v-else>{{ t('onboarding.status.rejected') }}</span>
          </span>
          <p v-if="identityStatus==='rejected' && identityReason" class="text-xs text-red-500 mt-1">{{ t('onboarding.rejectedHint') }}: {{ identityReason }}</p>
        </div>
        <FormField :label="t('onboarding.realName')">
          <BaseInput v-model="realName" :placeholder="t('onboarding.realName')" :floatLabel="false" />
        </FormField>
        <FormField :label="t('onboarding.identity')">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-2">
            <div>
              <label class="block text-sm mb-1">{{ t('onboarding.idFront') }}</label>
              <FileUpload accept="image/*" v-model="idFiles.front" :showPreview="true" :previewSize="52" />
            </div>
            <div>
              <label class="block text-sm mb-1">{{ t('onboarding.idBack') }}</label>
              <FileUpload accept="image/*" v-model="idFiles.back" :showPreview="true" :previewSize="52" />
            </div>
            <div>
              <label class="block text-sm mb-1">{{ t('onboarding.selfie') }}</label>
              <FileUpload accept="image/*" v-model="idFiles.selfie" :showPreview="true" :previewSize="52" />
            </div>
          </div>
          <p class="text-xs text-gray-500 mt-1 hidden-[height-640]">{{ t('onboarding.identityNote') }}</p>
        </FormField>
        <div class="flex gap-3 sticky-actions">
          <BaseButton variant="ghost" rounded="pill" :disabled="loading" type="button" @click="skipVerify">{{ t('onboarding.skipVerify') }}</BaseButton>
          <BaseButton variant="gradient" rounded="pill" :loading="loading" :disabled="loading" type="submit">{{ t('onboarding.submit') }}</BaseButton>
        </div>
      </form>
    </BaseCard>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import BaseCard from '../components/BaseCard.vue'
import BaseInput from '../components/BaseInput.vue'
import BaseButton from '../components/BaseButton.vue'
import FormField from '../components/FormField.vue'
import FloatingSelect from '../components/FloatingSelect.vue'
import FileUpload from '../components/FileUpload.vue'
import api from '../api'
// 头像默认占位
const defaultAvatarGeneric = 'https://placehold.co/128x128/png'
// 使用已放置的默认头像（public 目录静态资源）
const defaultAvatarFemale = '/avatars/IMG_0819.PNG'
const defaultAvatarMale = '/avatars/IMG_0820.PNG'
const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const form = reactive<{ nickname: string; gender: 'male'|'female'|'other'; birthday: string; height?: number; weight?: number; zodiac?: string; education?: string; marital?: string }>(
  { nickname: '', gender: 'male', birthday: '', height: undefined, weight: undefined, zodiac: '', education: '', marital: '' }
)
const errors = reactive<{ [k: string]: string }>({})
const loading = ref(false)
const previewAvatar = ref<string>('')
// 顶部 Tab（支持通过路由 query 预置）
const activeTab = ref<'basic'|'verify'>(route.query.tab === 'verify' ? 'verify' : 'basic')
// 监听路由 query.tab 变化，确保从菜单切换页签时即时生效
watch(() => route.query.tab, (val) => {
  activeTab.value = val === 'verify' ? 'verify' : 'basic'
})
// 头像显示：优先预览 > 用户头像 > 性别默认
const avatarDisplaySrc = computed(() => {
  if (previewAvatar.value) return previewAvatar.value
  if (avatarUrl.value) return avatarUrl.value
  if (form.gender === 'female') return defaultAvatarFemale
  if (form.gender === 'male') return defaultAvatarMale
  return defaultAvatarGeneric
})
function onAvatarImgError(e: Event) {
  const el = e.target as HTMLImageElement
  if (!el) return
  el.src = defaultAvatarGeneric
}

// 身高/体重下拉选择
const heightOptions = Array.from({ length: Math.floor((200 - 150) / 5) + 1 }, (_, i) => 150 + i * 5)
// 体重区间：使用本地化文案，提交值为 [min, max]
const weightRanges = [
  { min: 40, max: 50 },
  { min: 50, max: 60 },
  { min: 60, max: 70 },
  { min: 70, max: 80 },
  { min: 80, max: 90 },
]
const weightOptions = computed(() => weightRanges.map(r => ({
  label: t('onboarding.weightRangeLabel', { min: r.min, max: r.max }),
  value: `${r.min},${r.max}`
})))
const heightSelect = ref<string>('')
const weightSelect = ref<string>('')
// Use explicit nullable types to accept FileUpload's null value
const idFiles = reactive<{ front: File | null; back: File | null; selfie: File | null }>({ front: null, back: null, selfie: null })

// 星座/学历/婚姻 选项
const zodiacCodes = ['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'] as const
const educationCodes = ['highschool','associate','bachelor','master','doctor','other'] as const
const maritalCodes = ['single','married'] as const
const zodiac = ref<string>('')
const education = ref<string>('')
const marital = ref<string>('')
const realName = ref('')
const avatarUrl = ref('')
// 头像审核状态
type ReviewStatus = 'none'|'pending'|'approved'|'rejected'
const avatarStatus = ref<ReviewStatus>('none')
const avatarReason = ref('')
const meVerified = ref(false)
type IdentityStatus = 'none'|'pending'|'approved'|'rejected'
const identityStatus = ref<IdentityStatus>('none')
const identityReason = ref('')

// 生日：年/月/日下拉
const now = new Date()
const currentYear = now.getFullYear()
const years = Array.from({ length: 100 }, (_, i) => currentYear - i)
const months = Array.from({ length: 12 }, (_, i) => i + 1)
const birthYear = ref<string>('')
const birthMonth = ref<string>('')
const birthDay = ref<string>('')
const daysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate()
const maxDays = computed(() => {
  const y = Number(birthYear.value)
  const m = Number(birthMonth.value)
  if (!y || !m) return 31
  return daysInMonth(y, m)
})
const days = computed(() => Array.from({ length: maxDays.value }, (_, i) => i + 1))
watch([birthYear, birthMonth], () => {
  const d = Number(birthDay.value)
  if (d && d > maxDays.value) birthDay.value = String(maxDays.value)
})
const pad2 = (n: number) => String(n).padStart(2, '0')
const birthdayAssembled = computed(() => {
  if (!birthYear.value || !birthMonth.value || !birthDay.value) return ''
  return `${birthYear.value}-${pad2(Number(birthMonth.value))}-${pad2(Number(birthDay.value))}`
})

onMounted(async () => {
  // 预填充当前用户资料（改为 users/me，支持 profileDraft）
  try {
    const { data } = await api.get('/api/users/me')
    const pick = (k: string) => (data?.profileDraft && data.profileDraft[k] != null) ? data.profileDraft[k] : data[k]
    form.nickname = pick('nickname') || ''
    form.gender = data.gender || 'male'
    form.birthday = pick('birthday') || ''
    form.zodiac = pick('zodiac') || ''
    form.education = pick('education') || ''
    form.marital = pick('maritalStatus') || data.marital || ''
    zodiac.value = form.zodiac || ''
    education.value = form.education || ''
    marital.value = form.marital || ''
    realName.value = data.realName || ''
    avatarUrl.value = data.avatarUrl || ''
    meVerified.value = !!data.identityVerified
    // 初始化生日 Y/M/D
    if (form.birthday) {
      const m = String(form.birthday).match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/)
      if (m) {
        birthYear.value = m[1]
        birthMonth.value = String(Number(m[2]))
        birthDay.value = String(Number(m[3]))
      }
    }
  // 初始化身高/体重（若已有历史值）
  const h = (data?.profileDraft?.height != null) ? data.profileDraft.height : data.height
  if (typeof h === 'number' && h >= 150 && h <= 200) heightSelect.value = String(h)
    const wr = (data?.profileDraft?.weightRange && Array.isArray(data.profileDraft.weightRange)) ? data.profileDraft.weightRange : data.weightRange
    if (Array.isArray(wr) && wr.length === 2) {
      weightSelect.value = `${wr[0]},${wr[1]}`
    } else if (typeof data.weight === 'number') {
      // 回填到最接近的区间
      const found = weightRanges.find(r => (data.weight as number) >= r.min && (data.weight as number) < r.max)
      if (found) weightSelect.value = `${found.min},${found.max}`
    }
  } catch {}
})

function onAvatarChangeFile(file: File | null) {
  if (!file) { previewAvatar.value = ''; return }
  const reader = new FileReader()
  reader.onload = () => { previewAvatar.value = String(reader.result || '') }
  reader.readAsDataURL(file)
}

// 身份证/自拍文件选择由 FileUpload 的 v-model 直接写入 idFiles

async function onSubmitIdentity() {
  errors.realName = realName.value ? '' : t('form.error.required')
  if (errors.realName) return
  if (!idFiles.front || !idFiles.back || !idFiles.selfie) {
    // 简单必填校验
    return
  }
  const toB64 = (f: File) => new Promise<string>(resolve => { const r = new FileReader(); r.onload=()=>resolve(String(r.result||'')); r.readAsDataURL(f) })
  try {
    loading.value = true
    const [idFrontPath, idBackPath, selfiePath] = await Promise.all([toB64(idFiles.front), toB64(idFiles.back), toB64(idFiles.selfie)])
    await api.post('/api/review/identity', { idFrontPath, idBackPath, selfiePath, realName: realName.value })
    identityStatus.value = 'pending'
    alert(t('onboarding.submittedNotice'))
    router.push('/')
  } finally { loading.value = false }
}

async function onSubmitBasic() {
  // 校验昵称必填（提交审核）
  errors.nickname = form.nickname ? '' : t('form.error.required')
  if (errors.nickname) return
  const heightToSend = heightSelect.value ? Number(heightSelect.value) : undefined
  const weightRangeToSend = weightSelect.value ? (weightSelect.value.split(',').map(n => Number(n)) as [number, number]) : undefined
  try {
    loading.value = true
    // 先提交资料审核
    await api.post('/api/review/profile', {
      nickname: form.nickname,
      birthday: birthdayAssembled.value || undefined,
      height: heightToSend,
      weightRange: weightRangeToSend,
      zodiac: zodiac.value || undefined,
      education: education.value || undefined,
      maritalStatus: marital.value || undefined,
    })
    // 资料提交成功后，立即切到认证 Tab
    activeTab.value = 'verify'
    // 刷新一下我的资料，确保其它页面能读到最新草稿
    try { await api.get('/api/users/me').then(()=>{}) } catch {}
    // 若选择了新头像，单独尝试提交头像审核（不阻断 Tab 切换）
    if (previewAvatar.value) {
      try {
        // 立即显示为“审核中”
        avatarStatus.value = 'pending'
        await api.post('/api/review/avatar', { filePath: previewAvatar.value })
        // 可选择刷新一次状态（容错）
        loadAvatarStatus()
      } catch (e) {
        console.error('Avatar review submit failed:', e)
      }
    }
  } catch (e: any) {
    console.error('Profile review submit failed:', e)
    // 提示用户失败原因（简单兜底）
    alert(String(e?.message || 'Failed to submit. Please try again.'))
  } finally { loading.value = false }
}

function skipVerify() {
  router.push('/')
}

// 加载认证审核状态
async function loadIdentityStatus() {
  try {
    const { data } = await api.get('/api/review/status', { params: { type: 'identity' } })
    const st = (data.status || 'none') as IdentityStatus
    identityStatus.value = st === 'none' && meVerified.value ? 'approved' : st
    identityReason.value = data.reason || ''
  } catch (e) {
    // 忽略错误
  }
}

// 加载头像审核状态
async function loadAvatarStatus() {
  try {
    const { data } = await api.get('/api/review/status', { params: { type: 'avatar' } })
    avatarStatus.value = (data.status || 'none') as ReviewStatus
    avatarReason.value = data.reason || ''
  } catch (e) {
    // 忽略
  }
}

onMounted(() => { 
  loadIdentityStatus()
  loadAvatarStatus()
})
</script>

<style scoped>
/* 小屏(高度<=640px)紧凑模式：
   - 进一步压缩上下间距
   - 隐藏非关键提示文字
   - 底部操作条粘性，保证主按钮可见 */

@media (max-height: 640px) {
  /* 保留注释，无需针对 BaseCard 额外缩进，避免空规则 */

  .onboarding-page h2 {
    font-size: 16px;
    line-height: 1.375rem; /* 22px */
    margin-bottom: 0.125rem; /* 2px */
  }

  .onboarding-page p { /* 副标题等段落整体更紧凑 */
    font-size: 12px;
    line-height: 1rem; /* 16px */
    margin-bottom: 0.5rem; /* 8px */
  }

  .onboarding-page .sticky-actions {
    position: sticky;
    bottom: 0;
    padding-top: 0.25rem; /* 4px */
    padding-bottom: 0.25rem; /* 4px */
    background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.9) 40%, rgba(255,255,255,1));
    backdrop-filter: saturate(160%) blur(2px);
    z-index: 10;
  }

  .onboarding-page .sticky-actions :deep(button) {
    transform: translateZ(0);
  }

  /* 进一步减小所有网格容器的 gap，以覆盖 Tailwind 的 gap-3/4 等 */
  .onboarding-page form {
    gap: 0.5rem !important; /* 相当于 gap-2 */
  }
  .onboarding-page form .grid {
    gap: 0.5rem !important; /* 子网格也同步压缩 */
  }

  /* 隐藏说明类文本（通过 utility 类选择） */
  .onboarding-page :deep(.hidden-[height-640]) {
    display: none !important;
  }
}
</style>
