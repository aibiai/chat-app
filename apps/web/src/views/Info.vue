<template>
  <div class="relative min-h-screen">
    <!-- 背景图 + 渐变遮罩 -->
    <div class="absolute inset-0 bg-cover bg-center bg-no-repeat" style="background-image:url('/bg-sakura.jpg'), url('https://source.unsplash.com/1920x1080/?city,landscape'), url('https://picsum.photos/1920/1080?random=12');"></div>
    <div class="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50"></div>

    <div class="relative z-10 container mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-12 gap-6">
      <!-- 左侧菜单 -->
      <aside class="md:col-span-3">
        <div class="bg-white/70 backdrop-blur-md rounded-xl shadow-sm border p-3">
          <nav aria-label="secondary">
            <ul class="space-y-1">
              <li v-for="item in items" :key="item.path">
                <router-link :to="item.path" class="flex items-center gap-2 px-3 py-2 rounded-lg"
                  :class="[$route.path===item.path ? 'bg-main/10 text-main font-medium' : 'hover:bg-black/5']">
                  <span>{{ item.label }}</span>
                </router-link>
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      <!-- 右侧内容 -->
      <section class="md:col-span-9">
        <div class="bg-white/80 backdrop-blur-md rounded-xl shadow-sm border p-6">
          <h1 class="text-2xl font-bold tracking-tight mb-3">{{ serverTitle || t(titleKey) }}</h1>
          <div class="prose prose-neutral max-w-none">
            <template v-if="serverContent && serverContent.length">
              <p v-for="(p,idx) in serverContent" :key="idx">{{ p }}</p>
            </template>
            <template v-else>
              <p v-for="(p,idx) in i18nContent" :key="idx">{{ p }}</p>
            </template>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { getServerContent } from '../content'

const route = useRoute()
const { t, tm, locale } = useI18n({ useScope: 'global' })

const items = computed(() => [
  { path: '/about', label: t('info.menu.about') },
  { path: '/terms', label: t('footer.terms') },
  { path: '/privacy', label: t('footer.privacy') },
  { path: '/security', label: t('footer.security') },
  { path: '/help', label: t('footer.help') },
  { path: '/contact', label: t('footer.contact') },
])

const section = computed(() => {
  const p = route.path.replace(/^\//, '')
  const allow = ['about','terms','privacy','security','help','contact']
  return allow.includes(p) ? p : 'about'
})

const titleKey = computed(() => `info.sections.${section.value}.title`)
const contentKey = computed(() => `info.sections.${section.value}.content`)

// 后端内容（可被管理端修改）
const serverTitle = ref<string>('')
const serverContent = ref<string[]>([])

async function loadServer() {
  serverTitle.value = ''
  serverContent.value = []
  let data: any = null
  try {
    const ctrl = new AbortController()
    const timer = window.setTimeout(() => ctrl.abort(), 6000)
    data = await getServerContent(locale.value)
    window.clearTimeout(timer)
  } catch {
    data = null
  }
  if (!data?.sections) return
  const sec = (data.sections as any)[section.value]
  if (sec) {
    if (typeof sec.title === 'string' && sec.title.trim()) serverTitle.value = sec.title
    if (Array.isArray(sec.content) && sec.content.length) serverContent.value = sec.content
  }
}

// i18n 内容安全回退（确保 tm 返回的不是数组时也能渲染）
const i18nContent = computed<string[]>(() => {
  const val = tm(contentKey.value) as unknown
  if (Array.isArray(val)) return val as string[]
  if (typeof val === 'string') return [val]
  return []
})

// 当语言或分区变更时，请求后端内容；并在首次立即执行
watch([locale, section], () => { void loadServer() }, { immediate: true })
</script>

<style scoped>
.prose p { margin: 0.6rem 0; }
</style>
