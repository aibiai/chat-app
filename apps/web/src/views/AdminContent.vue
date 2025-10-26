<template>
  <div class="container mx-auto px-4 py-6 max-w-5xl">
    <div class="mb-4 flex items-center justify-between">
      <h1 class="text-xl font-semibold">{{ t('admin.content.title') }}</h1>
      <div class="text-sm text-gray-500">{{ t('admin.content.loginOnly') }}</div>
    </div>

    <div class="bg-white/90 backdrop-blur rounded-lg border p-4 space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label class="block text-sm mb-1">{{ t('admin.content.localeLabel') }}</label>
          <select v-model="locale" class="w-full border rounded px-3 py-2">
            <option value="zh-CN">zh-CN</option>
            <option value="zh-TW">zh-TW</option>
            <option value="en">en</option>
            <option value="ja">ja</option>
            <option value="ko">ko</option>
          </select>
        </div>
        <div>
          <label class="block text-sm mb-1">{{ t('admin.content.sectionLabel') }}</label>
          <select v-model="sectionKey" class="w-full border rounded px-3 py-2">
            <option v-for="k in sections" :key="k" :value="k">{{ k }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm mb-1">{{ t('admin.content.targetLang') }}</label>
          <select v-model="targetLang" class="w-full border rounded px-3 py-2">
            <option value="en">en</option>
            <option value="ja">ja</option>
            <option value="ko">ko</option>
            <option value="zh-CN">zh-CN</option>
            <option value="zh-TW">zh-TW</option>
          </select>
        </div>
      </div>

      <div>
        <label class="block text-sm mb-1">{{ t('admin.content.titleLabel') }}</label>
        <input v-model="title" class="w-full border rounded px-3 py-2" />
      </div>

      <div>
        <label class="block text-sm mb-2">{{ t('admin.content.paragraphsLabel') }}</label>
        <div class="space-y-2">
          <div v-for="(p,idx) in paragraphs" :key="idx" class="flex gap-2 items-start">
            <textarea v-model="paragraphs[idx]" class="flex-1 border rounded px-3 py-2 min-h-[64px]"></textarea>
            <button class="px-2 py-1 border rounded" @click="removeParagraph(idx)">{{ t('admin.content.delete') }}</button>
          </div>
          <button class="px-3 py-1 border rounded" @click="addParagraph">+ {{ t('admin.content.addParagraph') }}</button>
        </div>
      </div>

      <div class="flex gap-3">
        <button class="px-4 py-2 bg-main text-white rounded" @click="save">{{ t('common.save') }}</button>
        <button class="px-4 py-2 border rounded" @click="reload">{{ t('admin.content.reload') }}</button>
        <button class="px-4 py-2 border rounded" @click="translateAll">{{ t('admin.content.translateAll', { lang: targetLang }) }}</button>
        <span v-if="status" class="text-sm text-gray-500">{{ status }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getServerContent, patchServerContent, translateBulk } from '../content'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// 简单登录校验：本地必须有 token
const router = useRouter()
onMounted(() => {
  const token = localStorage.getItem('token')
  if (!token) router.push('/login')
})

const sections = ['about','terms','privacy','security','help','contact']
const locale = ref<'zh-CN'|'zh-TW'|'en'|'ja'|'ko'>('zh-CN')
const sectionKey = ref<typeof sections[number]>('about')
const title = ref('')
const paragraphs = ref<string[]>([])
const targetLang = ref<'en'|'ja'|'ko'|'zh-CN'|'zh-TW'>('en')
const status = ref('')

async function reload(){
  status.value = t('common.loading')
  const data = await getServerContent(locale.value)
  const sec = data?.sections?.[sectionKey.value]
  title.value = (sec?.title ?? '')
  paragraphs.value = Array.isArray(sec?.content) ? [...sec!.content] : []
  status.value = t('admin.content.ready')
}

async function save(){
  status.value = t('admin.content.saving')
  const ok = await patchServerContent(locale.value, {
    sections: {
      [sectionKey.value]: { title: title.value, content: paragraphs.value }
    }
  } as any)
  status.value = ok ? t('admin.content.saved') : t('admin.content.saveFailed')
}

function addParagraph(){ paragraphs.value.push('') }
function removeParagraph(i:number){ paragraphs.value.splice(i,1) }

async function translateAll(){
  status.value = t('admin.content.translating')
  const translated = await translateBulk(paragraphs.value, guessSource(locale.value), targetLang.value)
  paragraphs.value = translated
  status.value = t('admin.content.translatedNote')
}

function guessSource(l: string){
  // 简易推断：中文 -> zh, 英文 en, 日文 ja, 韩文 ko
  if (l.startsWith('zh')) return 'zh'
  if (l.startsWith('en')) return 'en'
  if (l.startsWith('ja')) return 'ja'
  if (l.startsWith('ko')) return 'ko'
  return 'auto'
}

watch([locale, sectionKey], () => { void reload() }, { immediate: true })
</script>

<style scoped>
.bg-main{ background-color:#ec4899; }
</style>
