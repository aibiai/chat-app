<template>
  <div class="container mx-auto px-3 py-4 gifts-page min-h-[calc(100vh-72px)]">
    <div class="bg-white rounded border p-4 mb-4 header">
      <h1 class="title">{{ t('giftsMall.title') }}</h1>
      <p class="sub">{{ t('giftsMall.subtitle') }}</p>
    </div>

    <div class="grid grid-cols-12 gap-4">
      <div class="col-span-12 lg:col-span-9">
        <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          <div v-for="g in gifts" :key="g.id" class="gift-card">
            <div class="thumb">
              <img :src="g.img" :alt="g.name" referrerpolicy="no-referrer" />
            </div>
            <div class="meta">
              <div class="name">{{ g.name }}</div>
              <div class="price">¥ {{ g.price }}</div>
            </div>
            <button class="btn-buy" @click="openSendModal(g)">{{ t('giftsMall.send') }}</button>
          </div>
        </div>
      </div>
      <div class="col-span-12 lg:col-span-3">
        <div class="bg-white rounded border p-3">
          <h3 class="font-semibold mb-2">{{ t('giftsMall.tipsTitle') }}</h3>
          <p class="text-gray-600 text-sm leading-snug">{{ t('giftsMall.tipsDesc') }}</p>
        </div>
      </div>
    </div>
  </div>
  
  <!-- 送礼弹窗 -->
  <div v-if="sendOpen" class="modal-mask" @click.self="sendOpen=false">
    <div class="modal">
      <div class="modal-head">
        <h3>{{ meGender==='male' ? t('giftsMall.modal.toHer') : meGender==='female' ? t('giftsMall.modal.toHim') : t('giftsMall.modal.toUser') }}</h3>
        <button class="close" @click="sendOpen=false">×</button>
      </div>
      <div class="modal-body">
        <div class="chosen">
          <div class="thumb"><img :src="selectedGift?.img" :alt="selectedGift?.name"></div>
          <div class="meta">
            <div class="name">{{ selectedGift?.name }}</div>
            <div class="price">¥ {{ selectedGift?.price }}</div>
          </div>
        </div>
        <label class="field">
          <span class="label">{{ t('giftsMall.modal.nickname') }}</span>
          <input v-model.trim="toNickname" :placeholder="t('giftsMall.modal.nicknamePlaceholder')" @keyup.enter="confirmSend" />
        </label>
        <p v-if="sendError" class="error">{{ sendError }}</p>
      </div>
      <div class="modal-actions">
        <button class="btn" @click="sendOpen=false">{{ t('common.cancel') }}</button>
        <button class="btn primary" :disabled="sending" @click="confirmSend">{{ sending ? t('common.submitting') : t('giftsMall.modal.submit') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import api from '../api'

interface Gift { id: string; name: string; price: number; img: string }
const route = useRoute()
const router = useRouter()
const gifts = ref<Gift[]>([])
const { t } = useI18n()
const meGender = ref<'male'|'female'|'other'>('other')
const sendOpen = ref(false)
const selectedGift = ref<Gift | null>(null)
const toNickname = ref('')
const sendError = ref('')
const sending = ref(false)

async function loadCatalog(){
  try{ const { data } = await api.get('/api/gifts/catalog'); gifts.value = data?.list || [] }catch{}
}

function openSendModal(g: Gift){
  selectedGift.value = g
  toNickname.value = ''
  sendError.value = ''
  sendOpen.value = true
}

async function confirmSend(){
  if (!selectedGift.value) return
  sendError.value = ''
  const nick = toNickname.value.trim()
  if (!nick) { sendError.value = t('form.error.required') as string; return }
  try{
    sending.value = true
    const { data: user } = await api.get('/api/users/lookup', { params: { nickname: nick } })
    if (!user || !user.id) { sendError.value = t('giftsMall.modal.userNotFound') as string; sending.value=false; return }
    await api.post('/api/gifts/send', { toUserId: user.id, giftId: selectedGift.value.id })
    alert(t('giftsMall.modal.sentSuccess'))
    sendOpen.value = false
    router.push('/gift-box')
  }catch(e:any){
    const status = e?.response?.status
    if (status === 404) sendError.value = t('giftsMall.modal.userNotFound') as string
    else sendError.value = e?.response?.data?.error || (t('giftsMall.sendFailed') as string)
  } finally {
    sending.value = false
  }
}

async function loadMe(){
  try { const { data } = await api.get('/api/users/me'); const g = String(data?.gender||'other'); meGender.value = (g==='male'||g==='female') ? g : 'other' } catch {}
}

onMounted(() => { loadCatalog(); loadMe() })
</script>

<style scoped>
.gifts-page .title{ font-weight:900; font-size: clamp(20px, 1.2vw + 1.2vh, 26px); }
.gifts-page .sub{ color:#6b7280; }
.gift-card{ background:#fff; border:1px solid #e5e7eb; border-radius:14px; padding:12px; display:flex; flex-direction:column; gap:10px; box-shadow:0 4px 14px rgba(0,0,0,.06); }
.gift-card .thumb{ display:grid; place-items:center; height:120px; background:linear-gradient(135deg,#fff5f7,#fef3c7); border-radius:12px; overflow:hidden; }
.gift-card .thumb img{ width:80px; height:80px; object-fit:contain; }
.gift-card .meta{ display:flex; align-items:center; justify-content:space-between; font-weight:800; }
.gift-card .name{ color:#111827; }
.gift-card .price{ color: var(--brand-main, #e67a88); }
.btn-buy{ height:34px; border-radius:10px; background: var(--brand-main, #e67a88); color:#fff; font-weight:800; padding: 0 10px; font-size:12px; white-space:nowrap; }
.btn-buy:hover{ filter:brightness(1.06); }

/* 送礼弹窗样式 */
.modal-mask{ position:fixed; inset:0; background:rgba(0,0,0,.45); display:grid; place-items:center; z-index:50; }
.modal{ width:min(520px,92vw); background:#fff; border-radius:12px; border:1px solid #e5e7eb; box-shadow:0 12px 32px rgba(0,0,0,.18); padding:14px; }
.modal-head{ display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
.modal-head h3{ font-size:16px; font-weight:900; }
.close{ border:0; background:transparent; font-size:20px; cursor:pointer; }
.modal-body{ display:grid; gap:10px; }
.chosen{ display:flex; align-items:center; gap:10px; padding:8px; border:1px solid #f1f5f9; border-radius:10px; background:#fff; }
.chosen .thumb{ width:56px; height:56px; border-radius:12px; display:grid; place-items:center; background:linear-gradient(135deg,#fff5f7,#fef3c7); overflow:hidden; border:1px solid #f1f5f9; }
.chosen .thumb img{ width:40px; height:40px; object-fit:contain; }
.chosen .meta .name{ font-weight:900; }
.chosen .meta .price{ color:#e67a88; font-weight:900; }
.field{ display:grid; gap:6px; }
.field .label{ font-weight:800; color:#444; }
.field input{ height:38px; border-radius:8px; border:1px solid #e5e7eb; padding:0 10px; font-weight:700; }
.error{ color:#dc2626; font-weight:800; }
.modal-actions{ display:flex; justify-content:flex-end; gap:10px; margin-top:6px; }
.btn{ height:36px; padding:0 14px; border-radius:8px; border:1px solid #e5e7eb; background:#f9fafb; font-weight:800; }
.btn.primary{ background:#e67a88; color:#fff; border-color:#e67a88; }
</style>
