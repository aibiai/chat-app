<template>
  <div class="container mx-auto px-3 py-4 gifts-page">
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
            <button class="btn-buy" @click="sendGift(g)">{{ t('giftsMall.send') }}</button>
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
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import api from '../api'

interface Gift { id: string; name: string; price: number; img: string }
const route = useRoute()
const router = useRouter()
const toId = (route.query.to as string) || ''
const gifts = ref<Gift[]>([])
const { t } = useI18n()

async function loadCatalog(){
  try{ const { data } = await api.get('/api/gifts/catalog'); gifts.value = data?.list || [] }catch{}
}

async function sendGift(g: Gift){
  if (!toId){
    alert(t('giftsMall.alertChooseTarget'));
    return;
  }
  try{
    await api.post('/api/gifts/send', { toUserId: toId, giftId: g.id })
    alert(t('giftsMall.sentTo', { id: toId, name: g.name }))
    // 送出后可跳转到设置-礼物盒子查看
    router.push('/settings')
  }catch(e:any){
    const msg = e?.response?.data?.error || t('giftsMall.sendFailed')
    alert(msg)
  }
}

onMounted(loadCatalog)
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
</style>
