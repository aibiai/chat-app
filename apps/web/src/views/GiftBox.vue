<template>
  <div class="container mx-auto px-3 py-4 giftbox-page min-h-[calc(100vh-72px)]">
    <div class="bg-white rounded-2xl border p-4 md:p-5 mb-4 header shadow-sm">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h1 class="title">{{ t('giftBox.title') }}</h1>
          <p class="sub">{{ t('giftBox.subtitle') }}</p>
        </div>
  <a href="#/gifts" class="px-4 py-2 rounded-full bg-rose-500 text-white font-bold hover:brightness-105">{{ t('giftBox.toMall') }}</a>
      </div>
    </div>

    <div class="grid grid-cols-12 gap-4">
      <!-- 收到礼物 -->
      <section class="col-span-12 lg:col-span-6">
        <div class="section-card">
          <div class="section-head">
            <div class="left">
              <h2 class="section-title">{{ t('giftBox.received') }}</h2>
              <span class="badge" v-if="rCount>0">{{ rCount }} {{ t('giftBox.countUnit') }} · ¥ {{ rTotal }}</span>
            </div>
            <div class="right">
              <button class="btn-ghost" @click="loadReceived" :disabled="loadingR">{{ t('giftBox.refresh') }}</button>
            </div>
          </div>
          <div v-if="loadingR" class="text-center text-gray-500 py-10">{{ t('common.loading') }}</div>
          <div v-else-if="errorR" class="text-center text-red-500 py-10">{{ errorR }}</div>
          <ul v-else-if="received.length" class="space-y-3">
            <li v-for="it in received" :key="it.id" class="gift-item">
              <div class="left">
                <div class="thumb"><img :src="it.giftImg" :alt="it.giftName"/></div>
              </div>
              <div class="mid">
                <div class="row-1">
                  <div class="gift-name">{{ it.giftName }}</div>
                  <div class="time">{{ formatRelative(it.createdAt) }}</div>
                </div>
                <div class="row-2">
                  <div class="peer">
                    <AvatarImg :gender="getGender(it.fromUserId)" :size="22" />
                    <span class="label">{{ t('giftBox.from') }}</span>
                    <span class="name">{{ displayName(it.fromUserId) }}</span>
                  </div>
                </div>
              </div>
              <div class="right">
                <div class="price">¥ {{ it.price }}</div>
                <button class="btn-primary btn-sm" @click="reciprocate(it.fromUserId)">{{ t('giftBox.reciprocate') }}</button>
              </div>
            </li>
          </ul>
          <div v-else class="empty">
            <div class="emoji">🎁</div>
            <div class="tip">{{ t('giftBox.emptyReceived') }}</div>
            <a href="#/gifts" class="btn-primary mt-2 inline-block">{{ t('giftBox.goMall') }}</a>
          </div>
        </div>
      </section>

      <!-- 送出礼物 -->
      <section class="col-span-12 lg:col-span-6">
        <div class="section-card">
          <div class="section-head">
            <div class="left">
              <h2 class="section-title">{{ t('giftBox.sent') }}</h2>
              <span class="badge" v-if="sCount>0">{{ sCount }} {{ t('giftBox.countUnit') }} · ¥ {{ sTotal }}</span>
            </div>
            <div class="right">
              <button class="btn-ghost" @click="loadSent" :disabled="loadingS">{{ t('giftBox.refresh') }}</button>
            </div>
          </div>
          <div v-if="loadingS" class="text-center text-gray-500 py-10">{{ t('common.loading') }}</div>
          <div v-else-if="errorS" class="text-center text-red-500 py-10">{{ errorS }}</div>
          <ul v-else-if="sent.length" class="space-y-3">
            <li v-for="it in sent" :key="it.id" class="gift-item">
              <div class="left">
                <div class="thumb"><img :src="it.giftImg" :alt="it.giftName"/></div>
              </div>
              <div class="mid">
                <div class="row-1">
                  <div class="gift-name">{{ it.giftName }}</div>
                  <div class="time">{{ formatRelative(it.createdAt) }}</div>
                </div>
                <div class="row-2">
                  <div class="peer">
                    <AvatarImg :gender="getGender(it.toUserId)" :size="22" />
                    <span class="label">{{ t('giftBox.to') }}</span>
                    <span class="name">{{ displayName(it.toUserId) }}</span>
                  </div>
                </div>
              </div>
              <div class="right">
                <div class="price">¥ {{ it.price }}</div>
              </div>
            </li>
          </ul>
          <div v-else class="empty">
            <div class="emoji">🎁</div>
            <div class="tip">{{ t('giftBox.emptySent') }}</div>
            <a href="#/gifts" class="btn-primary mt-2 inline-block">{{ t('giftBox.goFirstGift') }}</a>
          </div>
        </div>
      </section>
    </div>
  </div>
  </template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'
import AvatarImg from '../components/AvatarImg.vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

type RecordItem = { id:string; fromUserId:string; toUserId:string; giftId:string; giftName:string; giftImg:string; price:number; createdAt:number }
type PeerLite = { id:string; nickname?:string; gender?:'male'|'female'|'other' }

const router = useRouter()
const received = ref<RecordItem[]>([])
const sent = ref<RecordItem[]>([])
const peers = ref<Record<string, PeerLite>>({})
const loadingR = ref(false)
const loadingS = ref(false)
const errorR = ref('')
const errorS = ref('')

function displayName(uid: string){
  const p = peers.value?.[uid]
  return p?.nickname || uid
}
function getGender(uid: string){
  return (peers.value?.[uid]?.gender || 'other') as 'male'|'female'|'other'
}

function isToday(ts:number){ const d=new Date(ts); const n=new Date(); return d.getFullYear()===n.getFullYear() && d.getMonth()===n.getMonth() && d.getDate()===n.getDate() }
function isYesterday(ts:number){ const n=new Date(); const y=new Date(n.getFullYear(), n.getMonth(), n.getDate()-1); const d=new Date(ts); return d.getFullYear()===y.getFullYear() && d.getMonth()===y.getMonth() && d.getDate()===y.getDate() }
function pad2(n:number){ return String(n).padStart(2,'0') }
function formatRelative(ts:number){
  const d = new Date(ts)
  const hh = pad2(d.getHours()); const mm = pad2(d.getMinutes())
  if (isToday(ts)) return `${t('chat.time.today')} ${hh}:${mm}`
  if (isYesterday(ts)) return `${t('chat.time.yesterday')} ${hh}:${mm}`
  return `${pad2(d.getMonth()+1)}-${pad2(d.getDate())} ${hh}:${mm}`
}

async function loadReceived(){
  loadingR.value = true; errorR.value = ''
  try{
    const { data } = await api.get('/api/gifts/records', { params: { type: 'received', page: 1, pageSize: 50 } })
    received.value = (data?.list || []) as RecordItem[]
    peers.value = { ...peers.value, ...(data?.peers || {}) }
  }catch{ errorR.value = t('common.loadFailed') }
  finally{ loadingR.value = false }
}

async function loadSent(){
  loadingS.value = true; errorS.value = ''
  try{
    const { data } = await api.get('/api/gifts/records', { params: { type: 'sent', page: 1, pageSize: 50 } })
    sent.value = (data?.list || []) as RecordItem[]
    peers.value = { ...peers.value, ...(data?.peers || {}) }
  }catch{ errorS.value = t('common.loadFailed') }
  finally{ loadingS.value = false }
}

function reciprocate(fromUserId: string){
  router.push(`/gifts?to=${encodeURIComponent(fromUserId)}`)
}

onMounted(() => { loadReceived(); loadSent() })

// 统计
const rCount = computed(() => received.value.length)
const sCount = computed(() => sent.value.length)
const rTotal = computed(() => received.value.reduce((s, it) => s + (Number(it.price)||0), 0))
const sTotal = computed(() => sent.value.reduce((s, it) => s + (Number(it.price)||0), 0))
</script>

<style scoped>
.giftbox-page .title{ font-weight:900; font-size: clamp(20px, 1.2vw + 1.2vh, 26px); }
.giftbox-page .sub{ color:#6b7280; }

.section-card{ background:#fff; border:1px solid #e5e7eb; border-radius:16px; padding:14px; box-shadow:0 4px 12px rgba(0,0,0,.04); }
.section-head{ display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
.section-head .left{ display:flex; align-items:center; gap:10px; }
.section-title{ font-weight:900; }
.badge{ display:inline-flex; align-items:center; gap:6px; padding:4px 10px; border-radius:999px; background:#fff5f7; color:#e11d48; font-weight:900; border:1px solid #ffe4e9; font-size:12px; }
.btn-ghost{ padding:6px 10px; border-radius:10px; background:#f8fafc; border:1px solid #e5e7eb; font-weight:800; }
.btn-ghost:disabled{ opacity:.6; }
.btn-primary{ padding:8px 12px; border-radius:10px; background: var(--brand-main, #e67a88); color:#fff; font-weight:900; border:0; }
.btn-primary.btn-sm{ padding:6px 10px; border-radius:9px; font-size:13px; }

.gift-item{ display:grid; grid-template-columns: 56px 1fr auto; gap:12px; align-items:center; padding:10px; border:1px solid #eef2f7; border-radius:12px; background:#fff; }
.gift-item:hover{ background:#fffdfd; box-shadow:0 2px 10px rgba(0,0,0,.03); }
.thumb{ width:56px; height:56px; border-radius:14px; display:grid; place-items:center; background:linear-gradient(135deg,#fff5f7,#fef3c7); overflow:hidden; border:1px solid #f1f5f9; }
.thumb img{ width:38px; height:38px; object-fit:contain; }
.mid{ min-width:0; }
.row-1{ display:flex; align-items:center; justify-content:space-between; gap:8px; }
.gift-name{ font-weight:900; color:#111; }
.time{ color:#94a3b8; font-size:12px; font-weight:700; white-space:nowrap; }
.row-2{ margin-top:2px; display:flex; align-items:center; justify-content:space-between; }
.peer{ display:inline-flex; align-items:center; gap:6px; color:#6b7280; font-size:12px; font-weight:700; }
.peer .label{ color:#94a3b8; }
.peer .name{ color:#111827; font-weight:900; }
.right{ display:flex; align-items:center; gap:10px; }
.price{ color: var(--brand-main, #e67a88); font-weight:900; }

.empty{ text-align:center; color:#6b7280; padding:24px 10px; }
.empty .emoji{ font-size:28px; }
.empty .tip{ margin-top:6px; }
</style>
