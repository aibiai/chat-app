<template>
  <div class="profile-page container mx-auto px-3 py-4">
    <div class="grid grid-cols-12 gap-4 compact-grid fade-in">
  <!-- 左列：纵向头像（置于视野左上，3:4） + 择偶条件 -->
  <div class="col-span-12 lg:col-span-4">
        <div class="bg-white rounded border p-2 media-card" :class="{ 'skeleton': loading }">
          <div class="relative portrait-box" v-if="!loading">
            <img class="photo-portrait" :src="photoSrc" :alt="user?.nickname || 'photo'" @click="openLightbox" :title="t('profile.image.viewLarge')" />
            <div class="pop-badge">{{ t('profile.popularity') }}{{ popularity }}</div>
          </div>
          <div v-else class="portrait-skeleton"></div>
        </div>

  <!-- 择偶条件（移至左列，紧跟头像下方） -->
  <div class="bg-white rounded border p-3 mt-3 info-card" :class="{ 'skeleton': loading }">
          <div class="flex items-center gap-2 mb-2">
            <span class="inline-flex w-6 h-6 items-center justify-center rounded bg-pink-100 text-pink-600">✅</span>
            <h2 class="font-semibold h2-fluid">择偶条件</h2>
          </div>
          <p class="text-gray-700 text-sm" v-if="!loading && hasPreference">体重范围：{{ user?.weightRange?.[0] }} - {{ user?.weightRange?.[1] }} kg</p>
          <p class="text-gray-400 text-sm" v-else>未填写</p>
        </div>

  
      </div>

  <!-- 中列：头部信息 + 基本资料 + 告白墙（中列 5 栅格） -->
  <div class="col-span-12 lg:col-span-5">
        <!-- 资料头部 -->
        <div class="bg-white rounded border p-4 header-card glass" :class="{ 'skeleton': loading }">
          <div class="flex items-center justify-between" v-if="!loading">
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="inline-flex w-3 h-3 rounded-full" :class="presence.isOnline(uid) ? 'bg-emerald-500' : 'bg-gray-300'"></span>
                <h1 class="font-extrabold name-fluid truncate">{{ user?.nickname || '——' }}</h1>
                <span v-if="user?.gender==='female'" class="badge female">{{ t('auth.gender.female') }}</span>
                <span v-else-if="user?.gender==='male'" class="badge male">{{ t('auth.gender.male') }}</span>
                <span v-else class="badge neutral">{{ t('auth.gender.other') }}</span>
                <span v-if="age!==null" class="age-text">{{ age }} {{ t('profile.ageUnit') }}</span>
              </div>
              <div class="mt-2 flex items-center gap-2 text-xs text-gray-600 flex-wrap">
                <span v-if="user?.region" class="chip">📍 {{ user.region }}</span>
                <span v-if="user?.zodiac" class="chip">♒ {{ user.zodiac }}</span>
                <span v-if="user?.education" class="chip">🎓 {{ user.education }}</span>
              </div>
            </div>
          </div>

          <div class="mt-4 flex items-center gap-2 flex-wrap btns" v-if="!loading">
            <button class="btn-outline-gold" @click="goChat">✉ {{ t('chat.actions.message') }}</button>
            <button class="btn-solid-pink like-btn" :class="{ active: liked }" @click="toggleLike">
              <svg class="heart" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="currentColor"><path d="M12 21s-6.716-4.58-9.193-9.193C1.33 8.194 3.46 5 6.807 5c1.86 0 3.41 1.08 4.193 2.64C11.783 6.08 13.333 5 15.193 5 18.54 5 20.67 8.194 21.193 11.807 18.716 16.42 12 21 12 21z"/></svg>
              <span>{{ liked ? t('profile.like.liked') : t('profile.like.like') }}</span>
            </button>
          </div>
        </div>

        

        <!-- 基本资料 -->
        <div class="bg-white rounded border p-3 mt-4 info-card" :class="{ 'skeleton': loading }">
          <div class="flex items-center gap-2 mb-2">
            <span class="inline-flex w-6 h-6 items-center justify-center rounded bg-cyan-100 text-cyan-600">👤</span>
            <h2 class="font-semibold h2-fluid">{{ t('profile.basic.title') }}</h2>
          </div>
          <dl v-if="!loading" class="grid grid-cols-2 gap-x-4 gap-y-2 text-gray-700 text-sm info-grid">
            <div>
              <dt class="text-gray-500">{{ t('onboarding.height') }}</dt>
              <dd>{{ user?.height ? user.height + ' cm' : t('profile.notFilled') }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">{{ t('onboarding.weight') }}</dt>
              <dd>{{ user?.weight ? user.weight + ' kg' : t('profile.notFilled') }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">{{ t('onboarding.marital') }}</dt>
              <dd>{{ maritalText }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">{{ t('onboarding.gender') }}</dt>
              <dd>{{ genderText }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">{{ t('profile.fields.age') }}</dt>
              <dd>{{ age !== null ? (age + ' ' + t('profile.ageUnit')) : t('profile.notFilled') }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">{{ t('onboarding.region') }}</dt>
              <dd>{{ user?.region || t('profile.notFilled') }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">{{ t('onboarding.education') }}</dt>
              <dd>{{ user?.education || t('profile.notFilled') }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">{{ t('onboarding.zodiac') }}</dt>
              <dd>{{ user?.zodiac || t('profile.notFilled') }}</dd>
            </div>
          </dl>
          <div v-else class="skeleton-lines">
            <div class="line"></div>
            <div class="line"></div>
            <div class="line"></div>
          </div>
        </div>

        <!-- 告白墙（移至中列，位于基本资料下方） -->
        <div class="bg-white rounded border p-3 mt-3 info-card" :class="{ 'skeleton': loading }">
          <div class="flex items-center gap-2 mb-2">
            <span class="inline-flex w-6 h-6 items-center justify-center rounded bg-violet-100 text-violet-600">💌</span>
            <h2 class="font-semibold h2-fluid">{{ t('profile.confession.title') }}</h2>
          </div>
          <div v-if="!loading" class="confess-empty">
            <div class="confess-empty-box">{{ t('profile.confession.empty') }}</div>
          </div>
          <div v-else class="skeleton-lines">
            <div class="line"></div>
            <div class="line"></div>
          </div>
        </div>
      </div>

      <!-- 右列：侧边卡片（礼物/会员） -->
  <div class="col-span-12 lg:col-span-3">
        <div class="bg-white rounded border p-3 side-card sticky" :class="{ 'skeleton': loading }">
          <h3 class="font-semibold h3-fluid mb-2">{{ t('chat.side.gift.title') }}</h3>
          <div class="flex items-start gap-2">
            <div class="text-2xl">🎁</div>
            <p class="text-gray-600 leading-snug text-sm">{{ t('chat.side.gift.desc') }}</p>
          </div>
          <button class="mt-2 w-full rounded bg-main text-white py-2 hover:brightness-105" @click="goChat">{{ t('chat.side.gift.cta') }}</button>
        </div>

        <div class="bg-white rounded border p-3 mt-4 side-card sticky" :class="{ 'skeleton': loading }">
          <h3 class="font-semibold h3-fluid mb-2">{{ t('chat.side.vip.title') }}</h3>
          <ul class="space-y-2 text-gray-700 text-sm leading-snug">
            <li class="flex gap-2"><span class="text-xl">👑</span><div>{{ t('chat.side.vip.benefit1') }}</div></li>
            <li class="flex gap-2"><span class="text-xl">👀</span><div>{{ t('chat.side.vip.benefit2') }}</div></li>
            <li class="flex gap-2"><span class="text-xl">✉️</span><div>{{ t('chat.side.vip.benefit3') }}</div></li>
            <li class="flex gap-2"><span class="text-xl">💗</span><div>{{ t('chat.side.vip.benefit4') }}</div></li>
          </ul>
          <button class="mt-3 w-full rounded bg-amber-400 text-white py-2 hover:brightness-105">{{ t('vipModal.openNow') }}</button>
        </div>
      </div>
    </div>

    <!-- 头像大图 Lightbox -->
    <div v-if="lightbox" class="lightbox" @click="closeLightbox">
      <img :src="photoSrc" alt="preview" />
      <button type="button" class="close" @click.stop="closeLightbox" aria-label="close">✕</button>
    </div>
  </div>
  
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import api from '../api'
import { usePresence } from '../presence'

type Gender = 'male'|'female'|'other'
interface User {
  id: string
  nickname: string
  gender: Gender
  popularity?: number
  birthday?: string
  region?: string
  bio?: string
  interests?: string[]
  avatarUrl?: string
  height?: number
  weight?: number
  weightRange?: [number, number]
  zodiac?: string
  education?: string
  maritalStatus?: 'single'|'married'
}

const route = useRoute()
const router = useRouter()
const uid = route.params.id as string
const presence = usePresence()
const { t } = useI18n()
const user = ref<User | null>(null)
const liked = ref<boolean>(false)
const loading = ref<boolean>(true)
const lightbox = ref<boolean>(false)
// 人气：来自后端返回字段
const popularity = computed(() => Number(user.value?.popularity) || 0)

function calcAge(b?: string): number|null {
  if (!b) return null
  const d = new Date(b)
  if (isNaN(d.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
  return age >= 0 && age < 120 ? age : null
}

const age = computed(() => calcAge(user.value?.birthday))
const genderText = computed(() => user.value?.gender === 'female' ? t('auth.gender.female') : user.value?.gender === 'male' ? t('auth.gender.male') : t('auth.gender.other'))
const maritalText = computed(() => user.value?.maritalStatus === 'married' ? t('onboarding.maritalOptions.married') : user.value?.maritalStatus === 'single' ? t('onboarding.maritalOptions.single') : t('profile.notFilled'))
const hasPreference = computed(() => !!user.value?.weightRange && user.value!.weightRange!.length === 2)

const fallbackFemale = '/avatars/IMG_0819.PNG'
const fallbackMale = '/avatars/IMG_0820.PNG'
const fallbackGeneric = 'https://placehold.co/800x600/png'
const photoSrc = computed(() => {
  const g = user.value?.gender
  const fallback = g === 'female' ? fallbackFemale : (g === 'male' ? fallbackMale : fallbackGeneric)
  return user.value?.avatarUrl || fallback
})

function goChat(){
  window.location.hash = `#/chat/${uid}`
}

async function toggleLike(){
  try{
    if (!liked.value){
      await api.post(`/api/likes/${uid}`)
      liked.value = true
    } else {
      await api.delete(`/api/likes/${uid}`)
      liked.value = false
    }
    // 通知其它页面刷新（Settings.vue 会监听 like-changed）
    try { window.dispatchEvent(new Event('like-changed')) } catch {}
  }catch(e:any){
    const status = e?.response?.status
    if (status === 401){ router.push('/login'); return }
    alert(e?.response?.data?.error || t('common.submitFailed'))
  }
}

function openLightbox(){ lightbox.value = true }
function closeLightbox(){ lightbox.value = false }

onMounted(async () => {
  // 优先从公开详情接口获取（不受异性过滤影响，包含 popularity 与 luckyStars）
  try{
    const { data } = await api.get(`/api/users/${encodeURIComponent(uid)}/public`)
    user.value = (data || null) as any
  }catch{
    // 回退：仍尝试从列表中匹配（保留旧逻辑）
    try{
      const { data } = await api.get('/api/users')
      const list: User[] = Array.isArray(data) ? data : []
      user.value = list.find(u => u.id === uid) || null
    }catch{}
  }
  // 初始喜欢状态：查询后端
  try{
    const { data } = await api.get(`/api/likes/status/${uid}`)
    liked.value = !!data?.liked
  }catch{}
  // 记录访客：我访问了 TA
  try{
    await api.post(`/api/visits/${uid}`)
  }catch{}
  loading.value = false
})
</script>

<style scoped>
.text-main{ color: var(--brand-main, #e67a88); }
.border-main{ border-color: var(--brand-main, #e67a88); }
.bg-main{ background: var(--brand-main, #e67a88); }
/* 让页面在常见屏高下一屏显示，更紧凑的留白与流式字号 */
.compact-grid{ align-items:start; }
.media-card{ box-shadow: 0 6px 18px rgba(0,0,0,.06); }
.header-card{ box-shadow: 0 6px 18px rgba(0,0,0,.06); }
.side-card{ box-shadow: 0 4px 14px rgba(0,0,0,.05); }
.name-fluid{ font-size: clamp(20px, 1.4vw + 1.2vh, 26px); }
.h2-fluid{ font-size: clamp(15px, 1.1vw + 0.8vh, 18px); }
.h3-fluid{ font-size: clamp(15px, 1vw + 0.8vh, 18px); }
.btns button{ font-size: clamp(12px, .7vw + .6vh, 14px); }
.photo-hero{ max-height: clamp(320px, 46vh, 480px); }
.info-card{ box-shadow: 0 4px 14px rgba(0,0,0,.05); }
/* 告白墙空态 */
.confess-empty{ padding: 6px 0 2px; }
.confess-empty-box{ height: 96px; border-radius: 10px; border:1px dashed #e5e7eb; background:#fafafa; display:grid; place-items:center; color:#9ca3af; font-size:13px; }

/* 玻璃拟物效果的头部卡片 */
.glass{ backdrop-filter: saturate(1.2) blur(6px); border-color: rgba(255,255,255,.6); }

/* 粘性侧栏 */
.sticky{ position: sticky; top: 12px; }

/* 资料网格的列间分隔效果 */
.info-grid > div{ padding: 6px 0; border-bottom: 1px dashed #eef2f7; }
.info-grid > div:nth-last-child(-n+2){ border-bottom: 0; }

/* 性别徽章与年龄文本 */
.badge{ padding: 2px 8px; border-radius: 999px; font-size: 12px; font-weight: 700; line-height: 1; }
.badge.female{ color:#ec4899; background: #fdf2f8; border:1px solid #fbcfe8; }
.badge.male{ color:#3b82f6; background: #eff6ff; border:1px solid #bfdbfe; }
.badge.neutral{ color:#6b7280; background: #f3f4f6; border:1px solid #e5e7eb; }
.age-text{ color:#6b7280; font-size:12px; font-weight:700; }

/* 资料芯片 */
.chip{ padding: 4px 8px; border-radius: 999px; background:#f3f4f6; border:1px solid #e5e7eb; }

/* 操作按钮：金色描边 + 粉色实心 */
.btn-outline-gold{ padding:8px 14px; border-radius:999px; border:2px solid #f59e0b; color:#b45309; background:#fff; font-weight:800; }
.btn-outline-gold:hover{ background:#fff7ed; }
.btn-solid-pink{ padding:8px 14px; border-radius:999px; background: var(--brand-main, #e67a88); color:#fff; font-weight:800; border:2px solid transparent; }
.btn-solid-pink:hover{ filter: brightness(1.06); }
.like-btn{ display:inline-flex; align-items:center; gap:8px; }
.like-btn .heart{ display:block; }
.like-btn.active{ box-shadow: 0 0 0 3px rgba(230,122,136,.2) inset; }

/* 入场动画与悬浮微交互 */
.fade-in{ animation: fadeIn .4s ease-out; }
@keyframes fadeIn{ from{ opacity:0; transform:translateY(6px); } to{ opacity:1; transform:none; } }
.portrait-box:hover .photo-portrait{ transform: scale(1.015); }
.photo-portrait{ transition: transform .25s ease; cursor: zoom-in; }

/* 人气角标 */
.pop-badge{ position:absolute; left:12px; bottom:12px; background: rgba(0,0,0,.65); color:#fff; font-size:12px; padding:4px 8px; border-radius:6px; backdrop-filter: blur(2px); }

/* 告白墙 tile + 空白图框 */
.confess-row{ align-items:stretch; }
.tile{ width:120px; height:100px; border-radius:12px; background:#ede9fe; color:#6d28d9; display:flex; flex-direction:column; align-items:center; justify-content:center; border:1px solid #ddd6fe; }
.tile-icon{ font-size:28px; line-height:1; }
.tile-text{ margin-top:8px; font-weight:800; }
.confess-frame{ flex:1 1 auto; min-height:120px; border:1px dashed #e5e7eb; border-radius:10px; background:#fff; }
.frame-inner{ height:100%; display:grid; place-items:center; color:#9ca3af; font-size:13px; }

/* 左上纵向头像容器与图片（3:4） */
.portrait-box{ width:100%; max-width: 380px; margin: 0 auto; }
.photo-portrait{ width:100%; aspect-ratio: 3 / 4; object-fit: cover; object-position: center 28%; border-radius:12px; display:block; }

/* 骨架屏 */
.skeleton{ position: relative; overflow: hidden; }
.skeleton::after{ content:""; position:absolute; inset:0; background: linear-gradient(90deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.06) 50%, rgba(0,0,0,0.02) 100%); transform: translateX(-100%); animation: shimmer 1.4s infinite; }
@keyframes shimmer{ 100% { transform: translateX(100%); } }
.portrait-skeleton{ width:100%; aspect-ratio: 3 / 4; border-radius:12px; background:#f3f4f6; }
.skeleton-lines{ display:grid; gap:10px; }
.skeleton-lines .line{ height:12px; background:#f3f4f6; border-radius:6px; }

/* 高度受限设备进一步压缩 */
@media (max-height: 860px){
  .profile-page{ padding-top: 10px; padding-bottom: 10px; }
  .photo-hero{ max-height: clamp(280px, 44vh, 420px); }
}
@media (max-height: 760px){
  .photo-hero{ max-height: clamp(240px, 40vh, 380px); }
  .name-fluid{ font-size: clamp(16px, 1.2vw + 1vh, 20px); }
}

/* Lightbox 预览 */
.lightbox{ position: fixed; inset:0; background: rgba(0,0,0,.8); display:flex; align-items:center; justify-content:center; z-index: 9999; animation: fadeIn .2s ease-out; }
.lightbox img{ max-width: 92vw; max-height: 92vh; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,.4); }
.lightbox .close{ position:absolute; top:16px; right:20px; background: rgba(255,255,255,.18); color:#fff; border:1px solid rgba(255,255,255,.4); border-radius:999px; width:36px; height:36px; display:grid; place-items:center; }
</style>
