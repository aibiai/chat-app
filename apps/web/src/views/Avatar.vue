<template>
  <div class="max-w-lg mx-auto p-4">
    <BaseCard>
  <h2 class="text-[18px] leading-6 font-semibold tracking-tighter mb-1">{{ t('avatar.title') }}</h2>
  <p class="text-gray-500 text-[12px] leading-4 mb-3">{{ t('avatar.subtitle') }}</p>

      <div class="flex items-start gap-4">
        <img :src="preview || current || fallback" alt="avatar" class="w-24 h-24 rounded-full object-cover border shadow-sm" />
        <div class="flex-1">
          <FileUpload accept="image/*" :showPreview="false" @change="onPick" />
          <p class="text-xs text-gray-500 mt-2">{{ t('avatar.hint') }}</p>
        </div>
      </div>

      <div class="mt-4 flex gap-3">
  <BaseButton variant="gradient" rounded="pill" :loading="loading" :disabled="!preview || loading" @click="submit">{{ t('avatar.submit') }}</BaseButton>
  <BaseButton variant="ghost" rounded="pill" :disabled="loading" @click="goBack">{{ t('common.back') }}</BaseButton>
      </div>
    </BaseCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import FileUpload from '../components/FileUpload.vue'
import api from '../api'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const router = useRouter()
const current = ref<string>('')
const preview = ref<string>('')
const loading = ref(false)
const fallback = '/avatars/IMG_0819.PNG'

onMounted(async () => {
  try{
    const { data } = await api.get('/api/users/me')
    current.value = data?.avatarUrl || ''
  }catch{}
})

function onPick(file: File | null){
  if (!file) { preview.value = ''; return }
  const r = new FileReader()
  r.onload = () => preview.value = String(r.result || '')
  r.readAsDataURL(file)
}

async function submit(){
  if (!preview.value) return
  try{
    loading.value = true
  await api.post('/api/review/avatar', { filePath: preview.value })
  alert(t('avatar.submitted'))
    router.push('/onboarding?tab=basic')
  } finally { loading.value = false }
}

function goBack(){ router.back() }
</script>
